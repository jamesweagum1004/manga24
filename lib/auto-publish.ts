import "server-only";
import { and, asc, isNotNull, isNull, sql } from "drizzle-orm";
import { titles } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { getTitlePublishingState, publishTitle } from "@/lib/db/queries/media";
import { publishDbChaptersWithPagesForTitles } from "@/lib/db/queries/chapters";
import { getSiteSettings, markAutoPublishScheduleRun } from "@/lib/db/queries/settings";
import { locales, type Locale } from "@/lib/i18n";
import { getPublishedTitleUrls, submitIndexNow } from "@/lib/search-indexing";

export type AutoPublishResult = { locale: Locale; published: number; skipped: number };

export async function runDueAutoPublishSchedules(now = new Date()): Promise<AutoPublishResult[]> {
  const settings = await getSiteSettings();
  const results: AutoPublishResult[] = [];
  for (const locale of locales) {
    const schedule = settings.autoPublishSchedules[locale];
    if (!schedule.enabled || !isDue(schedule.lastRunAt, schedule.intervalMinutes, now)) continue;
    const result = await publishReadyTitlesForLocale(locale, schedule.batchSize);
    await markAutoPublishScheduleRun(locale, now.toISOString());
    results.push({ locale, ...result });
  }
  return results;
}

async function publishReadyTitlesForLocale(locale: Locale, batchSize: number) {
  const candidates = await getDb().select({ id: titles.id }).from(titles)
    .where(and(
      isNull(titles.publishedAt),
      isNotNull(titles.aiContentGeneratedAt),
      sql`${titles.displayLocales} @> ${JSON.stringify([locale])}::jsonb`
    ))
    .orderBy(asc(titles.aiContentGeneratedAt), asc(titles.createdAt))
    .limit(Math.min(500, batchSize * 20));

  const publishedIds: string[] = [];
  let skipped = 0;
  for (const candidate of candidates) {
    if (publishedIds.length >= batchSize) break;
    try {
      await publishDbChaptersWithPagesForTitles([candidate.id]);
      const state = await getTitlePublishingState(candidate.id);
      if (!state?.ready) { skipped += 1; continue; }
      await publishTitle(candidate.id);
      publishedIds.push(candidate.id);
    } catch (error) {
      skipped += 1;
      console.error("Automatic title publish failed", { locale, titleId: candidate.id, error });
    }
  }

  if (publishedIds.length > 0) {
    await submitIndexNow(await getPublishedTitleUrls(publishedIds));
  }
  return { published: publishedIds.length, skipped };
}

function isDue(lastRunAt: string | null, intervalMinutes: number, now: Date) {
  if (!lastRunAt) return true;
  const lastRun = new Date(lastRunAt).getTime();
  return !Number.isFinite(lastRun) || now.getTime() - lastRun >= intervalMinutes * 60_000;
}

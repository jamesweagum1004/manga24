import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { chapters, titles } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { siteUrl } from "@/lib/metadata";

const indexNowEndpoint = "https://api.indexnow.org/indexnow";
const maxUrlsPerRequest = 10_000;
const requestTimeoutMs = 5_000;

export async function getPublishedTitleUrls(titleIds: string[]) {
  try {
    return await queryPublishedTitleUrls(titleIds);
  } catch (error) {
    console.error("Unable to prepare title URLs for IndexNow", error);
    return [];
  }
}

async function queryPublishedTitleUrls(titleIds: string[]) {
  const ids = [...new Set(titleIds)];
  if (ids.length === 0) return [];
  const [settings, titleRows, chapterRows] = await Promise.all([
    getSiteSettings(),
    getDb().select({ id: titles.id, slug: titles.slug, displayLocales: titles.displayLocales })
      .from(titles).where(and(inArray(titles.id, ids), isNotNull(titles.publishedAt))),
    getDb().select({ titleId: chapters.titleId, slug: chapters.slug })
      .from(chapters).where(and(inArray(chapters.titleId, ids), eq(chapters.publicationStatus, "published")))
  ]);
  const chaptersByTitle = new Map<string, string[]>();
  for (const chapter of chapterRows) {
    const slugs = chaptersByTitle.get(chapter.titleId) ?? [];
    slugs.push(chapter.slug);
    chaptersByTitle.set(chapter.titleId, slugs);
  }
  const urls: string[] = [];
  for (const title of titleRows) {
    const locales = settings.enabledLocales.filter((locale) => title.displayLocales.includes(locale));
    for (const locale of locales) {
      urls.push(siteUrl(`/${locale}/manga/${title.slug}`));
      for (const chapterSlug of chaptersByTitle.get(title.id) ?? []) {
        urls.push(siteUrl(`/${locale}/manga/${title.slug}/chapter/${chapterSlug}`));
      }
    }
  }
  return uniqueUrls(urls);
}

export async function getPublishedChapterUrls(chapterIds: string[]) {
  try {
    return await queryPublishedChapterUrls(chapterIds);
  } catch (error) {
    console.error("Unable to prepare chapter URLs for IndexNow", error);
    return [];
  }
}

async function queryPublishedChapterUrls(chapterIds: string[]) {
  const ids = [...new Set(chapterIds)];
  if (ids.length === 0) return [];
  const [settings, rows] = await Promise.all([
    getSiteSettings(),
    getDb().select({ slug: chapters.slug, titleSlug: titles.slug, displayLocales: titles.displayLocales })
      .from(chapters).innerJoin(titles, eq(chapters.titleId, titles.id))
      .where(and(inArray(chapters.id, ids), eq(chapters.publicationStatus, "published"), isNotNull(titles.publishedAt)))
  ]);
  return uniqueUrls(rows.flatMap((row) => settings.enabledLocales
    .filter((locale) => row.displayLocales.includes(locale))
    .map((locale) => siteUrl(`/${locale}/manga/${row.titleSlug}/chapter/${row.slug}`))));
}

export async function submitIndexNow(urls: string[]) {
  try {
    const settings = await getSiteSettings();
    if (!settings.indexnowEnabled || !settings.indexnowKey) return;
    const base = new URL(siteUrl());
    const urlList = uniqueUrls(urls).filter((url) => {
      try { return new URL(url).hostname === base.hostname; } catch { return false; }
    });
    for (let offset = 0; offset < urlList.length; offset += maxUrlsPerRequest) {
      const batch = urlList.slice(offset, offset + maxUrlsPerRequest);
      const response = await fetch(indexNowEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: base.hostname,
          key: settings.indexnowKey,
          keyLocation: siteUrl("/indexnow-key.txt"),
          urlList: batch
        }),
        signal: AbortSignal.timeout(requestTimeoutMs),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`IndexNow returned HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("IndexNow submission failed", error);
  }
}

export function uniqueUrls(urls: string[]) {
  return [...new Set(urls)];
}

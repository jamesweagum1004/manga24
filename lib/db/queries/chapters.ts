import { asc, eq, inArray } from "drizzle-orm";
import { chapterLocalizations, chapterPages, chapters, titles } from "@/db/schema";
import type { DemoTitle } from "@/lib/demo-data";
import { getDb } from "../client";
import { getDbTitleBySlug } from "./titles";

export type AdminChapterListItem = {
  id: string;
  titleId: string;
  title: string;
  format: "manga" | "manhwa";
  chapterNumber: string;
  canonicalSlug: string;
  publicationStatus: string;
  publicationStatusValue: "draft" | "scheduled" | "published" | "archived";
  pageCount: number;
  updatedAt: string;
  updatedAtValue: number;
};

export type ChapterFormValues = {
  titleId: string;
  chapterNumber: string;
  canonicalSlug: string;
  publicationStatus: "draft" | "scheduled" | "published" | "archived";
  enTitle: string;
  esTitle: string;
  frTitle: string;
  deTitle: string;
  ptTitle: string;
};

export const emptyChapterFormValues: ChapterFormValues = {
  titleId: "",
  chapterNumber: "1",
  canonicalSlug: "chapter-1",
  publicationStatus: "draft",
  enTitle: "Chapter 1",
  esTitle: "Capítulo 1",
  frTitle: "Chapitre 1",
  deTitle: "Kapitel 1",
  ptTitle: "Capítulo 1"
};

export async function getDbChapterBySlug(titleSlug: string, chapterSlug: string) {
  const title = await getDbTitleBySlug(titleSlug);
  if (!title) {
    return null;
  }

  const chapter = title.chapters.find((item) => item.slug === chapterSlug);
  return chapter ? { title, chapter } : null;
}

export async function listDbAdminChapters(titleId?: string): Promise<AdminChapterListItem[]> {
  const query = getDb()
    .select({
      id: chapters.id,
      titleId: chapters.titleId,
      title: titles.originalTitle,
      format: titles.format,
      chapterNumber: chapters.chapterNumber,
      canonicalSlug: chapters.slug,
      publicationStatus: chapters.publicationStatus,
      updatedAt: chapters.updatedAt
    })
    .from(chapters)
    .innerJoin(titles, eq(chapters.titleId, titles.id));
  const chapterRows = titleId
    ? await query.where(eq(chapters.titleId, titleId)).orderBy(asc(chapters.chapterNumber))
    : await query.orderBy(asc(titles.originalTitle), asc(chapters.chapterNumber));

  if (chapterRows.length === 0) {
    return [];
  }

  const pageRows = await getDb()
    .select({
      chapterId: chapterPages.chapterId,
      id: chapterPages.id
    })
    .from(chapterPages)
    .where(inArray(chapterPages.chapterId, chapterRows.map((chapter) => chapter.id)));
  const pageCounts = new Map<string, number>();

  for (const page of pageRows) {
    pageCounts.set(page.chapterId, (pageCounts.get(page.chapterId) ?? 0) + 1);
  }

  return chapterRows.map((chapter) => ({
    ...chapter,
    chapterNumber: formatChapterNumber(chapter.chapterNumber),
    publicationStatus: displayPublicationStatus(chapter.publicationStatus),
    publicationStatusValue: chapter.publicationStatus,
    pageCount: pageCounts.get(chapter.id) ?? 0,
    updatedAt: formatDateTime(chapter.updatedAt),
    updatedAtValue: chapter.updatedAt.getTime()
  }));
}

export async function getDbChapterForAdmin(id: string) {
  const [chapter] = await getDb().select().from(chapters).where(eq(chapters.id, id)).limit(1);
  if (!chapter) return null;
  const [localizations, pages] = await Promise.all([
    getDb().select().from(chapterLocalizations).where(eq(chapterLocalizations.chapterId, id)),
    getDb().select({ id: chapterPages.id }).from(chapterPages).where(eq(chapterPages.chapterId, id))
  ]);
  const en = localizations.find((item) => item.locale === "en");
  const es = localizations.find((item) => item.locale === "es");
  const fr = localizations.find((item) => item.locale === "fr");
  const de = localizations.find((item) => item.locale === "de");
  const pt = localizations.find((item) => item.locale === "pt");
  return {
    id: chapter.id,
    pageCount: pages.length,
    values: {
      titleId: chapter.titleId,
      chapterNumber: formatChapterNumber(chapter.chapterNumber),
      canonicalSlug: chapter.slug,
      publicationStatus: chapter.publicationStatus,
      enTitle: en?.title ?? `Chapter ${formatChapterNumber(chapter.chapterNumber)}`,
      esTitle: es?.title ?? `Capítulo ${formatChapterNumber(chapter.chapterNumber)}`,
      frTitle: fr?.title ?? `Chapitre ${formatChapterNumber(chapter.chapterNumber)}`,
      deTitle: de?.title ?? `Kapitel ${formatChapterNumber(chapter.chapterNumber)}`,
      ptTitle: pt?.title ?? `Capítulo ${formatChapterNumber(chapter.chapterNumber)}`
    } satisfies ChapterFormValues
  };
}

export async function createDbChapter(values: ChapterFormValues) {
  return getDb().transaction(async (tx) => {
    const now = new Date();
    const [chapter] = await tx.insert(chapters).values({
      titleId: values.titleId,
      chapterNumber: values.chapterNumber,
      slug: values.canonicalSlug,
      publicationStatus: values.publicationStatus,
      publishedAt: values.publicationStatus === "published" ? now : null
    }).returning({ id: chapters.id });
    await tx.insert(chapterLocalizations).values((["en", "es", "fr", "de", "pt"] as const).map((locale) => ({ chapterId: chapter.id, locale, title: values[`${locale}Title`] })));
    return chapter.id;
  });
}

export async function updateDbChapter(id: string, values: ChapterFormValues) {
  return getDb().transaction(async (tx) => {
    const now = new Date();
    const [current] = await tx.select({ publishedAt: chapters.publishedAt }).from(chapters).where(eq(chapters.id, id)).limit(1);
    await tx.update(chapters).set({
      titleId: values.titleId,
      chapterNumber: values.chapterNumber,
      slug: values.canonicalSlug,
      publicationStatus: values.publicationStatus,
      publishedAt: values.publicationStatus === "published" ? current?.publishedAt ?? now : null,
      updatedAt: now
    }).where(eq(chapters.id, id));
    for (const locale of ["en", "es", "fr", "de", "pt"] as const) {
      const title = values[`${locale}Title`];
      await tx.insert(chapterLocalizations).values({ chapterId: id, locale, title, updatedAt: now }).onConflictDoUpdate({
        target: [chapterLocalizations.chapterId, chapterLocalizations.locale],
        set: { title, updatedAt: now }
      });
    }
  });
}

export async function setDbChapterPublicationStatus(id: string, publicationStatus: "draft" | "published") {
  const now = new Date();
  await getDb().update(chapters).set({
    publicationStatus,
    publishedAt: publicationStatus === "published" ? now : null,
    updatedAt: now
  }).where(eq(chapters.id, id));
}

export function adminChapterListFromDemoTitles(demoTitles: DemoTitle[]): AdminChapterListItem[] {
  return demoTitles.flatMap((title) =>
    title.chapters.map((chapter) => ({
      id: `${title.slug}:${chapter.slug}`,
      titleId: title.slug,
      title: title.originalTitle,
      format: "manga",
      chapterNumber: formatChapterNumber(String(chapter.number)),
      canonicalSlug: chapter.slug,
      publicationStatus: "Published",
      publicationStatusValue: "published",
      pageCount: chapter.pages.length,
      updatedAt: chapter.publishedAt,
      updatedAtValue: new Date(chapter.publishedAt).getTime()
    }))
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

function formatChapterNumber(value: string) {
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : value;
}

function displayPublicationStatus(status: "draft" | "scheduled" | "published" | "archived") {
  const labels = {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived"
  };

  return labels[status];
}

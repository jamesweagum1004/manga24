import { asc, eq, inArray } from "drizzle-orm";
import { chapterPages, chapters, titles } from "@/db/schema";
import type { DemoTitle } from "@/lib/demo-data";
import { getDb } from "../client";
import { getDbTitleBySlug } from "./titles";

export type AdminChapterListItem = {
  id: string;
  title: string;
  chapterNumber: string;
  canonicalSlug: string;
  publicationStatus: string;
  pageCount: number;
};

export async function getDbChapterBySlug(titleSlug: string, chapterSlug: string) {
  const title = await getDbTitleBySlug(titleSlug);
  if (!title) {
    return null;
  }

  const chapter = title.chapters.find((item) => item.slug === chapterSlug);
  return chapter ? { title, chapter } : null;
}

export async function listDbAdminChapters(): Promise<AdminChapterListItem[]> {
  const chapterRows = await getDb()
    .select({
      id: chapters.id,
      titleId: chapters.titleId,
      title: titles.originalTitle,
      chapterNumber: chapters.chapterNumber,
      canonicalSlug: chapters.slug,
      publicationStatus: chapters.publicationStatus
    })
    .from(chapters)
    .innerJoin(titles, eq(chapters.titleId, titles.id))
    .orderBy(asc(titles.originalTitle), asc(chapters.chapterNumber));

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
    pageCount: pageCounts.get(chapter.id) ?? 0
  }));
}

export function adminChapterListFromDemoTitles(demoTitles: DemoTitle[]): AdminChapterListItem[] {
  return demoTitles.flatMap((title) =>
    title.chapters.map((chapter) => ({
      id: `${title.slug}:${chapter.slug}`,
      title: title.originalTitle,
      chapterNumber: formatChapterNumber(String(chapter.number)),
      canonicalSlug: chapter.slug,
      publicationStatus: "Published",
      pageCount: chapter.pages.length
    }))
  );
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

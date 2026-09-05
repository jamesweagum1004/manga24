import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { chapters, tags, titleTags, titles } from "@/db/schema";
import { getDb } from "@/lib/db/client";

export async function listSitemapTitles() {
  return getDb().select({ id: titles.id, slug: titles.slug, displayLocales: titles.displayLocales, publishedAt: titles.publishedAt, updatedAt: titles.updatedAt })
    .from(titles).where(isNotNull(titles.publishedAt));
}

export async function listSitemapChapters() {
  return getDb().select({ titleSlug: titles.slug, displayLocales: titles.displayLocales, slug: chapters.slug, publishedAt: chapters.publishedAt, updatedAt: chapters.updatedAt })
    .from(chapters).innerJoin(titles, eq(chapters.titleId, titles.id))
    .where(and(isNotNull(titles.publishedAt), eq(chapters.publicationStatus, "published")));
}

export async function listSitemapTags() {
  return getDb().select({ slug: tags.slug, displayLocales: titles.displayLocales, updatedAt: tags.updatedAt })
    .from(titleTags).innerJoin(tags, eq(titleTags.tagId, tags.id)).innerJoin(titles, eq(titleTags.titleId, titles.id))
    .where(isNotNull(titles.publishedAt));
}

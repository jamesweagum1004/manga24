import { cache } from "react";
import { unstable_cache } from "next/cache";
import { demoTags, demoTitles, findChapter, findTitle, latestTitles, popularTitles } from "@/lib/demo-data";
import {
  adminChapterListFromDemoTitles,
  getDbChapterBySlug,
  listDbAdminChapters
} from "@/lib/db/queries/chapters";
import { adminTagListFromDemoTags, listDbAdminTags, listDbPublicTags } from "@/lib/db/queries/tags";
import {
  adminTitleListFromDemoTitles,
  getDbTitleForAdmin,
  getDbTitleBySlug,
  listDbAdminTitles,
  listDbRecentTitleViews,
  listDbTitles,
  titleFormValuesFromDemoTitle
} from "@/lib/db/queries/titles";
import { hasDatabaseUrl } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

export const databaseNotConfiguredMessage = "Database is not configured. Set DATABASE_URL to enable writes.";

export function isDatabaseConfigured() {
  return hasDatabaseUrl();
}

export function getActiveDataSource() {
  return isDatabaseConfigured() ? "database" : "demo";
}

const getCachedDbCatalogTitles = unstable_cache(
  async () => listDbTitles(),
  ["public-catalog-titles"],
  { revalidate: 60, tags: ["public-catalog"] }
);

const getAllCatalogTitles = cache(async () => isDatabaseConfigured() ? getCachedDbCatalogTitles() : demoTitles);

export async function getCatalogTitles(locale?: Locale) {
  if (isDatabaseConfigured()) {
    return filterByLocale(await getAllCatalogTitles(), locale);
  }

  return filterByLocale(await getAllCatalogTitles(), locale);
}

export async function getAdminTitleList() {
  if (isDatabaseConfigured()) {
    return listDbAdminTitles();
  }

  return adminTitleListFromDemoTitles(demoTitles);
}

export async function getLatestCatalogTitles(locale?: Locale) {
  if (isDatabaseConfigured()) {
    const titles = await getAllCatalogTitles();
    return filterByLocale([...titles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), locale);
  }

  return filterByLocale(latestTitles(), locale);
}

export async function getPopularCatalogTitles(locale?: Locale) {
  if (isDatabaseConfigured()) {
    const titles = await getAllCatalogTitles();
    return filterByLocale([...titles].sort((a, b) => b.viewCount - a.viewCount), locale);
  }

  return filterByLocale(popularTitles(), locale);
}

export async function getRecentPopularCatalogTitles(locale: Locale, hours: number) {
  const catalog = await getCatalogTitles(locale);
  if (!isDatabaseConfigured()) return [...catalog].sort((a, b) => b.viewCount - a.viewCount);

  const rows = await listDbRecentTitleViews(new Date(Date.now() - hours * 60 * 60 * 1000));
  const recentViews = new Map(rows.map((row) => [row.slug, row.views]));
  return [...catalog].sort((left, right) => {
    const recentDifference = (recentViews.get(right.slug) ?? 0) - (recentViews.get(left.slug) ?? 0);
    return recentDifference || right.viewCount - left.viewCount;
  });
}

export async function getCatalogTitleBySlug(slug: string, locale?: Locale) {
  if (isDatabaseConfigured()) {
    const title = await getDbTitleBySlug(slug);
    return title && isVisibleInLocale(title, locale) ? title : null;
  }

  const title = findTitle(slug) ?? null;
  return title && isVisibleInLocale(title, locale) ? title : null;
}

export const getCatalogChapterBySlug = cache(async (titleSlug: string, chapterSlug: string, locale?: Locale) => {
  if (isDatabaseConfigured()) {
    const result = await getDbChapterBySlug(titleSlug, chapterSlug);
    return result && isVisibleInLocale(result.title, locale) ? result : null;
  }

  const result = findChapter(titleSlug, chapterSlug);
  return result && isVisibleInLocale(result.title, locale) ? result : null;
});

export async function getCatalogRecommendations(current: { slug: string; tags: string[]; format?: "manga" | "manhwa" }, locale: Locale, count: number) {
  if (count <= 0) return [];
  const tagSet = new Set(current.tags);
  return (await getCatalogTitles(locale))
    .filter((title) => title.slug !== current.slug && (title.format ?? "manga") === (current.format ?? "manga"))
    .map((title) => ({ title, score: title.tags.reduce((total, tag) => total + (tagSet.has(tag) ? 1 : 0), 0) }))
    .sort((left, right) => right.score - left.score || right.title.viewCount - left.title.viewCount)
    .slice(0, count)
    .map(({ title }) => title);
}

function filterByLocale<T extends { displayLocales?: Locale[] }>(titles: T[], locale?: Locale) {
  return locale ? titles.filter((title) => isVisibleInLocale(title, locale)) : titles;
}

function isVisibleInLocale(title: { displayLocales?: Locale[] }, locale?: Locale) {
  return !locale || !title.displayLocales || title.displayLocales.includes(locale);
}

export async function getAdminTitleById(id: string) {
  if (isDatabaseConfigured()) {
    return getDbTitleForAdmin(id);
  }

  const title = findTitle(id);
  return title ? { id: title.slug, values: titleFormValuesFromDemoTitle(title) } : null;
}

export async function getAdminChapterList(titleId?: string) {
  if (isDatabaseConfigured()) {
    return listDbAdminChapters(titleId);
  }

  return adminChapterListFromDemoTitles(demoTitles).filter((chapter) => !titleId || chapter.titleId === titleId);
}

export async function getAdminTagList() {
  if (isDatabaseConfigured()) {
    return listDbAdminTags();
  }

  return adminTagListFromDemoTags(demoTags);
}

export async function getCatalogTags(locale: Locale) {
  const catalog = await getCatalogTitles(locale);
  const usage = new Map<string, number>();
  for (const title of catalog) {
    for (const slug of title.tags) usage.set(slug, (usage.get(slug) ?? 0) + 1);
  }

  if (isDatabaseConfigured()) {
    const rows = await listDbPublicTags();
    return rows.map((tag) => ({
      slug: tag.slug,
      label: locale === "es" ? tag.nameEs : tag.nameEn,
      category: tag.category,
      titleCount: usage.get(tag.slug) ?? 0
    })).sort((left, right) => right.titleCount - left.titleCount || left.label.localeCompare(right.label));
  }

  return demoTags.map((tag) => ({
    slug: tag.slug,
    label: tag.names[locale],
    category: "genre",
    titleCount: usage.get(tag.slug) ?? 0
  })).sort((left, right) => right.titleCount - left.titleCount || left.label.localeCompare(right.label));
}

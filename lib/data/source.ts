import { cache } from "react";
import { demoTags, demoTitles, findChapter, findTitle, latestTitles, popularTitles } from "@/lib/demo-data";
import {
  adminChapterListFromDemoTitles,
  getDbChapterBySlug,
  listDbAdminChapters
} from "@/lib/db/queries/chapters";
import { adminTagListFromDemoTags, listDbAdminTags, listDbPublicTags, listDbPublicTagsBySlugs } from "@/lib/db/queries/tags";
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

type CatalogTitles = Awaited<ReturnType<typeof listDbTitles>>;
type CatalogMemoryCache = { value: Promise<CatalogTitles>; expiresAt: number };
const catalogCacheKey = Symbol.for("manga24.publicCatalogCache");
const catalogGlobal = globalThis as typeof globalThis & { [catalogCacheKey]?: CatalogMemoryCache };

// React cache deduplicates reads within one render. A short process-memory
// cache also shares the catalog across consecutive locale/list requests
// without serializing it into Next's persistent cache, whose item limit is
// 2 MB. Catalog writes already refresh public pages, and this matches the
// previous 60-second freshness window.
const getAllCatalogTitles = cache(async () => {
  if (!isDatabaseConfigured()) return demoTitles;
  const now = Date.now();
  const existing = catalogGlobal[catalogCacheKey];
  if (existing && existing.expiresAt > now) return existing.value;

  const value = listDbTitles();
  catalogGlobal[catalogCacheKey] = { value, expiresAt: now + 60_000 };
  try {
    return await value;
  } catch (error) {
    if (catalogGlobal[catalogCacheKey]?.value === value) delete catalogGlobal[catalogCacheKey];
    throw error;
  }
});

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
    // listDbTitles already sorts by the full published_at timestamp. The mapped
    // catalog value only keeps YYYY-MM-DD, so sorting it again would scramble
    // titles published on the same day.
    return filterByLocale(titles, locale);
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
      label: ({ en: tag.nameEn, es: tag.nameEs, fr: tag.nameFr, de: tag.nameDe, pt: tag.namePt }[locale] || tag.nameEn),
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

export async function getCatalogTagLabels(slugs: string[], locale: Locale) {
  if (!isDatabaseConfigured()) {
    return Object.fromEntries(slugs.map((slug) => {
      const tag = demoTags.find((item) => item.slug === slug);
      return [slug, tag?.names[locale] ?? slug];
    }));
  }

  const rows = await listDbPublicTagsBySlugs(slugs);
  return Object.fromEntries(rows.map((tag) => [
    tag.slug,
    ({ en: tag.nameEn, es: tag.nameEs, fr: tag.nameFr, de: tag.nameDe, pt: tag.namePt }[locale] || tag.nameEn)
  ]));
}

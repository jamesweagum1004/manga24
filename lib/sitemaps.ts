import "server-only";
import { locales, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { listSitemapChapters, listSitemapTags, listSitemapTitles } from "@/lib/db/queries/sitemap";
import { authorPathKey } from "@/lib/authors";

export const sitemapPageSize = 50_000;
export type SitemapKind = "manga" | "chapters";
export type SitemapEntry = { url: string; lastModified: Date };

export async function getSitemapEntries(locale: Locale, kind: SitemapKind) {
  const settings = await getSiteSettings();
  if (!settings.sitemapEnabled || !settings.enabledLocales.includes(locale)) return [];
  if (kind === "chapters") {
    if (!settings.sitemapIncludeChapters) return [];
    return (await listSitemapChapters()).filter((row) => row.displayLocales.includes(locale)).map((row) => ({ url: siteUrl(`/${locale}/manga/${row.titleSlug}/chapter/${row.slug}`), lastModified: latestDate(row.updatedAt, row.publishedAt) }));
  }
  const rows = (await listSitemapTitles()).filter((row) => row.displayLocales.includes(locale));
  const entries: SitemapEntry[] = settings.sitemapIncludeTitles ? rows.map((row) => ({ url: siteUrl(`/${locale}/manga/${row.slug}`), lastModified: latestDate(row.updatedAt, row.publishedAt) })) : [];
  if (settings.sitemapIncludeTitles) {
    const authorDates = new Map<string, Date>();
    for (const row of rows) {
      if (!row.authorName.trim()) continue;
      const key = authorPathKey(row.authorName);
      const date = latestDate(row.updatedAt, row.publishedAt);
      const previous = authorDates.get(key);
      if (!previous || date > previous) authorDates.set(key, date);
    }
    entries.push(...[...authorDates].map(([key, lastModified]) => ({ url: siteUrl(`/${locale}/authors/${key}`), lastModified })));
  }
  if (settings.sitemapIncludeStatic) entries.unshift(...["", "/latest", "/popular"].map((path) => ({ url: siteUrl(`/${locale}${path}`), lastModified: new Date() })));
  if (settings.sitemapIncludeTags) {
    const tagDates = new Map<string, Date>();
    for (const tag of (await listSitemapTags()).filter((row) => row.displayLocales.includes(locale))) {
      const previous = tagDates.get(tag.slug);
      if (!previous || tag.updatedAt > previous) tagDates.set(tag.slug, tag.updatedAt);
    }
    entries.push(...[...tagDates].map(([slug, lastModified]) => ({ url: siteUrl(`/${locale}/tags/${slug}`), lastModified })));
  }
  return entries;
}

export async function getSitemapFiles() {
  const settings = await getSiteSettings();
  if (!settings.sitemapEnabled) return [];
  const files: Array<{ locale: Locale; kind: SitemapKind; page: number }> = [];
  for (const locale of locales.filter((item) => settings.enabledLocales.includes(item))) {
    for (const kind of ["manga", "chapters"] as const) {
      const count = (await getSitemapEntries(locale, kind)).length;
      for (let page = 1; page <= Math.max(1, Math.ceil(count / sitemapPageSize)); page += 1) files.push({ locale, kind, page });
    }
  }
  return files;
}

export function sitemapFileName(locale: Locale, kind: SitemapKind, page: number) { return `${locale}-${kind}${page > 1 ? `-${page}` : ""}.xml`; }
function latestDate(updatedAt: Date, publishedAt: Date | null) { return publishedAt && publishedAt > updatedAt ? publishedAt : updatedAt; }

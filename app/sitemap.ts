import type { MetadataRoute } from "next";
import { getCatalogTitles } from "@/lib/data/source";
import { siteUrl } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [titles, settings] = await Promise.all([getCatalogTitles(), getSiteSettings()]);
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of settings.enabledLocales) {
    const localeTitles = titles.filter((title) => !title.displayLocales || title.displayLocales.includes(locale));
    entries.push(
      sitemapEntry(`/${locale}`, "daily", 1),
      sitemapEntry(`/${locale}/latest`, "hourly", 0.9),
      sitemapEntry(`/${locale}/popular`, "daily", 0.8)
    );

    const tagSlugs = new Set(localeTitles.flatMap((title) => title.tags));
    for (const tagSlug of tagSlugs) {
      entries.push(sitemapEntry(`/${locale}/tags/${tagSlug}`, "weekly", 0.6));
    }

    for (const title of localeTitles) {
      entries.push({
        ...sitemapEntry(`/${locale}/manga/${title.slug}`, "daily", 0.8),
        lastModified: new Date(title.publishedAt)
      });

      for (const chapter of title.chapters) {
        entries.push({
          ...sitemapEntry(
            `/${locale}/manga/${title.slug}/chapter/${chapter.slug}`,
            "monthly",
            0.7
          ),
          lastModified: new Date(chapter.publishedAt)
        });
      }
    }
  }

  return entries;
}

function sitemapEntry(
  path: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  priority: number
): MetadataRoute.Sitemap[number] {
  return {
    url: siteUrl(path),
    changeFrequency,
    priority
  };
}

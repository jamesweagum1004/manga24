import type { Metadata } from "next";
import { CompactPromoBanner } from "@/components/compact-promo-banner";
import { DesktopEditorialHero } from "@/components/desktop-editorial-hero";
import { AdStrip } from "@/components/ad-unit";
import { MangaRail } from "@/components/manga-rail";
import { PopularTagList } from "@/components/popular-tag-list";
import { SiteShell } from "@/components/site-shell";
import { getCatalogTitles, getLatestCatalogTitles, getPopularCatalogTitles } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import { dictionary, type DemoTitle } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";
import { listActiveAds } from "@/lib/db/queries/ads";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({
    locale,
    path: "",
    title: "Manga24",
    description: "Synthetic demo catalog for a multilingual vertical-scroll manga reader."
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const catalog = await getCatalogTitles();
  const promo = catalog[10] ?? catalog[0];
  const latest = await getLatestCatalogTitles();
  const popular = await getPopularCatalogTitles();
  const mangaPopular = popular.filter((title) => title.format !== "manhwa");
  const mangaLatest = latest.filter((title) => title.format !== "manhwa");
  const manhwa = catalog.filter((title) => title.format === "manhwa");
  const featured = mangaPopular[0] ?? promo;
  const contentAds = await listActiveAds("content");
  const railSections = [
    {
      title: locale === "en" ? "Trending Manga" : "Manga en tendencia",
      subtitle: locale === "en" ? "Live" : "En vivo",
      href: localizedPath(locale, "/popular"),
      items: mangaPopular,
      ranked: true
    },
    {
      title: locale === "en" ? "Trending Adult Manga" : "Adultos en tendencia",
      subtitle: "18+",
      href: localizedPath(locale, "/popular"),
      items: rotate(mangaPopular, 3),
      ranked: true
    },
    {
      title: locale === "en" ? "Romance" : "Romance",
      subtitle: locale === "en" ? "Updated" : "Actualizado",
      href: localizedPath(locale, "/tags/romance"),
      items: prioritizeByTags(["romance"], mangaLatest)
    },
    {
      title: locale === "en" ? "Fantasy" : "Fantasia",
      subtitle: locale === "en" ? "New arcs" : "Nuevos arcos",
      href: localizedPath(locale, "/tags/fantasy"),
      items: prioritizeByTags(["fantasy", "supernatural"], rotate(mangaLatest, 2))
    },
    {
      title: dictionary[locale].latestUpdates,
      subtitle: locale === "en" ? "Last 6 hours" : "Ultimas 6 h",
      href: localizedPath(locale, "/latest"),
      items: mangaLatest,
      cardVariant: "updates" as const
    },
    {
      title: locale === "en" ? "Popular This Week" : "Popular esta semana",
      subtitle: locale === "en" ? "Weekly" : "Semanal",
      href: localizedPath(locale, "/popular"),
      items: rotate(mangaPopular, 1),
      ranked: true
    },
    {
      title: locale === "en" ? "New Releases" : "Nuevos lanzamientos",
      subtitle: locale === "en" ? "Fresh" : "Nuevo",
      href: localizedPath(locale, "/latest"),
      items: rotate(mangaLatest, 4),
      cardVariant: "updates" as const
    }
  ];

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-[1480px] space-y-3 px-0 py-3 sm:px-3 md:space-y-4 md:px-5 lg:space-y-5 lg:px-6 lg:py-6">
        {promo ? <div className="lg:hidden"><CompactPromoBanner title={promo} locale={locale} /></div> : null}
        {featured ? <DesktopEditorialHero featured={featured} ranking={mangaPopular} locale={locale} /> : null}
        {railSections.map((section, index) => (
          <div key={section.title} className="contents">
            <MangaRail
              title={section.title}
              subtitle={section.subtitle}
              href={section.href}
              items={section.items}
              ranked={section.ranked}
              cardVariant={section.cardVariant}
              locale={locale}
            />
            <AdStrip ads={contentAds.filter((ad) => ad.insertAfter === index + 1)} label={`Advertisements after ${section.title}`} />
          </div>
        ))}
        {manhwa.length > 0 ? (
          <MangaRail
            title={locale === "en" ? "Manhwa Spotlight" : "Manhwa destacado"}
            subtitle={locale === "en" ? "Korean comics" : "Cómic coreano"}
            items={manhwa}
            locale={locale}
          />
        ) : null}
        <PopularTagList locale={locale} />
      </main>
      <footer className="mx-auto max-w-[1480px] px-3 pb-8 pt-2 text-center text-[11px] font-bold text-[var(--muted)] md:px-5">
        Manga24 demo catalog uses synthetic, non-explicit placeholder content.
      </footer>
    </SiteShell>
  );
}

function rotate(items: DemoTitle[], offset: number) {
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function prioritizeByTags(tags: string[], items: DemoTitle[]) {
  return [...items].sort((a, b) => {
    const aScore = a.tags.some((tag) => tags.includes(tag)) ? 0 : 1;
    const bScore = b.tags.some((tag) => tags.includes(tag)) ? 0 : 1;
    return aScore - bScore || b.publishedAt.localeCompare(a.publishedAt);
  });
}

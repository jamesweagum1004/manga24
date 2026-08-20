import type { Metadata } from "next";
import { CompactPromoBanner } from "@/components/compact-promo-banner";
import { ContinueReading } from "@/components/continue-reading";
import { DesktopEditorialHero } from "@/components/desktop-editorial-hero";
import { AdStrip } from "@/components/ad-unit";
import { MangaRail } from "@/components/manga-rail";
import { PopularTagList } from "@/components/popular-tag-list";
import { SiteShell } from "@/components/site-shell";
import { getCatalogTitles, getLatestCatalogTitles, getPopularCatalogTitles } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import type { DemoTitle } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { listActiveAds } from "@/lib/db/queries/ads";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { homeSectionHref, type HomeSection } from "@/lib/home-sections";

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
  const catalog = await getCatalogTitles(locale);
  const promo = catalog[10] ?? catalog[0];
  const latest = await getLatestCatalogTitles(locale);
  const popular = await getPopularCatalogTitles(locale);
  const mangaPopular = popular.filter((title) => title.format !== "manhwa");
  const mangaLatest = latest.filter((title) => title.format !== "manhwa");
  const featured = mangaPopular[0] ?? promo;
  const [contentAds, settings] = await Promise.all([listActiveAds("content", locale), getSiteSettings()]);
  const railSections = settings.homeSections
    .filter((section) => section.enabled && (section.source !== "manhwa" || settings.homeManhwaEnabled))
    .map((section) => buildHomeSection(section, { catalog, mangaPopular, mangaLatest }, locale))
    .filter((section) => section.items.length > 0);

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-[1480px] space-y-2 px-0 pb-3 pt-0 sm:px-3 sm:pt-3 md:space-y-4 md:px-5 lg:space-y-5 lg:px-6 lg:py-6">
        <ContinueReading locale={locale} />
        {promo ? <div className="lg:hidden"><CompactPromoBanner title={promo} locale={locale} /></div> : null}
        {featured ? <DesktopEditorialHero featured={featured} ranking={mangaPopular} locale={locale} showViewCounts={settings.viewCountsEnabled} /> : null}
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
              priorityCount={index === 0 ? 2 : 0}
            />
            <AdStrip ads={contentAds.filter((ad) => ad.insertAfter === index + 1)} label={`Advertisements after ${section.title}`} pwaAdsEnabled={settings.pwaAdsEnabled} />
          </div>
        ))}
        <PopularTagList locale={locale} />
      </main>
    </SiteShell>
  );
}

function buildHomeSection(section: HomeSection, data: { catalog: DemoTitle[]; mangaPopular: DemoTitle[]; mangaLatest: DemoTitle[] }, locale: Parameters<typeof homeSectionHref>[0]) {
  let items: DemoTitle[];
  if (section.source === "popular") items = data.mangaPopular;
  else if (section.source === "adult") items = data.mangaPopular.filter((title) => title.contentRating !== "Safe");
  else if (section.source === "tag") items = data.mangaLatest.filter((title) => title.tags.includes(section.tag));
  else if (section.source === "manhwa") items = data.catalog.filter((title) => title.format === "manhwa");
  else items = data.mangaLatest;
  return {
    title: section.title,
    subtitle: section.subtitle,
    href: homeSectionHref(locale, section),
    items: items.slice(0, section.itemCount),
    ranked: section.source === "popular" || section.source === "adult",
    cardVariant: section.source === "latest" ? "updates" as const : undefined
  };
}

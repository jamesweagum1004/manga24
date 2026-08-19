import type { Metadata } from "next";
import { MangaCard } from "@/components/manga-card";
import { RankingRail } from "@/components/ranking-rail";
import { SiteShell } from "@/components/site-shell";
import { getPopularCatalogTitles } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import { dictionary } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/db/queries/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({
    locale,
    path: "/popular",
    title: dictionary[locale].popular,
    description: "Popular synthetic manga titles on Manga24."
  });
}

export default async function PopularPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const [titles, settings] = await Promise.all([getPopularCatalogTitles(locale), getSiteSettings()]);

  return (
    <SiteShell locale={locale}>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 md:pb-10">
      <h1 className="text-3xl font-black">{dictionary[locale].popular}</h1>
      <RankingRail titles={titles} locale={locale} showViewCounts={settings.viewCountsEnabled} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {titles.map((title, index) => (
          <MangaCard key={title.slug} title={title} locale={locale} priority={index < 2} />
        ))}
      </div>
    </main>
    </SiteShell>
  );
}

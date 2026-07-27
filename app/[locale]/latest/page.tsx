import type { Metadata } from "next";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { buildMetadata } from "@/lib/metadata";
import { dictionary, latestTitles } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({
    locale,
    path: "/latest",
    title: dictionary[locale].latest,
    description: "Latest synthetic manga updates on Manga24."
  });
}

export default async function LatestPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const titles = latestTitles();

  return (
    <SiteShell locale={locale}>
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-10">
      <h1 className="text-3xl font-black">{dictionary[locale].latest}</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {titles.map((title, index) => (
          <MangaCard key={title.slug} title={title} locale={locale} priority={index < 2} />
        ))}
      </div>
    </main>
    </SiteShell>
  );
}

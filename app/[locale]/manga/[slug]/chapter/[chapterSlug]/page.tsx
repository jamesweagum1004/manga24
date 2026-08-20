import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerticalReader } from "@/components/vertical-reader";
import { StructuredData } from "@/components/structured-data";
import { getCatalogChapterBySlug, getCatalogRecommendations } from "@/lib/data/source";
import { buildMetadata, siteUrl } from "@/lib/metadata";
import { dictionary } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";
import { listReaderAds } from "@/lib/db/queries/ads";

type PageProps = {
  params: Promise<{ locale: string; slug: string; chapterSlug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug, chapterSlug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const result = await getCatalogChapterBySlug(slug, chapterSlug, locale);
  if (!result) {
    return buildMetadata({
      locale,
      path: `/manga/${slug}/chapter/${chapterSlug}`,
      title: "Chapter",
      description: "Manga chapter reader."
    });
  }

  return buildMetadata({
    locale,
    path: `/manga/${slug}/chapter/${chapterSlug}`,
    title: `${result.title.titles[locale]} - ${result.chapter.titles[locale]}`,
    description: `${dictionary[locale].chapters}: ${result.chapter.titles[locale]}`,
    image: result.title.cover.src,
    availableLocales: result.title.displayLocales
  });
}

export default async function ChapterReaderPage({ params }: PageProps) {
  const { locale: rawLocale, slug, chapterSlug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const [result, readerAds] = await Promise.all([getCatalogChapterBySlug(slug, chapterSlug, locale), listReaderAds(locale)]);
  if (!result) {
    notFound();
  }

  const chapterIndex = result.title.chapters.findIndex((chapter) => chapter.slug === chapterSlug);
  const previousChapter = result.title.chapters[chapterIndex - 1];
  const nextChapter = result.title.chapters[chapterIndex + 1];
  const chapterUrl = siteUrl(`/${locale}/manga/${result.title.slug}/chapter/${result.chapter.slug}`);
  const firstPage = result.chapter.pages[0];
  const imageOrigin = getOrigin(firstPage?.src);
  const recommendations = await getCatalogRecommendations(result.title, locale, readerAds.recommendationCount);

  return (
    <>
      {imageOrigin ? <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" /> : null}
      {imageOrigin ? <link rel="dns-prefetch" href={imageOrigin} /> : null}
      {firstPage ? <link rel="preload" as="image" href={firstPage.src} fetchPriority="high" /> : null}
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CreativeWork",
              "@id": `${chapterUrl}#chapter`,
              url: chapterUrl,
              name: `${result.title.titles[locale]} - ${result.chapter.titles[locale]}`,
              inLanguage: locale,
              datePublished: result.chapter.publishedAt,
              isPartOf: {
                "@type": "CreativeWorkSeries",
                "@id": `${siteUrl(`/${locale}/manga/${result.title.slug}`)}#series`,
                name: result.title.titles[locale]
              }
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Manga24",
                  item: siteUrl(`/${locale}`)
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: result.title.titles[locale],
                  item: siteUrl(`/${locale}/manga/${result.title.slug}`)
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: result.chapter.titles[locale],
                  item: chapterUrl
                }
              ]
            }
          ]
        }}
      />
      <VerticalReader
        locale={locale}
        titleSlug={result.title.slug}
        title={result.title.titles[locale]}
        chapter={result.chapter.titles[locale]}
        coverUrl={result.title.cover.src}
        coverAlt={result.title.cover.alt}
        chapterHref={localizedPath(locale, `/manga/${result.title.slug}/chapter/${result.chapter.slug}`)}
        pages={result.chapter.pages}
        previousHref={
          previousChapter ? localizedPath(locale, `/manga/${result.title.slug}/chapter/${previousChapter.slug}`) : undefined
        }
        nextHref={nextChapter ? localizedPath(locale, `/manga/${result.title.slug}/chapter/${nextChapter.slug}`) : undefined}
        storageKey={`manga24:${locale}:${result.title.slug}:${result.chapter.slug}`}
        reportHref={`/${locale}/report?type=chapter&key=${encodeURIComponent(`${result.title.slug}:${result.chapter.slug}`)}&url=${encodeURIComponent(`/${locale}/manga/${result.title.slug}/chapter/${result.chapter.slug}`)}`}
        topAds={readerAds.top}
        bottomAds={readerAds.bottom}
        pwaAdsEnabled={readerAds.pwaAdsEnabled}
        recommendations={recommendations}
      />
    </>
  );
}

function getOrigin(value: string | undefined) {
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

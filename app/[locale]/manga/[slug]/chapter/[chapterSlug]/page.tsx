import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerticalReader } from "@/components/vertical-reader";
import { buildMetadata } from "@/lib/metadata";
import { dictionary, findChapter } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

type PageProps = {
  params: Promise<{ locale: string; slug: string; chapterSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug, chapterSlug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const result = findChapter(slug, chapterSlug);
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
    image: result.title.cover.src
  });
}

export default async function ChapterReaderPage({ params }: PageProps) {
  const { locale: rawLocale, slug, chapterSlug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const result = findChapter(slug, chapterSlug);
  if (!result) {
    notFound();
  }

  const chapterIndex = result.title.chapters.findIndex((chapter) => chapter.slug === chapterSlug);
  const previousChapter = result.title.chapters[chapterIndex - 1];
  const nextChapter = result.title.chapters[chapterIndex + 1];

  return (
    <VerticalReader
      locale={locale}
      titleSlug={result.title.slug}
      title={result.title.titles[locale]}
      chapter={result.chapter.titles[locale]}
      pages={result.chapter.pages}
      previousHref={
        previousChapter ? localizedPath(locale, `/manga/${result.title.slug}/chapter/${previousChapter.slug}`) : undefined
      }
      nextHref={nextChapter ? localizedPath(locale, `/manga/${result.title.slug}/chapter/${nextChapter.slug}`) : undefined}
      storageKey={`manga24:${locale}:${result.title.slug}:${result.chapter.slug}`}
    />
  );
}

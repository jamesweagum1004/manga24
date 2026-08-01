import type { Metadata } from "next";
import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterList } from "@/components/chapter-list";
import { SiteShell } from "@/components/site-shell";
import { TagChip } from "@/components/tag-chip";
import { getCatalogTitleBySlug } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import { dictionary } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const title = await getCatalogTitleBySlug(slug);
  if (!title) {
    return buildMetadata({ locale, path: `/manga/${slug}`, title: "Title", description: "Manga title page." });
  }

  return buildMetadata({
    locale,
    path: `/manga/${slug}`,
    title: title.seo?.[locale].title ?? title.titles[locale],
    description: title.seo?.[locale].description ?? title.descriptions[locale],
    keywords: title.seo?.[locale].keywords,
    image: title.cover.src
  });
}

export default async function TitleDetailPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const title = await getCatalogTitleBySlug(slug);
  if (!title) {
    notFound();
  }
  const t = dictionary[locale];
  const firstChapter = title.chapters[0];
  const latestChapter = title.chapters.at(-1);

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 md:pb-10">
        <section className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-full max-w-64 md:max-w-none">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]">
              <Image
                src={title.cover.src}
                alt={title.cover.alt}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 260px, 70vw"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--foreground)] px-3 text-sm font-black text-[var(--background)]">
                18+ placeholder
              </span>
              <h1 className="text-3xl font-black tracking-normal sm:text-4xl">{title.titles[locale]}</h1>
              <p className="text-sm leading-6 text-[var(--muted)]">{title.descriptions[locale]}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-4">
              <Stat label={t.author} value={title.author} />
              <Stat label={t.status} value={title.publicationStatus} />
              <Stat label={t.language} value={title.originalLanguage} />
              <Stat label={t.chapterCount} value={String(title.chapters.length)} />
              <Stat label={t.views} value={title.viewCount.toLocaleString()} />
              <Stat label="Published" value={title.publishedAt} />
            </dl>

            <div className="flex flex-wrap gap-2">
              {title.tags.map((tag) => (
                <TagChip key={tag} slug={tag} locale={locale} />
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {firstChapter ? (
                <Link
                  href={localizedPath(locale, `/manga/${title.slug}/chapter/${firstChapter.slug}`)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-center text-sm font-bold text-white"
                >
                  {t.continueReading}
                </Link>
              ) : null}
              {latestChapter ? (
                <Link
                  href={localizedPath(locale, `/manga/${title.slug}/chapter/${latestChapter.slug}`)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-sm font-bold"
                >
                  {t.readLatest}
                </Link>
              ) : null}
              {firstChapter ? (
                <Link
                  href={localizedPath(locale, `/manga/${title.slug}/chapter/${firstChapter.slug}`)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-sm font-bold"
                >
                  {t.startChapterOne}
                </Link>
              ) : null}
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold"
              >
                {t.bookmark}
              </button>
            </div>
            <Link href={`/${locale}/report?type=title&key=${encodeURIComponent(title.slug)}&url=${encodeURIComponent(`/${locale}/manga/${title.slug}`)}`} className="inline-flex text-xs font-bold text-[var(--muted)] underline decoration-dotted underline-offset-4">Report this title</Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-black">{t.chapters}</h2>
          <ChapterList locale={locale} titleSlug={title.slug} chapters={title.chapters} />
        </section>
      </main>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-black">{value}</dd>
    </div>
  );
}

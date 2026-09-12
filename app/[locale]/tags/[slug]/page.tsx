import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { getCatalogTitles } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import { dictionary } from "@/lib/demo-data";
import { getCatalogTags } from "@/lib/data/source";
import { getLocaleOrDefault, type Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { CatalogPagination, paginate } from "@/components/catalog-pagination";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

const tagPageCopy: Record<Locale, { allTags: string; result: string; results: string; empty: string; related: string; relatedDescription: string }> = {
  en: { allTags: "All tags", result: "title", results: "titles", empty: "No titles are available for this tag.", related: "Related tags", relatedDescription: "Themes often found in the same titles" },
  es: { allTags: "Todas las etiquetas", result: "título", results: "títulos", empty: "No hay títulos disponibles para esta etiqueta.", related: "Etiquetas relacionadas", relatedDescription: "Temas que suelen aparecer en los mismos títulos" },
  fr: { allTags: "Tous les tags", result: "titre", results: "titres", empty: "Aucun titre n’est disponible pour ce tag.", related: "Tags associés", relatedDescription: "Thèmes souvent présents dans les mêmes titres" },
  de: { allTags: "Alle Tags", result: "Titel", results: "Titel", empty: "Für diesen Tag sind keine Titel verfügbar.", related: "Ähnliche Tags", relatedDescription: "Themen, die oft in denselben Titeln vorkommen" },
  pt: { allTags: "Todas as tags", result: "título", results: "títulos", empty: "Não há títulos disponíveis para esta tag.", related: "Tags relacionadas", relatedDescription: "Temas encontrados frequentemente nos mesmos títulos" }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const tag = (await getCatalogTags(locale)).find((item) => item.slug === slug);
  if (!tag) {
    return buildMetadata({ locale, path: `/tags/${slug}`, title: "Tag", description: "Tag page" });
  }
  return buildMetadata({
    locale,
    path: `/tags/${slug}`,
    title: tag.label,
    description: `Read manga tagged ${tag.label} on Manga24.`
  });
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale, slug }, query, settings] = await Promise.all([params, searchParams, getSiteSettings()]);
  const locale = getLocaleOrDefault(rawLocale);
  const tags = await getCatalogTags(locale);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) {
    notFound();
  }
  const titles = (await getCatalogTitles(locale)).filter((title) => title.tags.includes(slug));
  const relatedCounts = new Map<string, number>();
  for (const title of titles) for (const relatedSlug of title.tags) if (relatedSlug !== slug) relatedCounts.set(relatedSlug, (relatedCounts.get(relatedSlug) ?? 0) + 1);
  const relatedTags = tags.filter((item) => relatedCounts.has(item.slug)).sort((left, right) => (relatedCounts.get(right.slug) ?? 0) - (relatedCounts.get(left.slug) ?? 0) || right.titleCount - left.titleCount).slice(0, 10);
  const page = paginate(titles, query.page, settings.catalogPageSize);
  const copy = tagPageCopy[locale];

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24 sm:px-6 md:pb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <Link
            href={localizedPath(locale, "/tags")}
            className="inline-flex items-center gap-1 text-sm font-black text-[var(--accent)] hover:underline"
          >
            <span aria-hidden="true">←</span>
            {copy.allTags}
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">{dictionary[locale].tags}</p>
              <h1 className="mt-1 text-3xl font-black">{tag.label}</h1>
            </div>
            <p className="text-sm font-bold text-[var(--muted)]">
              {titles.length} {titles.length === 1 ? copy.result : copy.results}
            </p>
          </div>
        </div>

        {titles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            {copy.empty}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {page.items.map((title) => (
              <MangaCard key={title.slug} title={title} locale={locale} />
            ))}
          </div>
        )}
        <CatalogPagination currentPage={page.currentPage} totalPages={page.totalPages} href={(number) => `/${locale}/tags/${slug}?page=${number}`} />
        {relatedTags.length > 0 ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"><h2 className="text-xl font-black">{copy.related}</h2><p className="mt-1 text-sm font-semibold text-[var(--muted)]">{copy.relatedDescription}</p><div className="mt-4 flex flex-wrap gap-2">{relatedTags.map((related) => <Link key={related.slug} href={localizedPath(locale, `/tags/${related.slug}`)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"><span>#</span>{related.label}<span className="text-[10px] text-[var(--muted)]">{relatedCounts.get(related.slug)}</span></Link>)}</div></section> : null}
      </main>
    </SiteShell>
  );
}

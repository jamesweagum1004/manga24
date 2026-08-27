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

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = "force-dynamic";

const tagPageCopy: Record<Locale, { allTags: string; result: string; results: string; empty: string }> = {
  en: { allTags: "All tags", result: "title", results: "titles", empty: "No titles are available for this tag." },
  es: { allTags: "Todas las etiquetas", result: "título", results: "títulos", empty: "No hay títulos disponibles para esta etiqueta." },
  fr: { allTags: "Tous les tags", result: "titre", results: "titres", empty: "Aucun titre n’est disponible pour ce tag." },
  de: { allTags: "Alle Tags", result: "Titel", results: "Titel", empty: "Für diesen Tag sind keine Titel verfügbar." },
  pt: { allTags: "Todas as tags", result: "título", results: "títulos", empty: "Não há títulos disponíveis para esta tag." }
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

export default async function TagPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const tags = await getCatalogTags(locale);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) {
    notFound();
  }
  const titles = (await getCatalogTitles(locale)).filter((title) => title.tags.includes(slug));
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
            {titles.map((title) => (
              <MangaCard key={title.slug} title={title} locale={locale} />
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}

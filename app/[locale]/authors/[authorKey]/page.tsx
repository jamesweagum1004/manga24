import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogPagination, paginate } from "@/components/catalog-pagination";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { authorPathKey } from "@/lib/authors";
import { getCatalogTitles } from "@/lib/data/source";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { getLocaleOrDefault, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { localizedPath } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; authorKey: string }>; searchParams: Promise<{ page?: string }> };

export const dynamic = "force-dynamic";

const copy: Record<Locale, { eyebrow: string; works: string; work: string; back: string; empty: string }> = {
  en: { eyebrow: "Author collection", works: "titles", work: "title", back: "Back to latest", empty: "No published titles are available for this author." },
  es: { eyebrow: "Colección del autor", works: "títulos", work: "título", back: "Volver a recientes", empty: "No hay títulos publicados de este autor." },
  fr: { eyebrow: "Collection de l’auteur", works: "titres", work: "titre", back: "Retour aux nouveautés", empty: "Aucun titre publié n’est disponible pour cet auteur." },
  de: { eyebrow: "Sammlung des Autors", works: "Titel", work: "Titel", back: "Zurück zu Neuheiten", empty: "Für diesen Autor sind keine veröffentlichten Titel verfügbar." },
  pt: { eyebrow: "Coleção do autor", works: "títulos", work: "título", back: "Voltar aos recentes", empty: "Não há títulos publicados deste autor." }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, authorKey } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const author = (await getCatalogTitles(locale)).find((title) => authorPathKey(title.author) === authorKey)?.author;
  if (!author) return buildMetadata({ locale, path: `/authors/${authorKey}`, title: "Author", description: "Manga24 author page." });
  return buildMetadata({ locale, path: `/authors/${authorKey}`, title: author, description: `Browse published Manga24 titles by ${author}.` });
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale, authorKey }, query, settings] = await Promise.all([params, searchParams, getSiteSettings()]);
  const locale = getLocaleOrDefault(rawLocale);
  const titles = (await getCatalogTitles(locale)).filter((title) => authorPathKey(title.author) === authorKey);
  if (titles.length === 0) notFound();
  const author = titles[0].author;
  const page = paginate(titles, query.page, settings.catalogPageSize);
  const text = copy[locale];

  return <SiteShell locale={locale}><main className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24 sm:px-6 md:pb-10">
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)] p-6 sm:p-8">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" />
      <Link href={localizedPath(locale, "/latest")} className="relative text-sm font-black text-[var(--accent)] hover:underline">← {text.back}</Link>
      <p className="relative mt-6 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">{text.eyebrow}</p>
      <h1 className="relative mt-1 text-3xl font-black tracking-tight sm:text-4xl">{author}</h1>
      <p className="relative mt-2 text-sm font-bold text-[var(--muted)]">{titles.length} {titles.length === 1 ? text.work : text.works}</p>
    </section>
    {page.items.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{page.items.map((title) => <MangaCard key={title.slug} title={title} locale={locale} />)}</div> : <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--muted)]">{text.empty}</div>}
    <CatalogPagination currentPage={page.currentPage} totalPages={page.totalPages} href={(number) => `/${locale}/authors/${authorKey}?page=${number}`} />
  </main></SiteShell>;
}

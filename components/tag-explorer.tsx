"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

type CatalogTag = { slug: string; label: string; category: string; titleCount: number };

const copy: Record<Locale, { search: string; popular: string; all: string; empty: string; titles: string }> = {
  en: { search: "Search tags", popular: "Popular now", all: "Browse all", empty: "No matching tags", titles: "titles" },
  es: { search: "Buscar etiquetas", popular: "Más populares", all: "Explorar todas", empty: "No hay etiquetas", titles: "títulos" },
  fr: { search: "Rechercher des tags", popular: "Les plus populaires", all: "Tout explorer", empty: "Aucun tag trouvé", titles: "titres" },
  de: { search: "Tags suchen", popular: "Gerade beliebt", all: "Alle entdecken", empty: "Keine Tags gefunden", titles: "Titel" },
  pt: { search: "Buscar tags", popular: "Mais populares", all: "Explorar todas", empty: "Nenhuma tag encontrada", titles: "títulos" }
};

export function TagExplorer({ locale, tags }: { locale: Locale; tags: CatalogTag[] }) {
  const [query, setQuery] = useState("");
  const text = copy[locale];
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visibleTags = useMemo(() => normalizedQuery ? tags.filter((tag) => tag.label.toLocaleLowerCase(locale).includes(normalizedQuery) || tag.slug.includes(normalizedQuery)) : tags, [locale, normalizedQuery, tags]);
  const groups = useMemo(() => Object.entries(visibleTags.reduce<Record<string, CatalogTag[]>>((result, tag) => {
    const category = tag.category || text.all;
    (result[category] ??= []).push(tag);
    return result;
  }, {})), [text.all, visibleTags]);

  return (
    <div className="mt-6 space-y-7">
      <div className="relative max-w-2xl">
        <SearchIcon />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.search} className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-12 pr-4 text-sm font-bold outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_12%,transparent)]" />
      </div>

      {!normalizedQuery && tags.length > 0 ? (
        <section aria-labelledby="popular-tags-heading">
          <p id="popular-tags-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{text.popular}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {tags.slice(0, 6).map((tag, index) => <TagCard key={tag.slug} tag={tag} locale={locale} index={index + 1} titlesLabel={text.titles} featured />)}
          </div>
        </section>
      ) : null}

      {groups.length > 0 ? groups.map(([category, categoryTags]) => (
        <section key={category} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"><TagIcon /></span>
            <div><h2 className="font-black capitalize">{category}</h2><p className="text-xs font-bold text-[var(--muted)]">{categoryTags.length} tags</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <Link key={tag.slug} href={localizedPath(locale, `/tags/${tag.slug}`)} className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm">
                <span className="text-[var(--muted)] transition group-hover:text-[var(--accent)]">#</span>{tag.label}<span className="rounded-full bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] text-[var(--muted)]">{tag.titleCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )) : <div className="rounded-3xl border border-dashed border-[var(--border)] py-16 text-center text-sm font-bold text-[var(--muted)]">{text.empty}</div>}
    </div>
  );
}

function TagCard({ tag, locale, index, titlesLabel, featured }: { tag: CatalogTag; locale: Locale; index: number; titlesLabel: string; featured?: boolean }) {
  return <Link href={localizedPath(locale, `/tags/${tag.slug}`)} className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg ${featured ? "min-h-28" : ""}`}><span className="absolute -right-1 -top-4 text-6xl font-black text-[color-mix(in_srgb,var(--accent)_8%,transparent)]">{String(index).padStart(2, "0")}</span><span className="relative text-xs font-black text-[var(--accent)]">TRENDING</span><h3 className="relative mt-4 line-clamp-2 font-black group-hover:text-[var(--accent)]">{tag.label}</h3><p className="relative mt-1 text-xs font-bold text-[var(--muted)]">{tag.titleCount} {titlesLabel}</p></Link>;
}

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>; }
function TagIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 13 13 20l-9-9V4h7Z" /><circle cx="8.5" cy="8.5" r="1" /></svg>; }

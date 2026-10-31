import type { Metadata } from "next";
import { CatalogPagination, paginate } from "@/components/catalog-pagination";
import { DiscoverView, type DiscoverTitle } from "@/components/discover-view";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { getCatalogTags, getCatalogTitles } from "@/lib/data/source";
import { getLocaleOrDefault, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/db/queries/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; tag?: string; format?: string; sort?: string; page?: string }>;
};

const pageTitles: Record<Locale, string> = { en: "Discover", es: "Descubrir", fr: "Découvrir", de: "Entdecken", pt: "Descobrir" };
const descriptions: Record<Locale, string> = {
  en: "Rediscover older manga, find overlooked titles, and explore the full Manga24 catalog.",
  es: "Redescubre manga de otras fechas, encuentra títulos poco vistos y explora todo el catálogo de Manga24.",
  fr: "Redécouvrez des mangas plus anciens, trouvez des titres peu vus et explorez tout le catalogue Manga24.",
  de: "Entdecke ältere Manga neu, finde wenig gesehene Titel und durchsuche den gesamten Manga24-Katalog.",
  pt: "Redescubra mangás antigos, encontre títulos pouco vistos e explore todo o catálogo Manga24."
};
const pageCopy: Record<Locale, { archive: string; archiveDescription: string; search: string; searchPlaceholder: string; tag: string; allTags: string; format: string; allFormats: string; manga: string; manhwa: string; sort: string; oldest: string; leastViewed: string; mostViewed: string; newest: string; apply: string; results: string; page: string; noResults: string }> = {
  en: { archive: "Explore the archive", archiveDescription: "Browse published titles with chapters. Search by title, author, or tag, then sort the back catalog.", search: "Title, author, or tag", searchPlaceholder: "Try an author, title, or keyword", tag: "Tag", allTags: "All tags", format: "Format", allFormats: "All formats", manga: "Manga", manhwa: "Manhwa", sort: "Sort by", oldest: "Oldest published", leastViewed: "Least viewed", mostViewed: "Most viewed", newest: "Recently published", apply: "Explore", results: "titles", page: "Page", noResults: "No titles match these filters." },
  es: { archive: "Explorar el archivo", archiveDescription: "Explora títulos publicados con capítulos. Busca por título, autor o etiqueta y ordena el catálogo.", search: "Título, autor o etiqueta", searchPlaceholder: "Prueba con un autor, título o palabra", tag: "Etiqueta", allTags: "Todas las etiquetas", format: "Formato", allFormats: "Todos los formatos", manga: "Manga", manhwa: "Manhwa", sort: "Ordenar por", oldest: "Más antiguos", leastViewed: "Menos vistos", mostViewed: "Más vistos", newest: "Publicados recientemente", apply: "Explorar", results: "títulos", page: "Página", noResults: "No hay títulos con estos filtros." },
  fr: { archive: "Explorer les archives", archiveDescription: "Parcourez les titres publiés avec des chapitres. Recherchez par titre, auteur ou tag et triez le catalogue.", search: "Titre, auteur ou tag", searchPlaceholder: "Essayez un auteur, un titre ou un mot", tag: "Tag", allTags: "Tous les tags", format: "Format", allFormats: "Tous les formats", manga: "Manga", manhwa: "Manhwa", sort: "Trier par", oldest: "Les plus anciens", leastViewed: "Les moins vus", mostViewed: "Les plus vus", newest: "Récemment publiés", apply: "Explorer", results: "titres", page: "Page", noResults: "Aucun titre ne correspond à ces filtres." },
  de: { archive: "Archiv entdecken", archiveDescription: "Durchsuche veröffentlichte Titel mit Kapiteln. Suche nach Titel, Autor oder Tag und sortiere den Katalog.", search: "Titel, Autor oder Tag", searchPlaceholder: "Suche nach Autor, Titel oder Begriff", tag: "Tag", allTags: "Alle Tags", format: "Format", allFormats: "Alle Formate", manga: "Manga", manhwa: "Manhwa", sort: "Sortieren nach", oldest: "Älteste zuerst", leastViewed: "Am wenigsten angesehen", mostViewed: "Am häufigsten angesehen", newest: "Zuletzt veröffentlicht", apply: "Entdecken", results: "Titel", page: "Seite", noResults: "Keine Titel entsprechen diesen Filtern." },
  pt: { archive: "Explorar o arquivo", archiveDescription: "Explore títulos publicados com capítulos. Pesquise por título, autor ou tag e ordene o catálogo.", search: "Título, autor ou tag", searchPlaceholder: "Pesquise por autor, título ou palavra", tag: "Tag", allTags: "Todas as tags", format: "Formato", allFormats: "Todos os formatos", manga: "Mangá", manhwa: "Manhwa", sort: "Ordenar por", oldest: "Mais antigos", leastViewed: "Menos vistos", mostViewed: "Mais vistos", newest: "Publicados recentemente", apply: "Explorar", results: "títulos", page: "Página", noResults: "Nenhum título corresponde a estes filtros." }
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({ locale, path: "/discover", title: pageTitles[locale], description: descriptions[locale], noIndex: true });
}

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = getLocaleOrDefault(rawLocale);
  const [settings, catalog, tags] = await Promise.all([getSiteSettings(), getCatalogTitles(locale), getCatalogTags(locale)]);
  const copy = pageCopy[locale];
  const eligible = catalog.filter((title) => title.displayLocales?.includes(locale) !== false && title.chapters.length > 0);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const olderTitles = eligible.filter((title) => {
    const publishedTime = Date.parse(`${title.publishedAt}T00:00:00Z`);
    return Number.isFinite(publishedTime) && publishedTime < cutoff;
  });
  const dailyCandidates: DiscoverTitle[] = [...olderTitles]
    .sort((left, right) => left.viewCount - right.viewCount || dailyRank(left.slug, locale) - dailyRank(right.slug, locale))
    .slice(0, 120)
    .map((title) => ({ slug: title.slug, title: title.titles[locale], author: title.author, tags: title.tags, coverUrl: title.cover.src, coverAlt: title.cover.alt, viewCount: title.viewCount, publishedAt: title.publishedAt }));

  const term = query.q?.trim().toLocaleLowerCase() ?? "";
  const selectedTag = query.tag?.trim().toLocaleLowerCase() ?? "";
  const format = query.format === "manga" || query.format === "manhwa" ? query.format : "all";
  const sort = query.sort === "oldest" || query.sort === "least-viewed" || query.sort === "most-viewed" ? query.sort : "newest";
  const filtered = eligible.filter((title) => {
    const matchesTerm = !term || [title.titles[locale], title.originalTitle, title.author, ...title.tags].some((value) => value.toLocaleLowerCase().includes(term));
    const matchesTag = !selectedTag || title.tags.includes(selectedTag);
    const matchesFormat = format === "all" || (title.format ?? "manga") === format;
    return matchesTerm && matchesTag && matchesFormat;
  });
  filtered.sort((left, right) => {
    if (sort === "oldest") return left.publishedAt.localeCompare(right.publishedAt) || left.slug.localeCompare(right.slug);
    if (sort === "least-viewed") return left.viewCount - right.viewCount || left.publishedAt.localeCompare(right.publishedAt);
    if (sort === "most-viewed") return right.viewCount - left.viewCount || right.publishedAt.localeCompare(left.publishedAt);
    return right.publishedAt.localeCompare(left.publishedAt) || right.slug.localeCompare(left.slug);
  });
  const page = paginate(filtered, query.page, settings.catalogPageSize);
  const copyParams = new URLSearchParams();
  if (query.q?.trim()) copyParams.set("q", query.q.trim());
  if (selectedTag) copyParams.set("tag", selectedTag);
  if (format !== "all") copyParams.set("format", format);
  if (sort !== "newest") copyParams.set("sort", sort);
  const pageHref = (number: number) => {
    const paramsForPage = new URLSearchParams(copyParams);
    paramsForPage.set("page", String(number));
    return `/${locale}/discover?${paramsForPage.toString()}`;
  };

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-7xl space-y-9 px-4 py-6 pb-24 sm:px-6 md:pb-10">
        <DiscoverView locale={locale} titles={dailyCandidates} />

        <section aria-labelledby="archive-heading">
          <div className="mb-4">
            <h2 id="archive-heading" className="text-2xl font-black tracking-tight">{copy.archive}</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-[var(--muted)]">{copy.archiveDescription}</p>
          </div>
          <form action={`/${locale}/discover`} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_minmax(170px,1fr)_auto]">
            <label className="grid gap-1 text-xs font-black text-[var(--muted)]">{copy.search}<input name="q" defaultValue={query.q} placeholder={copy.searchPlaceholder} className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold text-[var(--foreground)]" /></label>
            <label className="grid gap-1 text-xs font-black text-[var(--muted)]">{copy.tag}<select name="tag" defaultValue={selectedTag} className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold text-[var(--foreground)]"><option value="">{copy.allTags}</option>{tags.slice(0, 250).map((tag) => <option key={tag.slug} value={tag.slug}>{tag.label}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-black text-[var(--muted)]">{copy.format}<select name="format" defaultValue={format} className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold text-[var(--foreground)]"><option value="all">{copy.allFormats}</option><option value="manga">{copy.manga}</option><option value="manhwa">{copy.manhwa}</option></select></label>
            <label className="grid gap-1 text-xs font-black text-[var(--muted)]">{copy.sort}<select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold text-[var(--foreground)]"><option value="newest">{copy.newest}</option><option value="oldest">{copy.oldest}</option><option value="least-viewed">{copy.leastViewed}</option><option value="most-viewed">{copy.mostViewed}</option></select></label>
            <button className="h-11 self-end rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-white">{copy.apply}</button>
          </form>
          <p className="mt-4 text-sm font-bold text-[var(--muted)]">{filtered.length.toLocaleString(locale)} {copy.results} · {copy.page} {page.currentPage} / {page.totalPages}</p>
          {page.items.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{page.items.map((title, index) => <MangaCard key={title.slug} title={title} locale={locale} priority={index < 2} />)}</div> : <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm font-bold text-[var(--muted)]">{copy.noResults}</p>}
          <CatalogPagination currentPage={page.currentPage} totalPages={page.totalPages} href={pageHref} />
        </section>
      </main>
    </SiteShell>
  );
}

function dailyRank(slug: string, locale: Locale) {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 2166136261;
  for (const char of `${day}:${locale}:${slug}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

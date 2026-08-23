import type { Metadata } from "next";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { getCatalogTitles } from "@/lib/data/source";
import { dictionary } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({
    locale,
    path: "/search",
    title: dictionary[locale].search,
    description: "Search Manga24 titles, authors, and tags."
  });
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = getLocaleOrDefault(rawLocale);
  const term = query.q?.trim() ?? "";
  const normalized = term.toLocaleLowerCase();
  const titles = normalized
    ? (await getCatalogTitles(locale)).filter((title) =>
        [
          title.originalTitle,
          title.titles[locale],
          title.author,
          title.descriptions[locale],
          ...title.tags
        ].some((value) => value.toLocaleLowerCase().includes(normalized))
      )
    : [];

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-10">
        <h1 className="text-3xl font-black">{dictionary[locale].search}</h1>
        <form role="search" className="mt-5 flex max-w-2xl gap-2">
          <input
            name="q"
            defaultValue={term}
            placeholder={`${dictionary[locale].search}…`}
            className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-bold"
          />
          <button className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-black text-white">
            {dictionary[locale].search}
          </button>
        </form>
        {term ? <p className="mt-5 text-sm font-bold text-[var(--muted)]">{titles.length} result(s) for “{term}”</p> : null}
        {term && titles.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            No matching titles were found.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {titles.map((title, index) => (
              <MangaCard key={title.slug} title={title} locale={locale} priority={index < 2} />
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}

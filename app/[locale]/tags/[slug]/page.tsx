import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MangaCard } from "@/components/manga-card";
import { SiteShell } from "@/components/site-shell";
import { TagChip } from "@/components/tag-chip";
import { getCatalogTitles } from "@/lib/data/source";
import { buildMetadata } from "@/lib/metadata";
import { dictionary } from "@/lib/demo-data";
import { getCatalogTags } from "@/lib/data/source";
import { getLocaleOrDefault } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = "force-dynamic";

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

  return (
    <SiteShell locale={locale}>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24 sm:px-6 md:pb-10">
      <div>
        <p className="text-sm font-black uppercase text-[var(--accent)]">{dictionary[locale].tags}</p>
        <h1 className="mt-2 text-3xl font-black">{tag.label}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((item) => (
          <TagChip key={item.slug} slug={item.slug} label={item.label} locale={locale} />
        ))}
      </div>
      {titles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
          No titles are available for this tag.
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

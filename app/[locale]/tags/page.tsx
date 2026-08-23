import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TagChip } from "@/components/tag-chip";
import { getCatalogTags } from "@/lib/data/source";
import { dictionary } from "@/lib/demo-data";
import { getLocaleOrDefault } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  return buildMetadata({
    locale,
    path: "/tags",
    title: dictionary[locale].tags,
    description: "Browse Manga24 titles by tag and genre."
  });
}

export default async function TagsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleOrDefault(rawLocale);
  const tags = await getCatalogTags(locale);

  return (
    <SiteShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-10">
        <h1 className="text-3xl font-black">{dictionary[locale].tags}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagChip key={tag.slug} slug={tag.slug} label={tag.label} locale={locale} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TagExplorer } from "@/components/tag-explorer";
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
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)] px-5 py-8 sm:px-8 sm:py-10">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" />
          <p className="relative text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">Manga24 collections</p>
          <h1 className="relative mt-2 text-3xl font-black tracking-tight sm:text-4xl">{dictionary[locale].tags}</h1>
          <p className="relative mt-2 max-w-xl text-sm font-semibold text-[var(--muted)]">{tagPageDescriptions[locale]}</p>
        </div>
        <TagExplorer locale={locale} tags={tags} />
      </main>
    </SiteShell>
  );
}

const tagPageDescriptions = {
  en: "Find your next read by theme, mood, or genre.",
  es: "Encuentra tu próxima lectura por tema, estilo o género.",
  fr: "Trouvez votre prochaine lecture par thème, ambiance ou genre.",
  de: "Finde deinen nächsten Titel nach Thema, Stimmung oder Genre.",
  pt: "Encontre sua próxima leitura por tema, estilo ou gênero."
} as const;

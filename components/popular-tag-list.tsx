import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { getCatalogTags } from "@/lib/data/source";
import { localizedPath } from "@/lib/routes";
import Link from "next/link";
import { TagChip } from "./tag-chip";

export async function PopularTagList({ locale }: { locale: Locale }) {
  const tags = await getCatalogTags(locale);
  const featured = tags.filter((tag) => tag.titleCount > 0).slice(0, 8);
  const moreTags = tags.filter((tag) => !featured.some((featuredTag) => featuredTag.slug === tag.slug)).slice(0, 16);
  const copy = tagSectionCopy[locale];

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:rounded-3xl">
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)] px-4 py-5 sm:px-5 lg:px-6">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" />
        <div className="flex items-end justify-between gap-4">
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{copy.eyebrow}</p>
            <h2 className="mt-1 text-[21px] font-black leading-7 sm:text-2xl">{dictionary[locale].popularTags}</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-[var(--muted)]">{copy.description}</p>
          </div>
          <Link href={localizedPath(locale, "/tags")} className="relative shrink-0 rounded-full border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] px-3 py-2 text-xs font-black text-[var(--accent)] transition hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] sm:text-sm">
            {copy.viewAll} →
          </Link>
        </div>
      </div>
      <div className="px-4 py-5 sm:px-5 lg:px-6">
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {featured.map((tag, index) => (
              <Link key={tag.slug} href={localizedPath(locale, `/tags/${tag.slug}`)} className="group relative min-h-24 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-md">
                <span className="absolute -right-1 -top-3 text-5xl font-black text-[color-mix(in_srgb,var(--accent)_7%,transparent)]">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[var(--accent)]">#{String(index + 1).padStart(2, "0")}</span>
                  <span className="rounded-full bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{tag.titleCount}</span>
                </span>
                <span className="mt-2 block truncate text-sm font-black group-hover:text-[var(--accent)]">{tag.label}</span>
              </Link>
            ))}
          </div>
        ) : null}
        {moreTags.length > 0 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            {moreTags.map((tag) => (
              <TagChip key={tag.slug} slug={tag.slug} label={tag.label} locale={locale} count={tag.titleCount} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const tagSectionCopy: Record<Locale, { eyebrow: string; description: string; viewAll: string }> = {
  en: { eyebrow: "Discover your next read", description: "Explore the themes readers are browsing most and jump straight into a collection.", viewAll: "All tags" },
  es: { eyebrow: "Descubre tu próxima lectura", description: "Explora los temas más vistos y entra directamente en una colección.", viewAll: "Todas" },
  fr: { eyebrow: "Votre prochaine lecture", description: "Explorez les thèmes les plus consultés et ouvrez directement une collection.", viewAll: "Tout voir" },
  de: { eyebrow: "Entdecke deinen nächsten Titel", description: "Entdecke beliebte Themen und öffne direkt die passende Sammlung.", viewAll: "Alle Tags" },
  pt: { eyebrow: "Descubra sua próxima leitura", description: "Explore os temas mais vistos e abra diretamente uma coleção.", viewAll: "Todas" }
};

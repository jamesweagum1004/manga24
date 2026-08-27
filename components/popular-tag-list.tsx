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
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] lg:rounded-2xl lg:shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)] px-4 py-5 sm:px-5 lg:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{copy.eyebrow}</p>
            <h2 className="mt-1 text-[21px] font-black leading-7 sm:text-2xl">{dictionary[locale].popularTags}</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-[var(--muted)]">{copy.description}</p>
          </div>
          <Link href={localizedPath(locale, "/tags")} className="shrink-0 text-sm font-black text-[var(--accent)] hover:underline">
            {copy.viewAll} →
          </Link>
        </div>
      </div>
      <div className="px-4 py-5 sm:px-5 lg:px-6">
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {featured.map((tag, index) => (
              <Link key={tag.slug} href={localizedPath(locale, `/tags/${tag.slug}`)} className="group min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md">
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

import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { getCatalogTags } from "@/lib/data/source";
import { TagChip } from "./tag-chip";

export async function PopularTagList({ locale }: { locale: Locale }) {
  const tags = await getCatalogTags(locale);
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-4 lg:rounded-2xl lg:px-6 lg:py-6 lg:shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="truncate text-[19px] font-black leading-6 sm:text-[21px]">{dictionary[locale].popularTags}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 24).map((tag) => (
          <TagChip key={tag.slug} slug={tag.slug} label={tag.label} locale={locale} />
        ))}
      </div>
    </section>
  );
}

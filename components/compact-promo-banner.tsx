import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { dictionary } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function CompactPromoBanner({ title, locale }: { title: DemoTitle; locale: Locale }) {
  const t = dictionary[locale];

  return (
    <section className="grid min-h-[150px] grid-cols-[92px_1fr] gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[116px_1fr]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--surface-strong)]">
        <Image src={title.cover.src} alt={title.cover.alt} fill priority sizes="116px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-[11px] font-black uppercase text-[var(--accent)]">Updated today</p>
        <h1 className="mt-1 line-clamp-2 text-[22px] font-black leading-7 sm:text-2xl">{title.titles[locale]}</h1>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)] sm:text-sm">
          {title.descriptions[locale]}
        </p>
        <Link
          href={localizedPath(locale, `/manga/${title.slug}`)}
          className="mt-3 inline-flex min-h-9 w-fit items-center justify-center rounded-full bg-[var(--accent)] px-4 text-xs font-black text-white"
        >
          {t.continueReading}
        </Link>
      </div>
    </section>
  );
}

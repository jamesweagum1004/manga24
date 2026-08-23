import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { dictionary } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function CompactPromoBanner({ title, locale }: { title: DemoTitle; locale: Locale }) {
  const t = dictionary[locale];

  return (
    <section className="relative isolate grid min-h-[164px] grid-cols-[100px_1fr] gap-4 overflow-hidden rounded-b-2xl border-y border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:grid-cols-[116px_1fr] md:rounded-xl md:border">
      <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" aria-hidden="true" />
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--surface-strong)] shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
        <Image src={title.cover.src} alt={title.cover.alt} fill sizes="116px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">Updated today</p>
        <h1 className="mt-1 line-clamp-2 text-[23px] font-black leading-7 tracking-[-0.035em] sm:text-2xl">{title.titles[locale]}</h1>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)] sm:text-sm">
          {title.descriptions[locale]}
        </p>
        <Link
          href={localizedPath(locale, `/manga/${title.slug}`)}
          className="mt-3 inline-flex min-h-10 w-fit items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] px-5 text-xs font-black text-white shadow-[0_8px_18px_color-mix(in_srgb,var(--accent)_24%,transparent)]"
        >
          {t.continueReading}
        </Link>
      </div>
    </section>
  );
}

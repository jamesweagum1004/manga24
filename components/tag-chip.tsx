import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { demoTags } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function TagChip({ slug, locale, label, count }: { slug: string; locale: Locale; label?: string; count?: number }) {
  const tag = demoTags.find((item) => item.slug === slug);
  const displayLabel = label ?? tag?.names[locale] ?? slug;

  return (
    <Link
      href={localizedPath(locale, `/tags/${slug}`)}
      className="inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold hover:border-[var(--accent)]"
    >
      <span>{displayLabel}</span>
      {typeof count === "number" && count > 0 ? <span className="ml-2 text-[10px] font-black text-[var(--muted)]">{count}</span> : null}
    </Link>
  );
}

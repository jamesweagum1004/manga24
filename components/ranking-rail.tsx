import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function RankingRail({ titles, locale, showViewCounts = true }: { titles: DemoTitle[]; locale: Locale; showViewCounts?: boolean }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-3 pb-2">
        {titles.map((title, index) => (
          <li key={title.slug} className="w-64 shrink-0">
            <Link
              href={localizedPath(locale, `/manga/${title.slug}`)}
              className="flex min-h-24 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-black text-[var(--background)]">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{title.titles[locale]}</span>
                {showViewCounts ? <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">
                  {title.viewCount.toLocaleString()} views
                </span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

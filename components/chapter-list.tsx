import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoChapter } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function ChapterList({ locale, titleSlug, chapters }: { locale: Locale; titleSlug: string; chapters: DemoChapter[] }) {
  if (chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        No chapters are available yet.
      </div>
    );
  }

  return (
    <ol className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {[...chapters].reverse().map((chapter) => (
        <li key={chapter.slug}>
          <Link
            href={localizedPath(locale, `/manga/${titleSlug}/chapter/${chapter.slug}`)}
            className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--surface-strong)]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{chapter.titles[locale]}</span>
              <time className="mt-1 block text-xs text-[var(--muted)]" dateTime={chapter.publishedAt}>
                {chapter.publishedAt}
              </time>
            </span>
            <span className="shrink-0 text-xs font-bold text-[var(--accent)]">Read</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

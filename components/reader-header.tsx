"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";
import { ReadingProgress } from "./reading-progress";

type ReaderHeaderProps = {
  locale: Locale;
  titleSlug: string;
  title: string;
  chapter: string;
  progress: number;
  previousHref?: string;
  nextHref?: string;
  visible: boolean;
};

export function ReaderHeader({
  locale,
  titleSlug,
  title,
  chapter,
  progress,
  previousHref,
  nextHref,
  visible
}: ReaderHeaderProps) {
  const t = dictionary[locale];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 text-white backdrop-blur transition-transform ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[840px] items-center gap-2 px-3">
        <Link
          href={localizedPath(locale, `/manga/${titleSlug}`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold"
          aria-label={title}
        >
          {"<"}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="truncate text-xs text-white/65">{chapter}</p>
        </div>
        <span className="w-12 text-right text-xs font-bold text-white/70">{progress}%</span>
      </div>
      <div className="mx-auto grid max-w-[840px] grid-cols-3 gap-1 px-3 pb-3">
        {previousHref ? (
          <Link href={previousHref} className="rounded-full bg-white/10 px-3 py-2 text-center text-xs font-bold">
            {t.previous}
          </Link>
        ) : (
          <span className="rounded-full bg-white/5 px-3 py-2 text-center text-xs font-bold text-white/35">{t.previous}</span>
        )}
        <Link
          href={localizedPath(locale, `/manga/${titleSlug}`)}
          className="rounded-full bg-white/10 px-3 py-2 text-center text-xs font-bold"
        >
          {t.chapterList}
        </Link>
        {nextHref ? (
          <Link href={nextHref} className="rounded-full bg-[var(--accent)] px-3 py-2 text-center text-xs font-bold text-white">
            {t.next}
          </Link>
        ) : (
          <span className="rounded-full bg-white/5 px-3 py-2 text-center text-xs font-bold text-white/35">{t.next}</span>
        )}
      </div>
      <ReadingProgress progress={progress} />
    </header>
  );
}

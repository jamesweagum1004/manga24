"use client";

import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { RECENT_READING_KEY, type RecentReading } from "@/lib/reading-progress";

export function ContinueReading({ locale }: { locale: Locale }) {
  const [item, setItem] = useState<RecentReading | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_READING_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentReading;
      if (parsed.locale === locale && parsed.chapterHref.startsWith(`/${locale}/`)) setItem(parsed);
    } catch {
      window.localStorage.removeItem(RECENT_READING_KEY);
    }
  }, [locale]);

  if (!item) return null;
  const labels = locale === "en"
    ? { eyebrow: "Your library", heading: "Continue reading", button: "Resume", complete: "Complete" }
    : { eyebrow: "Tu biblioteca", heading: "Seguir leyendo", button: "Continuar", complete: "Completado" };

  function dismiss() {
    window.localStorage.removeItem(RECENT_READING_KEY);
    setItem(null);
  }

  return (
    <section className="relative mx-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm sm:mx-0 lg:rounded-2xl" aria-labelledby="continue-reading-heading">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close continue reading"
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg font-black text-[var(--muted)] shadow-sm sm:hidden"
      >
        ×
      </button>
      <div className="flex items-center gap-3 p-3 lg:gap-5 lg:p-4">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-strong)] lg:h-24 lg:w-[72px]">
          <Image src={item.coverUrl} alt={item.coverAlt} fill sizes="72px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)]">{labels.eyebrow}</p>
          <h2 id="continue-reading-heading" className="mt-0.5 text-lg font-black lg:text-xl">{labels.heading}</h2>
          <p className="mt-1 truncate text-sm font-black">{item.title}</p>
          <p className="truncate text-xs font-bold text-[var(--muted)]">{item.chapter}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(2, item.progress)}%` }} />
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="mb-2 text-xs font-black text-[var(--muted)]">{item.progress}% {labels.complete}</p>
          <Link href={item.chapterHref} className="inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--surface)]">
            {labels.button} →
          </Link>
        </div>
        <Link href={item.chapterHref} aria-label={labels.button} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-lg font-black text-[var(--surface)] sm:hidden">→</Link>
      </div>
    </section>
  );
}

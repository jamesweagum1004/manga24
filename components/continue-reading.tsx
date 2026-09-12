"use client";

import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { RECENT_READING_KEY, type RecentReading } from "@/lib/reading-progress";
import { LIBRARY_CHANGED_EVENT, READING_HISTORY_KEY, readStoredItems, removeStoredItem, upsertStoredItem, type ReadingHistoryItem } from "@/lib/library";

const copy: Record<Locale, { eyebrow: string; heading: string; resume: string; library: string; complete: string; close: string }> = {
  en: { eyebrow: "Your library", heading: "Continue reading", resume: "Resume", library: "View library", complete: "complete", close: "Remove from history" },
  es: { eyebrow: "Tu biblioteca", heading: "Seguir leyendo", resume: "Continuar", library: "Ver biblioteca", complete: "completado", close: "Quitar del historial" },
  fr: { eyebrow: "Votre bibliothèque", heading: "Continuer la lecture", resume: "Reprendre", library: "Voir la bibliothèque", complete: "terminé", close: "Retirer de l’historique" },
  de: { eyebrow: "Deine Bibliothek", heading: "Weiterlesen", resume: "Fortsetzen", library: "Bibliothek öffnen", complete: "fertig", close: "Aus Verlauf entfernen" },
  pt: { eyebrow: "Sua biblioteca", heading: "Continuar lendo", resume: "Continuar", library: "Ver biblioteca", complete: "concluído", close: "Remover do histórico" }
};

export function ContinueReading({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    function update() {
      let history = readStoredItems<ReadingHistoryItem>(READING_HISTORY_KEY);
      if (history.length === 0) {
        try {
          const legacy = JSON.parse(window.localStorage.getItem(RECENT_READING_KEY) ?? "null") as RecentReading | null;
          if (legacy?.titleSlug && legacy.locale) {
            const migrated: ReadingHistoryItem = { ...legacy, titleHref: `/${legacy.locale}/manga/${legacy.titleSlug}`, author: "", tags: [] };
            upsertStoredItem(READING_HISTORY_KEY, migrated, 30);
            history = [migrated];
          }
        } catch { /* Ignore invalid legacy data. */ }
      }
      setItems(history.filter((item) => item.locale === locale && item.chapterHref?.startsWith(`/${locale}/`)).slice(0, 6));
    }
    update();
    window.addEventListener(LIBRARY_CHANGED_EVENT, update);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, update);
  }, [locale]);

  if (items.length === 0) return null;
  const labels = copy[locale];

  return <section className="mx-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm sm:mx-0 lg:rounded-2xl" aria-labelledby="continue-reading-heading">
    <header className="flex items-end justify-between gap-3 border-b border-[var(--border)] px-4 py-4 lg:px-5">
      <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)]">{labels.eyebrow}</p><h2 id="continue-reading-heading" className="mt-0.5 text-lg font-black lg:text-xl">{labels.heading}</h2></div>
      <Link href={`/${locale}/library`} className="text-xs font-black text-[var(--accent)] hover:underline">{labels.library} →</Link>
    </header>
    <div className="flex snap-x gap-3 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:p-5">
      {items.map((item) => <article key={`${item.locale}:${item.titleSlug}`} className="relative flex w-[280px] shrink-0 snap-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3">
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-strong)]"><Image src={item.coverUrl} alt={item.coverAlt} fill sizes="64px" className="object-cover" /></div>
        <div className="min-w-0 flex-1 pr-4"><h3 className="line-clamp-2 text-sm font-black">{item.title}</h3><p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{item.chapter}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(2, item.progress)}%` }} /></div><div className="mt-2 flex items-center justify-between"><span className="text-[10px] font-black text-[var(--muted)]">{item.progress}% {labels.complete}</span><Link href={item.chapterHref} className="text-xs font-black text-[var(--accent)]">{labels.resume} →</Link></div></div>
        <button type="button" onClick={() => removeStoredItem(READING_HISTORY_KEY, locale, item.titleSlug)} aria-label={labels.close} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-black text-[var(--muted)]">×</button>
      </article>)}
    </div>
  </section>;
}

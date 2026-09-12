"use client";

import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { LIBRARY_CHANGED_EVENT, READING_HISTORY_KEY, SAVED_TITLES_KEY, readStoredItems, removeStoredItem, type LibraryTitle, type ReadingHistoryItem } from "@/lib/library";

const copy: Record<Locale, { saved: string; history: string; emptySaved: string; emptyHistory: string; browse: string; resume: string; remove: string; privacy: string }> = {
  en: { saved: "Saved titles", history: "Reading history", emptySaved: "Titles you save will appear here.", emptyHistory: "Start reading and your progress will appear here.", browse: "Browse latest", resume: "Resume", remove: "Remove", privacy: "Stored only in this browser" },
  es: { saved: "Títulos guardados", history: "Historial de lectura", emptySaved: "Los títulos que guardes aparecerán aquí.", emptyHistory: "Empieza a leer y tu progreso aparecerá aquí.", browse: "Ver recientes", resume: "Continuar", remove: "Quitar", privacy: "Guardado solo en este navegador" },
  fr: { saved: "Titres enregistrés", history: "Historique de lecture", emptySaved: "Les titres enregistrés apparaîtront ici.", emptyHistory: "Commencez à lire pour retrouver votre progression ici.", browse: "Voir les nouveautés", resume: "Reprendre", remove: "Retirer", privacy: "Stocké uniquement dans ce navigateur" },
  de: { saved: "Gespeicherte Titel", history: "Leseverlauf", emptySaved: "Gespeicherte Titel erscheinen hier.", emptyHistory: "Beginne zu lesen, um deinen Fortschritt hier zu sehen.", browse: "Neuheiten ansehen", resume: "Fortsetzen", remove: "Entfernen", privacy: "Nur in diesem Browser gespeichert" },
  pt: { saved: "Títulos salvos", history: "Histórico de leitura", emptySaved: "Os títulos salvos aparecerão aqui.", emptyHistory: "Comece a ler e seu progresso aparecerá aqui.", browse: "Ver recentes", resume: "Continuar", remove: "Remover", privacy: "Armazenado somente neste navegador" }
};

export function LibraryView({ locale }: { locale: Locale }) {
  const [saved, setSaved] = useState<LibraryTitle[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  useEffect(() => {
    const update = () => {
      setSaved(readStoredItems<LibraryTitle>(SAVED_TITLES_KEY).filter((item) => item.locale === locale));
      setHistory(readStoredItems<ReadingHistoryItem>(READING_HISTORY_KEY).filter((item) => item.locale === locale));
    };
    update();
    window.addEventListener(LIBRARY_CHANGED_EVENT, update);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, update);
  }, [locale]);
  const text = copy[locale];

  return <div className="space-y-8">
    <p className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)]"><LockIcon />{text.privacy}</p>
    <LibrarySection title={text.saved} empty={text.emptySaved} browse={text.browse} locale={locale}>
      {saved.map((item) => <LibraryCard key={item.titleSlug} item={item} actionHref={item.titleHref} actionLabel={text.browse} removeLabel={text.remove} onRemove={() => removeStoredItem(SAVED_TITLES_KEY, locale, item.titleSlug)} />)}
    </LibrarySection>
    <LibrarySection title={text.history} empty={text.emptyHistory} browse={text.browse} locale={locale}>
      {history.map((item) => <LibraryCard key={item.titleSlug} item={item} actionHref={item.chapterHref} actionLabel={`${text.resume} · ${item.progress}%`} removeLabel={text.remove} onRemove={() => removeStoredItem(READING_HISTORY_KEY, locale, item.titleSlug)} />)}
    </LibrarySection>
  </div>;
}

function LibrarySection({ title, empty, browse, locale, children }: { title: string; empty: string; browse: string; locale: Locale; children: React.ReactNode[] }) {
  return <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black sm:text-2xl">{title}</h2><span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-xs font-black text-[var(--muted)]">{children.length}</span></div>{children.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div> : <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center"><p className="text-sm font-bold text-[var(--muted)]">{empty}</p><Link href={`/${locale}/latest`} className="mt-4 inline-flex rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-black text-[var(--background)]">{browse} →</Link></div>}</section>;
}

function LibraryCard({ item, actionHref, actionLabel, removeLabel, onRemove }: { item: LibraryTitle; actionHref: string; actionLabel: string; removeLabel: string; onRemove: () => void }) {
  return <article className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"><Link href={item.titleHref} className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-strong)]"><Image src={item.coverUrl} alt={item.coverAlt} fill sizes="80px" className="object-cover" /></Link><div className="flex min-w-0 flex-1 flex-col"><Link href={item.titleHref} className="line-clamp-2 font-black hover:text-[var(--accent)]">{item.title}</Link>{item.author ? <p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{item.author}</p> : null}<div className="mt-auto flex items-center gap-2"><Link href={actionHref} className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-black text-white">{actionLabel}</Link><button type="button" onClick={onRemove} className="rounded-full px-2 py-2 text-xs font-black text-[var(--muted)] hover:text-[var(--foreground)]">{removeLabel}</button></div></div></article>;
}

function LockIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>; }

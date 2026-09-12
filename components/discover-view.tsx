"use client";

import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { READING_HISTORY_KEY, SAVED_TITLES_KEY, readStoredItems, type LibraryTitle, type ReadingHistoryItem } from "@/lib/library";

export type DiscoverTitle = { slug: string; title: string; author: string; tags: string[]; coverUrl: string; coverAlt: string; viewCount: number };
const copy: Record<Locale, { forYou: string; description: string; start: string; trending: string; reason: string }> = {
  en: { forYou: "For you", description: "Recommendations shaped by what you read and save on this device.", start: "Read and save titles to personalize this page.", trending: "Popular discoveries", reason: "Matches your interests" },
  es: { forYou: "Para ti", description: "Recomendaciones según lo que lees y guardas en este dispositivo.", start: "Lee y guarda títulos para personalizar esta página.", trending: "Descubrimientos populares", reason: "Coincide con tus intereses" },
  fr: { forYou: "Pour vous", description: "Des recommandations selon vos lectures et favoris sur cet appareil.", start: "Lisez et enregistrez des titres pour personnaliser cette page.", trending: "Découvertes populaires", reason: "Correspond à vos préférences" },
  de: { forYou: "Für dich", description: "Empfehlungen anhand deiner Lektüre und gespeicherten Titel auf diesem Gerät.", start: "Lies und speichere Titel, um diese Seite zu personalisieren.", trending: "Beliebte Entdeckungen", reason: "Passt zu deinen Interessen" },
  pt: { forYou: "Para você", description: "Recomendações baseadas no que você lê e salva neste dispositivo.", start: "Leia e salve títulos para personalizar esta página.", trending: "Descobertas populares", reason: "Combina com seus interesses" }
};

export function DiscoverView({ locale, titles }: { locale: Locale; titles: DiscoverTitle[] }) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [seenSlugs, setSeenSlugs] = useState<string[]>([]);
  useEffect(() => {
    const history = readStoredItems<ReadingHistoryItem>(READING_HISTORY_KEY).filter((item) => item.locale === locale);
    const saved = readStoredItems<LibraryTitle>(SAVED_TITLES_KEY).filter((item) => item.locale === locale);
    const tagFrequency = new Map<string, number>();
    for (const item of [...history, ...saved]) for (const tag of item.tags ?? []) tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
    setPreferences([...tagFrequency].sort((a, b) => b[1] - a[1]).map(([tag]) => tag));
    setSeenSlugs([...new Set([...history, ...saved].map((item) => item.titleSlug))]);
  }, [locale]);
  const personalized = useMemo(() => titles.filter((title) => !seenSlugs.includes(title.slug)).map((title) => ({ title, score: title.tags.reduce((sum, tag) => sum + Math.max(0, 8 - preferences.indexOf(tag)) * (preferences.includes(tag) ? 1 : 0), 0) })).sort((left, right) => right.score - left.score || right.title.viewCount - left.title.viewCount), [preferences, seenSlugs, titles]);
  const hasPreferences = preferences.length > 0 && personalized.some((item) => item.score > 0);
  const shown = (hasPreferences ? personalized.filter((item) => item.score > 0) : personalized).slice(0, 24);
  const text = copy[locale];
  return <><div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">{hasPreferences ? text.reason : text.trending}</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{text.forYou}</h1><p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--muted)]">{text.description}</p>{!hasPreferences ? <p className="mt-3 inline-flex rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)]">{text.start}</p> : null}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{shown.map(({ title }) => <Link key={title.slug} href={`/${locale}/manga/${title.slug}`} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg"><div className="relative aspect-[2/3] bg-[var(--surface-strong)]"><Image src={title.coverUrl} alt={title.coverAlt} fill sizes="(min-width:1024px) 16vw,50vw" className="object-cover" /></div><div className="p-3"><h2 className="line-clamp-2 min-h-10 text-sm font-black leading-5 group-hover:text-[var(--accent)]">{title.title}</h2><p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{title.author}</p></div></Link>)}</div></>;
}

"use client";

import { ContentImage as Image } from "@/components/content-image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { READING_HISTORY_KEY, SAVED_TITLES_KEY, readStoredItems, type LibraryTitle, type ReadingHistoryItem } from "@/lib/library";

export type DiscoverTitle = { slug: string; title: string; author: string; tags: string[]; coverUrl: string; coverAlt: string; viewCount: number; publishedAt: string };

const copy: Record<Locale, { heading: string; description: string; reason: string; start: string; refreshed: string; published: string; views: string; seenAll: string }> = {
  en: { heading: "Rediscover something", description: "A daily mix of older, less-viewed titles. Your reading and saved tags help shape the picks on this device.", reason: "Picked around your interests", start: "Read or save titles to tailor the mix to your interests.", refreshed: "Fresh picks every day", published: "Published", views: "views", seenAll: "You have explored today's picks. Here are a few again." },
  es: { heading: "Redescubre algo", description: "Una selección diaria de títulos antiguos y menos vistos. Tus lecturas y etiquetas guardadas ayudan a elegir en este dispositivo.", reason: "Elegidos según tus intereses", start: "Lee o guarda títulos para adaptar la selección a tus gustos.", refreshed: "Nuevas sugerencias cada día", published: "Publicado", views: "vistas", seenAll: "Ya exploraste la selección de hoy. Aquí tienes algunos de nuevo." },
  fr: { heading: "Redécouvrez une œuvre", description: "Une sélection quotidienne de titres plus anciens et moins vus. Vos lectures et tags enregistrés orientent les choix sur cet appareil.", reason: "Choisis selon vos goûts", start: "Lisez ou enregistrez des titres pour personnaliser la sélection.", refreshed: "De nouveaux choix chaque jour", published: "Publié", views: "vues", seenAll: "Vous avez parcouru la sélection du jour. En voici quelques-uns à nouveau." },
  de: { heading: "Entdecke etwas neu", description: "Eine tägliche Auswahl älterer, weniger angesehener Titel. Deine Lese- und Merkliste beeinflusst die Auswahl auf diesem Gerät.", reason: "Nach deinen Interessen ausgewählt", start: "Lies oder speichere Titel, um die Auswahl anzupassen.", refreshed: "Jeden Tag neue Vorschläge", published: "Veröffentlicht", views: "Aufrufe", seenAll: "Du hast die heutigen Vorschläge erkundet. Hier sind einige erneut." },
  pt: { heading: "Redescubra algo", description: "Uma seleção diária de títulos antigos e menos vistos. Suas leituras e tags salvas ajudam a escolher neste dispositivo.", reason: "Escolhidos conforme seus interesses", start: "Leia ou salve títulos para personalizar a seleção.", refreshed: "Novas sugestões todos os dias", published: "Publicado", views: "visualizações", seenAll: "Você já explorou as sugestões de hoje. Aqui estão algumas novamente." }
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

  const personalized = useMemo(() => {
    const candidates = titles.filter((title) => !seenSlugs.includes(title.slug));
    const unseen = candidates.length > 0 ? candidates : titles;
    return unseen.map((title, index) => ({
      title,
      order: index,
      matches: title.tags.reduce((sum, tag) => sum + (preferences.includes(tag) ? 1 : 0), 0)
    })).sort((left, right) => right.matches - left.matches || left.order - right.order);
  }, [preferences, seenSlugs, titles]);
  const hasPreferences = preferences.length > 0 && personalized.some((item) => item.matches > 0);
  const shown = (hasPreferences ? personalized.filter((item) => item.matches > 0) : personalized).slice(0, 12);
  const text = copy[locale];
  const allSeen = titles.length > 0 && titles.every((title) => seenSlugs.includes(title.slug));

  return (
    <section aria-labelledby="discover-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">{text.refreshed}</p>
          <h1 id="discover-heading" className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{text.heading}</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-[var(--muted)]">{text.description}</p>
          <p className="mt-2 text-xs font-black text-[var(--muted)]">{hasPreferences ? text.reason : text.start}</p>
        </div>
      </div>
      {allSeen ? <p className="mb-3 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--muted)]">{text.seenAll}</p> : null}
      {shown.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{shown.map(({ title }, index) => <DiscoveryCard key={title.slug} title={title} locale={locale} priority={index < 2} />)}</div> : <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm font-bold text-[var(--muted)]">{text.start}</p>}
    </section>
  );
}

function DiscoveryCard({ title, locale, priority }: { title: DiscoverTitle; locale: Locale; priority: boolean }) {
  const text = copy[locale];
  return <Link href={`/${locale}/manga/${title.slug}`} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg">
    <div className="relative aspect-[2/3] bg-[var(--surface-strong)]"><Image src={title.coverUrl} alt={title.coverAlt} fill sizes="(min-width:1024px) 16vw,50vw" className="object-cover" priority={priority} /></div>
    <div className="p-3">
      <h2 className="line-clamp-2 min-h-10 text-sm font-black leading-5 group-hover:text-[var(--accent)]">{title.title}</h2>
      <p className="mt-1 truncate text-xs font-bold text-[var(--muted)]">{title.author}</p>
      <div className="mt-2 flex flex-wrap gap-1">{title.tags.slice(0, 2).map((tag) => <span key={tag} className="max-w-full truncate rounded-full bg-[var(--surface-strong)] px-2 py-1 text-[10px] font-bold text-[var(--muted)]">{tag.replaceAll("-", " ")}</span>)}</div>
      <p className="mt-2 text-[10px] font-bold text-[var(--muted)]">{text.published} {title.publishedAt} · {title.viewCount.toLocaleString(locale)} {text.views}</p>
    </div>
  </Link>;
}

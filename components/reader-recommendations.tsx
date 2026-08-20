"use client";

import { useRef } from "react";
import Link from "next/link";
import type { DemoTitle } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";
import { ContentImage } from "./content-image";

const labels: Record<Locale, string> = { en: "You may also like", es: "También te puede gustar", fr: "Vous aimerez aussi", de: "Das könnte dir auch gefallen", pt: "Você também pode gostar" };

export function ReaderRecommendations({ titles, locale }: { titles: DemoTitle[]; locale: Locale }) {
  const rail = useRef<HTMLDivElement>(null);
  if (titles.length === 0) return null;
  const move = (direction: 1 | -1) => rail.current?.scrollBy({ left: direction * Math.round(rail.current.clientWidth * 0.8), behavior: "smooth" });
  return <section className="mx-auto max-w-[1040px] px-4 pb-10" onClick={(event) => event.stopPropagation()}>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-white">{labels[locale]}</h2><div className="flex gap-2"><button type="button" onClick={() => move(-1)} aria-label="Previous recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 font-black text-white">‹</button><button type="button" onClick={() => move(1)} aria-label="Next recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 font-black text-white">›</button></div></div>
    <div ref={rail} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {titles.map((title) => <article key={title.slug} className="w-[132px] shrink-0 snap-start sm:w-[150px]"><Link href={localizedPath(locale, `/manga/${title.slug}`)} className="block"><div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5"><ContentImage src={title.cover.src} alt={title.cover.alt} fill sizes="150px" className="object-cover" /></div><h3 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-white">{title.titles[locale]}</h3><p className="mt-1 truncate text-xs font-bold text-white/50">{title.tags.slice(0, 2).join(" · ")}</p></Link></article>)}
    </div>
  </section>;
}

"use client";

import { useRef } from "react";
import type { Locale } from "@/lib/i18n";
import type { DemoTitle } from "@/lib/demo-data";
import { CompactMangaCard } from "./compact-manga-card";
import { MangaRailHeader } from "./manga-rail-header";
import { RankedMangaCard } from "./ranked-manga-card";

export function MangaRail({
  title,
  subtitle,
  href,
  items,
  ranked = false,
  cardVariant = "standard",
  locale
}: {
  title: string;
  subtitle?: string;
  href?: string;
  items: DemoTitle[];
  ranked?: boolean;
  cardVariant?: "standard" | "updates";
  locale: Locale;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    rail.scrollBy({ left: direction * Math.round(rail.clientWidth * 0.82), behavior: "smooth" });
  }

  return (
    <section
      data-manga-rail={title}
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <MangaRailHeader
        title={title}
        badge={subtitle}
        href={href}
        onPrevious={() => scrollByPage(-1)}
        onNext={() => scrollByPage(1)}
      />
      <div
        ref={railRef}
        data-rail-scroller
        aria-label={title}
        tabIndex={0}
        className="no-scrollbar touch-scroll -mx-3 flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-3 pb-0.5"
      >
        {items.map((item, index) =>
          ranked ? (
            <RankedMangaCard
              key={`${title}-${item.slug}`}
              title={item}
              locale={locale}
              rank={index + 1}
              priority={index < 4}
              badge={index < 3 ? "UP" : undefined}
            />
          ) : (
            <CompactMangaCard
              key={`${title}-${item.slug}`}
              title={item}
              locale={locale}
              priority={index < 4}
              badge={cardVariant === "updates" ? (index < 3 ? "NEW" : locale.toUpperCase()) : undefined}
            />
          )
        )}
      </div>
    </section>
  );
}

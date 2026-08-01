"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoAsset } from "@/lib/demo-data";
import { ReaderHeader } from "./reader-header";
import { ReaderControls } from "./reader-controls";
import { EndOfChapter } from "./end-of-chapter";

type VerticalReaderProps = {
  locale: Locale;
  titleSlug: string;
  title: string;
  chapter: string;
  pages: DemoAsset[];
  previousHref?: string;
  nextHref?: string;
  storageKey: string;
  reportHref: string;
};

export function VerticalReader({
  locale,
  titleSlug,
  title,
  chapter,
  pages,
  previousHref,
  nextHref,
  storageKey,
  reportHref
}: VerticalReaderProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const restored = useRef(false);

  const preloadUrls = useMemo(() => pages.slice(1, 4).map((page) => page.src), [pages]);

  useEffect(() => {
    for (const url of preloadUrls) {
      const image = new Image();
      image.src = url;
    }
  }, [preloadUrls]);

  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const nextTop = Number.parseInt(saved, 10);
      if (Number.isFinite(nextTop)) {
        window.requestAnimationFrame(() => window.scrollTo({ top: nextTop }));
      }
    }
  }, [storageKey]);

  useEffect(() => {
    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollHeight <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
      setProgress(nextProgress);
      window.localStorage.setItem(storageKey, String(Math.round(scrollTop)));
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [storageKey]);

  function markFailed(id: string) {
    setFailedImages((current) => new Set(current).add(id));
  }

  return (
    <main className="reader-shell min-h-screen" onClick={() => setControlsVisible((value) => !value)}>
      <ReaderHeader
        locale={locale}
        titleSlug={titleSlug}
        title={title}
        chapter={chapter}
        progress={progress}
        previousHref={previousHref}
        nextHref={nextHref}
        visible={controlsVisible}
      />
      <div className="mx-auto max-w-[840px] pt-14">
        {pages.length === 0 ? (
          <div className="px-4 py-20 text-center text-white/65">No pages are available for this chapter.</div>
        ) : (
          pages.map((page, index) => (
            <figure key={page.id} className="m-0 w-full bg-black">
              {failedImages.has(page.id) ? (
                <div className="flex min-h-[60vh] items-center justify-center border border-white/10 px-6 text-center text-sm text-white/65">
                  This page could not be loaded.
                </div>
              ) : (
                <img
                  src={page.src}
                  alt={page.alt}
                  width={page.width}
                  height={page.height}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : index < 4 ? "auto" : "low"}
                  decoding="async"
                  onError={() => markFailed(page.id)}
                  className="h-auto w-full select-none"
                />
              )}
            </figure>
          ))
        )}
      </div>
      <div className="mx-auto max-w-[840px] px-4 py-5 text-center"><Link href={reportHref} onClick={(event) => event.stopPropagation()} className="text-xs font-bold text-white/60 underline decoration-dotted underline-offset-4">Report this chapter</Link></div>
      <EndOfChapter locale={locale} nextHref={nextHref} />
      <ReaderControls visible={controlsVisible} onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
    </main>
  );
}

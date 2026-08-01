"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { DemoAsset } from "@/lib/demo-data";
import { ReaderHeader } from "./reader-header";
import { ReaderControls } from "./reader-controls";
import { EndOfChapter } from "./end-of-chapter";
import { RECENT_READING_KEY, type RecentReading } from "@/lib/reading-progress";

type VerticalReaderProps = {
  locale: Locale;
  titleSlug: string;
  title: string;
  chapter: string;
  coverUrl: string;
  coverAlt: string;
  chapterHref: string;
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
  coverUrl,
  coverAlt,
  chapterHref,
  pages,
  previousHref,
  nextHref,
  storageKey,
  reportHref
}: VerticalReaderProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const [resumeTop, setResumeTop] = useState<number | null>(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [canTrackProgress, setCanTrackProgress] = useState(false);
  const restored = useRef(false);

  const preloadUrls = useMemo(() => pages.slice(1, 4).map((page) => page.src), [pages]);

  useEffect(() => {
    if (dataSaver) return;
    for (const url of preloadUrls) {
      const image = new Image();
      image.src = url;
    }
  }, [dataSaver, preloadUrls]);

  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const nextTop = Number.parseInt(saved, 10);
      if (Number.isFinite(nextTop) && nextTop > 180) {
        setResumeTop(nextTop);
        return;
      }
    }
    setCanTrackProgress(true);
  }, [storageKey]);

  useEffect(() => {
    if (!canTrackProgress) return;
    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollHeight <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
      setProgress(nextProgress);
      window.localStorage.setItem(storageKey, String(Math.round(scrollTop)));
      if (scrollTop > 80) {
        const recent: RecentReading = {
          locale,
          titleSlug,
          title,
          chapter,
          chapterHref,
          coverUrl,
          coverAlt,
          progress: nextProgress,
          scrollTop: Math.round(scrollTop),
          updatedAt: Date.now()
        };
        window.localStorage.setItem(RECENT_READING_KEY, JSON.stringify(recent));
      }
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
  }, [canTrackProgress, chapter, chapterHref, coverAlt, coverUrl, locale, storageKey, title, titleSlug]);

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
      {resumeTop !== null ? (
        <div className="fixed inset-x-0 bottom-5 z-[60] mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/15 bg-[#1c1f23]/95 p-4 text-white shadow-2xl backdrop-blur" onClick={(event) => event.stopPropagation()}>
          <p className="text-sm font-black">{locale === "en" ? `Resume ${chapter}?` : `¿Continuar ${chapter}?`}</p>
          <p className="mt-1 text-xs leading-5 text-white/65">{locale === "en" ? "Content and advertising load normally before you choose a saved position." : "El contenido y la publicidad se cargan antes de recuperar la posición."}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black" onClick={() => { const target = resumeTop; setResumeTop(null); window.scrollTo({ top: target, behavior: "smooth" }); window.setTimeout(() => setCanTrackProgress(true), 700); }}>{locale === "en" ? "Resume" : "Continuar"}</button>
            <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black" onClick={() => { window.localStorage.setItem(storageKey, "0"); setResumeTop(null); setCanTrackProgress(true); }}>{locale === "en" ? "Start over" : "Empezar de nuevo"}</button>
          </div>
        </div>
      ) : null}
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
      <ReaderControls visible={controlsVisible} dataSaver={dataSaver} onToggleDataSaver={() => setDataSaver((value) => !value)} onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
    </main>
  );
}

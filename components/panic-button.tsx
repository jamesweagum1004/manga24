"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function PanicButton({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const previousTitle = useRef("");
  const available = enabled && !pathname.startsWith("/manga1004") && !pathname.startsWith("/api/");

  useEffect(() => {
    if (!hidden) return;
    previousTitle.current = document.title;
    document.title = "Search";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.title = previousTitle.current;
      document.documentElement.style.overflow = "";
    };
  }, [hidden]);

  useEffect(() => {
    if (!available) setHidden(false);
  }, [available]);

  if (!available) return null;

  return (
    <>
      {hidden ? (
        <div className="fixed inset-0 z-[2147483646] overflow-auto bg-white text-slate-900" role="dialog" aria-modal="true" aria-label="Private screen">
          <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 pb-24 pt-[18vh]">
            <div className="text-4xl font-semibold tracking-tight text-blue-600">Search</div>
            <form action="https://www.google.com/search" method="get" className="mt-8 flex w-full max-w-xl items-center rounded-full border border-slate-300 bg-white px-5 shadow-sm">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-slate-500 stroke-2"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
              <input name="q" autoFocus aria-label="Search" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-base outline-none" />
            </form>
            <div className="mt-10 grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["News", "https://news.google.com/"],
                ["Weather", "https://www.google.com/search?q=weather"],
                ["Maps", "https://maps.google.com/"],
                ["Mail", "https://mail.google.com/"]
              ].map(([label, href]) => <a key={label} href={href} className="rounded-xl border border-slate-200 px-4 py-5 text-center text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50">{label}</a>)}
            </div>
          </main>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setHidden((value) => !value)}
        aria-label={hidden ? "Return to reading" : "Open private screen"}
        title={hidden ? "Return" : "Quick hide"}
        className={`fixed right-5 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${hidden ? "bottom-5 z-[2147483647] border-slate-300 bg-white text-slate-600 focus-visible:outline-blue-500" : "bottom-24 z-30 border-white/20 bg-slate-800 text-white focus-visible:outline-white md:bottom-5"}`}
      >
        {hidden ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="m15 18-6-6 6-6" /><path d="M9 12h11" /></svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="M6 8h12l1 11H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
        )}
      </button>
    </>
  );
}

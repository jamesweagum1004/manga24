"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { localizedPath, switchLocalePath } from "@/lib/routes";
import { ThemeToggle } from "./theme-toggle";

export function CompactSiteHeader({ locale, enabledLocales, logoUrl }: { locale: Locale; enabledLocales: Locale[]; logoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = dictionary[locale];
  const links = [
    { href: localizedPath(locale, "/latest"), label: t.latest },
    { href: localizedPath(locale, "/popular"), label: t.popular },
    { href: localizedPath(locale, "/tags/romance"), label: t.tags }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--surface)]/88 shadow-[0_6px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl md:border-[var(--border)] md:shadow-none">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-2 px-3 sm:h-[58px] sm:px-4 lg:h-[72px] lg:px-6">
        <Link href={localizedPath(locale)} className="flex min-w-0 shrink items-center gap-2" aria-label="Manga24 home">
          {logoUrl ? <img src={logoUrl} alt="Manga24" className="h-9 max-w-40 object-contain lg:h-11" /> : <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-[11px] font-black text-white shadow-[0_5px_14px_color-mix(in_srgb,var(--accent)_28%,transparent)] lg:h-10 lg:w-10 lg:rounded-xl lg:text-xs">M24</span><span className="truncate text-xl font-black leading-none tracking-[-0.035em] lg:text-2xl lg:tracking-[-0.04em]">Manga24</span></>}
        </Link>

        <nav className="ml-3 hidden items-center gap-1 md:flex lg:ml-8 lg:gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[var(--surface-strong)]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={t.search}
            title={t.search}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
          >
            <SearchIcon />
          </button>
          <select
            aria-label="Locale"
            value={locale}
            onChange={(event) => router.push(switchLocalePath(pathname, event.target.value as Locale))}
            className="h-10 w-[54px] shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-black uppercase"
          >
            {enabledLocales.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ThemeToggle label={t.theme} />
          <button
            type="button"
            aria-expanded={open}
            aria-label={t.menu}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:hidden">
          <nav className="mx-auto grid max-w-[1320px] grid-cols-3 gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg bg-[var(--surface-strong)] px-3 py-3 text-center text-sm font-bold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

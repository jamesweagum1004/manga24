"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";
import { LocaleSelect } from "./locale-select";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const t = dictionary[locale];
  const links = [
    { href: localizedPath(locale, "/latest"), label: t.latest },
    { href: localizedPath(locale, "/popular"), label: t.popular },
    { href: localizedPath(locale, "/tags"), label: t.tags }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href={localizedPath(locale)} className="flex min-w-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-white">
            M24
          </span>
          <span className="truncate text-lg font-black">Manga24</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-strong)]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={t.search}
            title={t.search}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-bold"
          >
            S
          </button>
          <LocaleSelect locale={locale} />
          <ThemeToggle label={t.theme} />
          <button
            type="button"
            aria-expanded={open}
            aria-label={t.menu}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-bold md:hidden"
          >
            =
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-[var(--surface-strong)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

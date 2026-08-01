"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

const items = [
  { key: "home", path: "", label: { en: "Home", es: "Inicio" }, icon: HomeIcon },
  { key: "latest", path: "/latest", label: { en: "Latest", es: "Nuevos" }, icon: SparkIcon },
  { key: "popular", path: "/popular", label: { en: "Popular", es: "Popular" }, icon: FlameIcon },
  { key: "tags", path: "/tags/romance", label: { en: "Genres", es: "Géneros" }, icon: GridIcon }
] as const;

export function MobileBottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-[var(--surface)]/92 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,0.10)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {items.map((item) => {
            const href = localizedPath(locale, item.path);
            const active = item.path === "" ? pathname === href : pathname.startsWith(href);
            const Icon = item.icon;
            return <Link key={item.key} href={href} aria-current={active ? "page" : undefined} className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-black transition-colors ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}><span className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : ""}`}><Icon /></span><span>{item.label[locale]}</span>{active ? <span className="absolute -top-2 h-0.5 w-7 rounded-full bg-[var(--accent)]" /> : null}</Link>;
          })}
        </div>
      </nav>
    </>
  );
}

function HomeIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></svg>; }
function SparkIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></svg>; }
function FlameIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c4 0 7-2.8 7-7 0-3-1.6-5.5-4.7-8.2.1 2.4-.8 3.7-2.1 4.5.1-3.6-1.8-6.4-4.8-9.3.2 4.6-2.4 6.7-2.4 10.8C5 18 8 22 12 22Z" /></svg>; }
function GridIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>; }

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/demo-data";
import { localizedPath } from "@/lib/routes";

export function MobileNavigation({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const links = [
    { href: localizedPath(locale), label: "Home" },
    { href: localizedPath(locale, "/latest"), label: t.latest },
    { href: localizedPath(locale, "/popular"), label: t.popular },
    { href: localizedPath(locale, "/tags/romance"), label: t.tags }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-2 py-2 md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl px-2 py-3 text-center text-xs font-bold">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

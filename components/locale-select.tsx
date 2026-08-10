"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeFlags, localeLabels, locales, type Locale } from "@/lib/i18n";
import { switchLocalePath } from "@/lib/routes";

export function LocaleSelect({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      aria-label="Locale"
      value={locale}
      onChange={(event) => router.push(switchLocalePath(pathname, event.target.value as Locale))}
      className="h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold"
    >
      {locales.map((item) => (
        <option key={item} value={item}>
          {localeFlags[item]} {localeLabels[item]}
        </option>
      ))}
    </select>
  );
}

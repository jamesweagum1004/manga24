"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeFlags, localeLabels, locales, type Locale } from "@/lib/i18n";
import { switchLocalePath } from "@/lib/routes";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="sr-only" htmlFor="locale-switcher">
      Locale
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => router.push(switchLocalePath(pathname, event.target.value as Locale))}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {localeFlags[item]} {localeLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}

import type { Locale } from "./i18n";

export function localizedPath(locale: Locale, path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

export function switchLocalePath(pathname: string, nextLocale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return `/${nextLocale}`;
  }
  parts[0] = nextLocale;
  return `/${parts.join("/")}`;
}

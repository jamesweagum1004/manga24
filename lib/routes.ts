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
  // Titles are independent per locale, so the current manga/chapter slug may
  // not exist in the selected language. Send readers to that locale's home
  // instead of constructing a guaranteed 404.
  if (parts[1] === "manga") {
    return `/${nextLocale}`;
  }
  parts[0] = nextLocale;
  return `/${parts.join("/")}`;
}

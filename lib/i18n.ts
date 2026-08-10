export const locales = ["en", "es", "fr", "de", "pt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português"
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function normalizeEnabledLocales(value: unknown): Locale[] {
  const selected = Array.isArray(value) ? value.filter((item): item is Locale => typeof item === "string" && isLocale(item)) : [];
  return locales.filter((locale) => locale === defaultLocale || selected.includes(locale));
}

export function getLocaleOrDefault(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

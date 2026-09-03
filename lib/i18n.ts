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

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  pt: "🇵🇹🇧🇷"
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

export function getDisplayLocaleForOriginalLanguage(value: string): Locale | null {
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, Locale> = {
    en: "en", english: "en",
    es: "es", spanish: "es", español: "es",
    fr: "fr", french: "fr", français: "fr",
    de: "de", german: "de", deutsch: "de",
    pt: "pt", portuguese: "pt", português: "pt"
  };
  return aliases[normalized] ?? aliases[normalized.split(/[-_]/u)[0]] ?? null;
}

export function displayLocalesForOriginalLanguage(value: string, fallback: Locale[]): Locale[] {
  const locale = getDisplayLocaleForOriginalLanguage(value);
  return locale ? [locale] : fallback;
}

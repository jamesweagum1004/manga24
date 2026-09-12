import type { Locale } from "@/lib/i18n";
import { RECENT_READING_KEY, type RecentReading } from "@/lib/reading-progress";

export const READING_HISTORY_KEY = "manga24:reading-history:v2";
export const SAVED_TITLES_KEY = "manga24:saved-titles:v1";
export const LIBRARY_CHANGED_EVENT = "manga24:library-changed";

export type LibraryTitle = {
  locale: Locale;
  titleSlug: string;
  titleHref: string;
  title: string;
  author: string;
  tags: string[];
  coverUrl: string;
  coverAlt: string;
  updatedAt: number;
};

export type ReadingHistoryItem = LibraryTitle & {
  chapter: string;
  chapterHref: string;
  progress: number;
  scrollTop: number;
};

export function readStoredItems<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function upsertStoredItem<T extends { locale: Locale; titleSlug: string; updatedAt: number }>(key: string, item: T, limit = 40) {
  const items = readStoredItems<T>(key).filter((current) => current.locale !== item.locale || current.titleSlug !== item.titleSlug);
  window.localStorage.setItem(key, JSON.stringify([item, ...items].sort((left, right) => right.updatedAt - left.updatedAt).slice(0, limit)));
  window.dispatchEvent(new CustomEvent(LIBRARY_CHANGED_EVENT));
}

export function removeStoredItem(key: string, locale: Locale, titleSlug: string) {
  const items = readStoredItems<LibraryTitle>(key).filter((item) => item.locale !== locale || item.titleSlug !== titleSlug);
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(LIBRARY_CHANGED_EVENT));
}

export function removeReadingHistoryItem(locale: Locale, titleSlug: string) {
  try {
    const legacy = JSON.parse(window.localStorage.getItem(RECENT_READING_KEY) ?? "null") as RecentReading | null;
    if (legacy?.locale === locale && legacy.titleSlug === titleSlug) window.localStorage.removeItem(RECENT_READING_KEY);
  } catch {
    window.localStorage.removeItem(RECENT_READING_KEY);
  }
  removeStoredItem(READING_HISTORY_KEY, locale, titleSlug);
}

export const RECENT_READING_KEY = "manga24:recent-reading:v1";

import type { Locale } from "./i18n";

export type RecentReading = {
  locale: Locale;
  titleSlug: string;
  title: string;
  chapter: string;
  chapterHref: string;
  coverUrl: string;
  coverAlt: string;
  progress: number;
  scrollTop: number;
  updatedAt: number;
};

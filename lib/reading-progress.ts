export const RECENT_READING_KEY = "manga24:recent-reading:v1";

export type RecentReading = {
  locale: "en" | "es";
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

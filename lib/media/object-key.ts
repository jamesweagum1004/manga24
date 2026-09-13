import { getDisplayLocaleForOriginalLanguage } from "@/lib/i18n";

type ContentFormat = "manga" | "manhwa";

export function coverObjectPrefix(format: ContentFormat, originalLanguage: string, titleSlug: string, titleCreatedAt: Date) {
  return `${titleObjectPrefix(format, originalLanguage, titleSlug, titleCreatedAt)}/cover`;
}

export function chapterObjectPrefix(format: ContentFormat, originalLanguage: string, titleSlug: string, chapterSlug: string, titleCreatedAt: Date) {
  return `${titleObjectPrefix(format, originalLanguage, titleSlug, titleCreatedAt)}/chapters/${chapterSlug}`;
}

function titleObjectPrefix(format: ContentFormat, originalLanguage: string, titleSlug: string, titleCreatedAt: Date) {
  if (Number.isNaN(titleCreatedAt.getTime())) {
    throw new Error("The title creation date is invalid.");
  }

  const locale = getDisplayLocaleForOriginalLanguage(originalLanguage);
  if (!locale) throw new Error(`Unsupported original language: ${originalLanguage}`);

  const year = titleCreatedAt.getUTCFullYear();
  const month = String(titleCreatedAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(titleCreatedAt.getUTCDate()).padStart(2, "0");
  return `${format}/${locale}/${year}/${month}/${day}/${titleSlug}`;
}

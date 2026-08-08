type ContentFormat = "manga" | "manhwa";

export function coverObjectPrefix(format: ContentFormat, titleSlug: string, titleCreatedAt: Date) {
  return `${titleObjectPrefix(format, titleSlug, titleCreatedAt)}/cover`;
}

export function chapterObjectPrefix(format: ContentFormat, titleSlug: string, chapterSlug: string, titleCreatedAt: Date) {
  return `${titleObjectPrefix(format, titleSlug, titleCreatedAt)}/chapters/${chapterSlug}`;
}

function titleObjectPrefix(format: ContentFormat, titleSlug: string, titleCreatedAt: Date) {
  if (Number.isNaN(titleCreatedAt.getTime())) {
    throw new Error("The title creation date is invalid.");
  }

  const year = titleCreatedAt.getUTCFullYear();
  const month = String(titleCreatedAt.getUTCMonth() + 1).padStart(2, "0");
  return `${format}/${year}/${month}/${titleSlug}`;
}

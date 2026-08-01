export function coverObjectPrefix(format: "manga" | "manhwa", now = new Date()) {
  return `cover/${format}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function chapterObjectPrefix(format: "manga" | "manhwa", titleSlug: string, chapterSlug: string, now = new Date()) {
  return `pages/${format}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${titleSlug}/${chapterSlug}`;
}

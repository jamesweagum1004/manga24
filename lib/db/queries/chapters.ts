import { getDbTitleBySlug } from "./titles";

export async function getDbChapterBySlug(titleSlug: string, chapterSlug: string) {
  const title = await getDbTitleBySlug(titleSlug);
  if (!title) {
    return null;
  }

  const chapter = title.chapters.find((item) => item.slug === chapterSlug);
  return chapter ? { title, chapter } : null;
}

import { demoTags, demoTitles, findChapter, findTitle, latestTitles, popularTitles } from "@/lib/demo-data";
import {
  adminChapterListFromDemoTitles,
  getDbChapterBySlug,
  listDbAdminChapters
} from "@/lib/db/queries/chapters";
import { adminTagListFromDemoTags, listDbAdminTags } from "@/lib/db/queries/tags";
import {
  adminTitleListFromDemoTitles,
  getDbTitleForAdmin,
  getDbTitleBySlug,
  listDbAdminTitles,
  listDbTitles,
  titleFormValuesFromDemoTitle
} from "@/lib/db/queries/titles";
import { hasDatabaseUrl } from "@/lib/env";

export const databaseNotConfiguredMessage = "Database is not configured. Set DATABASE_URL to enable writes.";

export function isDatabaseConfigured() {
  return hasDatabaseUrl();
}

export function getActiveDataSource() {
  return isDatabaseConfigured() ? "database" : "demo";
}

export async function getCatalogTitles() {
  if (isDatabaseConfigured()) {
    return listDbTitles();
  }

  return demoTitles;
}

export async function getAdminTitleList() {
  if (isDatabaseConfigured()) {
    return listDbAdminTitles();
  }

  return adminTitleListFromDemoTitles(demoTitles);
}

export async function getLatestCatalogTitles() {
  if (isDatabaseConfigured()) {
    const titles = await listDbTitles();
    return [...titles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  return latestTitles();
}

export async function getPopularCatalogTitles() {
  if (isDatabaseConfigured()) {
    const titles = await listDbTitles();
    return [...titles].sort((a, b) => b.viewCount - a.viewCount);
  }

  return popularTitles();
}

export async function getCatalogTitleBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    return getDbTitleBySlug(slug);
  }

  return findTitle(slug) ?? null;
}

export async function getCatalogChapterBySlug(titleSlug: string, chapterSlug: string) {
  if (isDatabaseConfigured()) {
    return getDbChapterBySlug(titleSlug, chapterSlug);
  }

  return findChapter(titleSlug, chapterSlug);
}

export async function getAdminTitleById(id: string) {
  if (isDatabaseConfigured()) {
    return getDbTitleForAdmin(id);
  }

  const title = findTitle(id);
  return title ? { id: title.slug, values: titleFormValuesFromDemoTitle(title) } : null;
}

export async function getAdminChapterList() {
  if (isDatabaseConfigured()) {
    return listDbAdminChapters();
  }

  return adminChapterListFromDemoTitles(demoTitles);
}

export async function getAdminTagList() {
  if (isDatabaseConfigured()) {
    return listDbAdminTags();
  }

  return adminTagListFromDemoTags(demoTags);
}

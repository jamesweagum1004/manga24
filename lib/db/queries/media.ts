import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { assets, chapterLocalizations, chapterPages, chapters, titles } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import type { UploadedMedia } from "@/lib/media/b2-upload";

export async function getTitleMediaTarget(id: string) {
  const [row] = await getDb().select({ id: titles.id, slug: titles.slug, format: titles.format, originalTitle: titles.originalTitle, originalLanguage: titles.originalLanguage, coverAssetId: titles.coverAssetId, publishedAt: titles.publishedAt, createdAt: titles.createdAt }).from(titles).where(eq(titles.id, id)).limit(1);
  return row ?? null;
}

export async function getTitlePublishingState(id: string) {
  const target = await getTitleMediaTarget(id);
  if (!target) return null;
  const publishedChapters = await getDb().select({ id: chapters.id }).from(chapters).where(and(eq(chapters.titleId, id), eq(chapters.publicationStatus, "published")));
  if (publishedChapters.length === 0) return { ...target, ready: false, reason: "Add a published chapter before publishing." };
  const [page] = await getDb().select({ id: chapterPages.id }).from(chapterPages).innerJoin(chapters, eq(chapterPages.chapterId, chapters.id)).where(and(eq(chapters.titleId, id), eq(chapters.publicationStatus, "published"))).limit(1);
  if (!target.coverAssetId) return { ...target, ready: false, reason: "Upload a cover before publishing." };
  if (!page) return { ...target, ready: false, reason: "Upload pages to a published chapter before publishing." };
  return { ...target, ready: true, reason: null };
}

export async function publishTitle(id: string) {
  await getDb().update(titles).set({ publishedAt: new Date(), updatedAt: new Date() }).where(eq(titles.id, id));
}

export async function unpublishTitle(id: string) {
  await getDb().update(titles).set({ publishedAt: null, updatedAt: new Date() }).where(eq(titles.id, id));
}

export async function getChapterMediaTarget(id: string) {
  const [row] = await getDb().select({ id: chapters.id, titleId: chapters.titleId, slug: chapters.slug, titleSlug: titles.slug, title: titles.originalTitle, originalLanguage: titles.originalLanguage, format: titles.format, titleCreatedAt: titles.createdAt, publicationStatus: chapters.publicationStatus }).from(chapters).innerJoin(titles, eq(chapters.titleId, titles.id)).where(eq(chapters.id, id)).limit(1);
  if (!row) return null;
  const [localization] = await getDb().select({ id: chapterLocalizations.id }).from(chapterLocalizations).where(eq(chapterLocalizations.chapterId, id)).orderBy(asc(chapterLocalizations.locale)).limit(1);
  return localization ? { ...row, chapterLocalizationId: localization.id } : null;
}

export type StoredAsset = {
  provider: string;
  bucket: string | null;
  objectKey: string;
};

export async function getTitleAssetsForDeletion(id: string) {
  const [title] = await getDb().select({ format: titles.format, coverAssetId: titles.coverAssetId }).from(titles).where(eq(titles.id, id)).limit(1);
  if (!title) return null;
  const cover = title.coverAssetId
    ? await getDb().select({ provider: assets.provider, bucket: assets.bucket, objectKey: assets.objectKey }).from(assets).where(eq(assets.id, title.coverAssetId))
    : [];
  const pages = await getDb()
    .select({ provider: assets.provider, bucket: assets.bucket, objectKey: assets.objectKey })
    .from(chapterPages)
    .innerJoin(chapters, eq(chapterPages.chapterId, chapters.id))
    .innerJoin(assets, eq(chapterPages.assetId, assets.id))
    .where(eq(chapters.titleId, id));
  return { format: title.format, assets: uniqueStoredAssets([...cover, ...pages]) };
}

export async function getChapterAssetsForDeletion(id: string) {
  const [chapter] = await getDb().select({ format: titles.format }).from(chapters).innerJoin(titles, eq(chapters.titleId, titles.id)).where(eq(chapters.id, id)).limit(1);
  if (!chapter) return null;
  const pages = await getDb()
    .select({ provider: assets.provider, bucket: assets.bucket, objectKey: assets.objectKey })
    .from(chapterPages)
    .innerJoin(assets, eq(chapterPages.assetId, assets.id))
    .where(eq(chapterPages.chapterId, id));
  return { format: chapter.format, assets: uniqueStoredAssets(pages) };
}

function uniqueStoredAssets(rows: StoredAsset[]) {
  return [...new Map(rows.map((asset) => [`${asset.provider}:${asset.bucket ?? ""}:${asset.objectKey}`, asset])).values()];
}

export async function getChapterIdForImport(titleId: string, slug: string) {
  const [row] = await getDb().select({ id: chapters.id }).from(chapters).where(and(eq(chapters.titleId, titleId), eq(chapters.slug, slug))).limit(1);
  return row?.id ?? null;
}

export async function attachCover(titleId: string, media: UploadedMedia, altText: string) {
  await getDb().transaction(async (tx) => {
    const [asset] = await tx.insert(assets).values({ kind: "cover", provider: media.provider, bucket: media.bucket, objectKey: media.objectKey, publicUrl: media.publicUrl, width: media.width, height: media.height, altText, contentType: media.contentType, fileSize: media.fileSize }).returning({ id: assets.id });
    await tx.update(titles).set({ coverAssetId: asset.id, updatedAt: new Date() }).where(eq(titles.id, titleId));
  });
}

export async function replaceChapterPages(chapterId: string, chapterLocalizationId: string, media: UploadedMedia[], altPrefix: string) {
  await getDb().transaction(async (tx) => {
    const inserted = await tx.insert(assets).values(media.map((item, index) => ({ kind: "chapter_page" as const, provider: item.provider, bucket: item.bucket, objectKey: item.objectKey, publicUrl: item.publicUrl, width: item.width, height: item.height, altText: `${altPrefix} page ${index + 1}`, contentType: item.contentType, fileSize: item.fileSize }))).returning({ id: assets.id });
    await tx.delete(chapterPages).where(eq(chapterPages.chapterId, chapterId));
    await tx.insert(chapterPages).values(inserted.map((asset, index) => ({ chapterId, chapterLocalizationId, assetId: asset.id, pageNumber: index + 1 })));
    await tx.update(chapters).set({ updatedAt: new Date() }).where(eq(chapters.id, chapterId));
  });
}

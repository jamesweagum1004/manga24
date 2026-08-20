import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import {
  assets,
  chapterLocalizations,
  chapterPages,
  chapters,
  contentRatingEnum,
  tags,
  titleLocalizations,
  titleStatusEnum,
  titleViewEvents,
  titles,
  titleTags
} from "@/db/schema";
import type { DemoChapter, DemoTitle } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";
import { getDb } from "../client";
import { imageCdnUrl } from "@/lib/media/public-url";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { getStoragePublicUrls } from "@/lib/db/queries/storage-configs";

export type TitleFormValues = {
  canonicalSlug: string;
  originalTitle: string;
  authorName: string;
  originalLanguage: string;
  displayLocales: Locale[];
  contentRating: "safe" | "mature_18";
  publicationStatus: "ongoing" | "completed" | "hiatus" | "cancelled";
  format: "manga" | "manhwa";
  enTitle: string;
  enSlug: string;
  enDescription: string;
  esTitle: string;
  esSlug: string;
  esDescription: string;
  enSeoTitle: string;
  enSeoDescription: string;
  enSeoKeywords: string;
  esSeoTitle: string;
  esSeoDescription: string;
  esSeoKeywords: string;
  frTitle: string;
  frSlug: string;
  frDescription: string;
  frSeoTitle: string;
  frSeoDescription: string;
  frSeoKeywords: string;
  deTitle: string;
  deSlug: string;
  deDescription: string;
  deSeoTitle: string;
  deSeoDescription: string;
  deSeoKeywords: string;
  ptTitle: string;
  ptSlug: string;
  ptDescription: string;
  ptSeoTitle: string;
  ptSeoDescription: string;
  ptSeoKeywords: string;
  tags: string;
};

export type AdminTitleListItem = {
  id: string;
  originalTitle: string;
  canonicalSlug: string;
  publicationStatus: string;
  publicationStatusValue: DbTitleStatus;
  contentRating: string;
  format: "manga" | "manhwa";
  originalLanguage: string;
  displayLocales: Locale[];
  isPublished: boolean;
  updatedAtValue: number;
  updatedAt: string;
  enTitle: string;
  esTitle: string;
  frTitle: string;
  deTitle: string;
  ptTitle: string;
  aiContentGeneratedAt: string | null;
};

type DbTitleStatus = (typeof titleStatusEnum.enumValues)[number];
type DbContentRating = (typeof contentRatingEnum.enumValues)[number];

type BaseTitleRow = {
  id: string;
  slug: string;
  originalTitle: string;
  originalLanguage: string;
  displayLocales: string[];
  authorName: string;
  format: "manga" | "manhwa";
  publicationStatus: DbTitleStatus;
  contentRating: DbContentRating;
  publishedAt: Date | null;
  viewCount: number;
  aiContentGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coverId: string | null;
  coverPublicUrl: string | null;
  coverObjectKey: string | null;
  coverAltText: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
};

type LocalizationRow = typeof titleLocalizations.$inferSelect;
type TagRow = { titleId: string; slug: string };
type ChapterRow = typeof chapters.$inferSelect;
type ChapterLocalizationRow = typeof chapterLocalizations.$inferSelect;
type ChapterPageRow = {
  chapterId: string;
  pageNumber: number;
  assetId: string;
  publicUrl: string;
  objectKey: string;
  altText: string;
  width: number;
  height: number;
};

const fallbackCover = {
  id: "cover-static",
  src: "/placeholders/cover-static.svg",
  alt: "Abstract Manga24 cover placeholder",
  width: 640,
  height: 960
};

export const emptyTitleFormValues: TitleFormValues = {
  canonicalSlug: "",
  originalTitle: "",
  authorName: "",
  originalLanguage: "en",
  displayLocales: ["en", "es", "fr", "de", "pt"],
  contentRating: "mature_18",
  publicationStatus: "ongoing",
  format: "manga",
  enTitle: "",
  enSlug: "",
  enDescription: "",
  esTitle: "",
  esSlug: "",
  esDescription: "",
  enSeoTitle: "",
  enSeoDescription: "",
  enSeoKeywords: "",
  esSeoTitle: "",
  esSeoDescription: "",
  esSeoKeywords: "",
  frTitle: "", frSlug: "", frDescription: "", frSeoTitle: "", frSeoDescription: "", frSeoKeywords: "",
  deTitle: "", deSlug: "", deDescription: "", deSeoTitle: "", deSeoDescription: "", deSeoKeywords: "",
  ptTitle: "", ptSlug: "", ptDescription: "", ptSeoTitle: "", ptSeoDescription: "", ptSeoKeywords: "",
  tags: ""
};

export async function listDbTitles() {
  const rows = await selectPublishedTitleRows();
  return hydrateTitleRows(rows, false);
}

export async function listDbRecentTitleViews(since: Date) {
  return getDb()
    .select({
      slug: titles.slug,
      views: sql<number>`count(*)`.mapWith(Number)
    })
    .from(titleViewEvents)
    .innerJoin(titles, eq(titleViewEvents.titleId, titles.id))
    .where(gte(titleViewEvents.viewedAt, since))
    .groupBy(titles.slug)
    .orderBy(desc(sql`count(*)`));
}

export async function recordDbTitleView(slug: string) {
  const db = getDb();
  const [title] = await db
    .select({ id: titles.id })
    .from(titles)
    .where(and(eq(titles.slug, slug), isNotNull(titles.publishedAt)))
    .limit(1);
  if (!title) return false;

  await db.transaction(async (transaction) => {
    await transaction.insert(titleViewEvents).values({ titleId: title.id });
    await transaction
      .update(titles)
      .set({ viewCount: sql`${titles.viewCount} + 1` })
      .where(eq(titles.id, title.id));
  });
  return true;
}

export async function listDbAdminTitles(): Promise<AdminTitleListItem[]> {
  const rows = await selectAllTitleRows();
  if (rows.length === 0) {
    return [];
  }

  const localizationsByTitle = await getLocalizationsByTitle(rows.map((row) => row.id));

  return rows.map((row) => {
    const localizations = getLocalizationMap(row, localizationsByTitle.get(row.id) ?? []);

    return {
      id: row.id,
      originalTitle: row.originalTitle,
      canonicalSlug: row.slug,
      publicationStatus: displayStatus(row.publicationStatus),
      publicationStatusValue: row.publicationStatus,
      contentRating: displayContentRating(row.contentRating),
      format: row.format,
      originalLanguage: row.originalLanguage,
      displayLocales: normalizeDisplayLocales(row.displayLocales),
      isPublished: Boolean(row.publishedAt),
      updatedAtValue: row.updatedAt.getTime(),
      updatedAt: formatDateTime(row.updatedAt),
      enTitle: localizations.en.title,
      esTitle: localizations.es.title,
      frTitle: localizations.fr.title,
      deTitle: localizations.de.title,
      ptTitle: localizations.pt.title,
      aiContentGeneratedAt: row.aiContentGeneratedAt?.toISOString() ?? null
    };
  });
}

export async function getDbTitleBySlug(slug: string) {
  const rows = await selectPublishedTitleRowsBySlug(slug);
  const hydrated = await hydrateTitleRows(rows);
  return hydrated[0] ?? null;
}

export async function getDbTitleForAdmin(idOrSlug: string) {
  const rows = isUuid(idOrSlug) ? await selectTitleRowsById(idOrSlug) : await selectTitleRowsBySlug(idOrSlug);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const [localizationsByTitle, tagsByTitle] = await Promise.all([
    getLocalizationsByTitle([row.id]),
    getTagSlugsByTitle([row.id])
  ]);

  return {
    id: row.id,
    values: mapTitleFormValues(row, localizationsByTitle.get(row.id) ?? [], tagsByTitle.get(row.id) ?? [])
  };
}

export async function createDbTitle(values: TitleFormValues) {
  const db = getDb();
  const tagSlugs = parseTagSlugs(values.tags);

  return db.transaction(async (tx) => {
    const [title] = await tx
      .insert(titles)
      .values({
        slug: values.canonicalSlug,
        originalTitle: values.originalTitle,
        originalLanguage: values.originalLanguage,
        displayLocales: values.displayLocales,
        authorName: values.authorName,
        format: values.format,
        publicationStatus: values.publicationStatus,
        contentRating: values.contentRating,
        publishedAt: null
      })
      .returning({ id: titles.id });

    await tx.insert(titleLocalizations).values((["en", "es", "fr", "de", "pt"] as const).map((locale) => ({
      titleId: title.id,
      locale,
      title: values[`${locale}Title`],
      slug: values[`${locale}Slug`],
      description: values[`${locale}Description`],
      seoTitle: values[`${locale}SeoTitle`] || null,
      seoDescription: values[`${locale}SeoDescription`] || null,
      seoKeywords: values[`${locale}SeoKeywords`] || null
    })));

    await attachTagsToTitle(tx, title.id, tagSlugs);

    return title.id;
  });
}

export async function updateDbTitle(id: string, values: TitleFormValues) {
  const db = getDb();
  const now = new Date();
  const tagSlugs = parseTagSlugs(values.tags);

  await db.transaction(async (tx) => {
    await tx
      .update(titles)
      .set({
        slug: values.canonicalSlug,
        originalTitle: values.originalTitle,
        originalLanguage: values.originalLanguage,
        displayLocales: values.displayLocales,
        authorName: values.authorName,
        format: values.format,
        publicationStatus: values.publicationStatus,
        contentRating: values.contentRating,
        updatedAt: now
      })
      .where(eq(titles.id, id));

    for (const locale of ["en", "es", "fr", "de", "pt"] as const) {
      await tx
        .insert(titleLocalizations)
        .values({
          titleId: id,
          locale,
          title: values[`${locale}Title`],
          slug: values[`${locale}Slug`],
          description: values[`${locale}Description`],
          seoTitle: values[`${locale}SeoTitle`] || null,
          seoDescription: values[`${locale}SeoDescription`] || null,
          seoKeywords: values[`${locale}SeoKeywords`] || null,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [titleLocalizations.titleId, titleLocalizations.locale],
          set: {
            title: values[`${locale}Title`],
            slug: values[`${locale}Slug`],
            description: values[`${locale}Description`],
            seoTitle: values[`${locale}SeoTitle`] || null,
            seoDescription: values[`${locale}SeoDescription`] || null,
            seoKeywords: values[`${locale}SeoKeywords`] || null,
            updatedAt: now
          }
        });
    }

    await tx.delete(titleTags).where(eq(titleTags.titleId, id));
    await attachTagsToTitle(tx, id, tagSlugs);
  });
}

export async function updateDbTitlesPublicationStatus(ids: string[], publicationStatus: DbTitleStatus) {
  if (ids.length === 0) return;
  await getDb().update(titles).set({ publicationStatus, updatedAt: new Date() }).where(inArray(titles.id, ids));
}

export async function deleteDbTitle(id: string) {
  await getDb().transaction(async (tx) => {
    const [title] = await tx.select({ coverAssetId: titles.coverAssetId }).from(titles).where(eq(titles.id, id)).limit(1);
    if (!title) return;
    const pageAssets = await tx
      .select({ id: chapterPages.assetId })
      .from(chapterPages)
      .innerJoin(chapters, eq(chapterPages.chapterId, chapters.id))
      .where(eq(chapters.titleId, id));
    const assetIds = [...new Set([title.coverAssetId, ...pageAssets.map((asset) => asset.id)].filter((value): value is string => Boolean(value)))];
    await tx.delete(titles).where(eq(titles.id, id));
    if (assetIds.length > 0) await tx.delete(assets).where(inArray(assets.id, assetIds));
  });
}

export async function updateDbTitleSeo(
  id: string,
  seo: Record<Locale, { title: string; description: string; keywords: string[] }>
) {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    const [base] = await tx.select({ slug: titles.slug, originalTitle: titles.originalTitle }).from(titles).where(eq(titles.id, id)).limit(1);
    if (!base) throw new Error("Title not found.");
    for (const locale of ["en", "es", "fr", "de", "pt"] as const) {
      await tx.insert(titleLocalizations).values({
          titleId: id,
          locale,
          title: seo[locale].title || base.originalTitle,
          slug: base.slug,
          description: seo[locale].description,
          seoTitle: seo[locale].title,
          seoDescription: seo[locale].description,
          seoKeywords: seo[locale].keywords.join(", "),
          updatedAt: now
        }).onConflictDoUpdate({
          target: [titleLocalizations.titleId, titleLocalizations.locale],
          set: { seoTitle: seo[locale].title, seoDescription: seo[locale].description, seoKeywords: seo[locale].keywords.join(", "), updatedAt: now }
        });
    }
  });
}

export async function updateDbTitleGeneratedContent(
  id: string,
  content: Record<Locale, { catalogDescription: string; title: string; description: string; keywords: string[] }>
) {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const locale of ["en", "es", "fr", "de", "pt"] as const) {
      await tx.update(titleLocalizations).set({
        description: content[locale].catalogDescription,
        seoTitle: content[locale].title,
        seoDescription: content[locale].description,
        seoKeywords: content[locale].keywords.join(", "),
        updatedAt: now
      }).where(and(eq(titleLocalizations.titleId, id), eq(titleLocalizations.locale, locale)));
    }
    await tx.update(titles).set({ aiContentGeneratedAt: now, updatedAt: now }).where(eq(titles.id, id));
  });
}

export function titleFormValuesFromDemoTitle(title: DemoTitle): TitleFormValues {
  return {
    canonicalSlug: title.slug,
    originalTitle: title.originalTitle,
    authorName: title.author,
    originalLanguage: title.originalLanguage === "English" ? "en" : title.originalLanguage,
    displayLocales: title.displayLocales ?? ["en", "es", "fr", "de", "pt"],
    contentRating: title.contentRating === "Safe" ? "safe" : "mature_18",
    publicationStatus: title.publicationStatus.toLowerCase() as TitleFormValues["publicationStatus"],
    format: "manga",
    enTitle: title.titles.en,
    enSlug: title.slug,
    enDescription: title.descriptions.en,
    esTitle: title.titles.es,
    esSlug: title.slug,
    esDescription: title.descriptions.es,
    enSeoTitle: "",
    enSeoDescription: "",
    enSeoKeywords: "",
    esSeoTitle: "",
    esSeoDescription: "",
    esSeoKeywords: "",
    frTitle: title.titles.fr, frSlug: title.slug, frDescription: title.descriptions.fr, frSeoTitle: "", frSeoDescription: "", frSeoKeywords: "",
    deTitle: title.titles.de, deSlug: title.slug, deDescription: title.descriptions.de, deSeoTitle: "", deSeoDescription: "", deSeoKeywords: "",
    ptTitle: title.titles.pt, ptSlug: title.slug, ptDescription: title.descriptions.pt, ptSeoTitle: "", ptSeoDescription: "", ptSeoKeywords: "",
    tags: title.tags.join(", ")
  };
}

export function adminTitleListFromDemoTitles(titles: DemoTitle[]): AdminTitleListItem[] {
  return titles.map((title) => ({
    id: title.slug,
    originalTitle: title.originalTitle,
    canonicalSlug: title.slug,
    publicationStatus: title.publicationStatus,
    publicationStatusValue: title.publicationStatus.toLowerCase() as DbTitleStatus,
    contentRating: title.contentRating,
    format: "manga",
    originalLanguage: title.originalLanguage,
    displayLocales: title.displayLocales ?? ["en", "es", "fr", "de", "pt"],
    isPublished: true,
    updatedAtValue: new Date(title.publishedAt).getTime(),
    updatedAt: title.publishedAt,
    enTitle: title.titles.en,
    esTitle: title.titles.es,
    frTitle: title.titles.fr,
    deTitle: title.titles.de,
    ptTitle: title.titles.pt,
    aiContentGeneratedAt: null
  }));
}

function selectBaseTitle() {
  return getDb()
    .select({
      id: titles.id,
      slug: titles.slug,
      originalTitle: titles.originalTitle,
      originalLanguage: titles.originalLanguage,
      displayLocales: titles.displayLocales,
      authorName: titles.authorName,
      format: titles.format,
      publicationStatus: titles.publicationStatus,
      contentRating: titles.contentRating,
      publishedAt: titles.publishedAt,
      viewCount: titles.viewCount,
      aiContentGeneratedAt: titles.aiContentGeneratedAt,
      createdAt: titles.createdAt,
      updatedAt: titles.updatedAt,
      coverId: assets.id,
      coverPublicUrl: assets.publicUrl,
      coverObjectKey: assets.objectKey,
      coverAltText: assets.altText,
      coverWidth: assets.width,
      coverHeight: assets.height
    })
    .from(titles)
    .leftJoin(assets, eq(titles.coverAssetId, assets.id));
}

async function selectAllTitleRows() {
  return selectBaseTitle().orderBy(desc(titles.publishedAt), desc(titles.createdAt));
}

async function selectPublishedTitleRows() {
  return selectBaseTitle().where(isNotNull(titles.publishedAt)).orderBy(desc(titles.publishedAt), desc(titles.createdAt));
}

async function selectTitleRowsBySlug(slug: string) {
  return selectBaseTitle().where(eq(titles.slug, slug)).limit(1);
}

async function selectPublishedTitleRowsBySlug(slug: string) {
  return selectBaseTitle().where(and(eq(titles.slug, slug), isNotNull(titles.publishedAt))).limit(1);
}

async function selectTitleRowsById(id: string) {
  return selectBaseTitle().where(eq(titles.id, id)).limit(1);
}

async function hydrateTitleRows(rows: BaseTitleRow[], includeChapterPages = true): Promise<Array<DemoTitle & { id: string }>> {
  if (rows.length === 0) {
    return [];
  }

  const titleIds = rows.map((row) => row.id);
  const [localizationsByTitle, tagsByTitle, settings, storagePublicUrls] = await Promise.all([
    getLocalizationsByTitle(titleIds),
    getTagSlugsByTitle(titleIds),
    getSiteSettings(),
    getStoragePublicUrls()
  ]);
  const publicUrlByTitle = new Map(rows.map((row) => [row.id, storagePublicUrls[row.format] || settings.imageCdnUrl]));
  const chaptersByTitle = await getChaptersByTitle(titleIds, publicUrlByTitle, includeChapterPages);

  return rows.map((row) =>
    mapTitleRow(row, publicUrlByTitle.get(row.id) ?? settings.imageCdnUrl, {
      localizations: localizationsByTitle.get(row.id) ?? [],
      tagSlugs: tagsByTitle.get(row.id) ?? [],
      chapters: chaptersByTitle.get(row.id) ?? []
    })
  );
}

async function getLocalizationsByTitle(titleIds: string[]) {
  const rows = await getDb()
    .select()
    .from(titleLocalizations)
    .where(inArray(titleLocalizations.titleId, titleIds));

  return groupBy(rows, (row) => row.titleId);
}

async function getTagSlugsByTitle(titleIds: string[]) {
  const rows = await getDb()
    .select({
      titleId: titleTags.titleId,
      slug: tags.slug
    })
    .from(titleTags)
    .innerJoin(tags, eq(titleTags.tagId, tags.id))
    .where(inArray(titleTags.titleId, titleIds));

  return groupBy(rows, (row) => row.titleId);
}

async function getChaptersByTitle(titleIds: string[], publicUrlByTitle: Map<string, string>, includePages: boolean) {
  const chapterRows = await getDb()
    .select()
    .from(chapters)
    .where(and(inArray(chapters.titleId, titleIds), eq(chapters.publicationStatus, "published")))
    .orderBy(asc(chapters.chapterNumber));
  if (chapterRows.length === 0) {
    return new Map<string, DemoChapter[]>();
  }

  const chapterIds = chapterRows.map((chapter) => chapter.id);
  const [chapterLocalizationsByChapter, pagesByChapter] = await Promise.all([
    getChapterLocalizationsByChapter(chapterIds),
    includePages ? getChapterPagesByChapter(chapterIds) : Promise.resolve(new Map<string, ChapterPageRow[]>())
  ]);

  const mappedChapters = chapterRows.map((chapter) =>
    mapChapterRow(chapter, chapterLocalizationsByChapter.get(chapter.id) ?? [], pagesByChapter.get(chapter.id) ?? [], publicUrlByTitle.get(chapter.titleId) ?? "")
  );
  const grouped = groupBy(mappedChapters, (item) => item.titleId);
  const result = new Map<string, DemoChapter[]>();

  for (const [titleId, items] of grouped) {
    result.set(
      titleId,
      items.map((item) => item.chapter)
    );
  }

  return result;
}

async function getChapterLocalizationsByChapter(chapterIds: string[]) {
  const rows = await getDb()
    .select()
    .from(chapterLocalizations)
    .where(inArray(chapterLocalizations.chapterId, chapterIds));

  return groupBy(rows, (row) => row.chapterId);
}

async function getChapterPagesByChapter(chapterIds: string[]) {
  const rows = await getDb()
    .select({
      chapterId: chapterPages.chapterId,
      pageNumber: chapterPages.pageNumber,
      assetId: assets.id,
      publicUrl: assets.publicUrl,
      objectKey: assets.objectKey,
      altText: assets.altText,
      width: assets.width,
      height: assets.height
    })
    .from(chapterPages)
    .innerJoin(assets, eq(chapterPages.assetId, assets.id))
    .where(inArray(chapterPages.chapterId, chapterIds));

  return groupBy(rows, (row) => row.chapterId);
}

function mapTitleFormValues(row: BaseTitleRow, localizations: LocalizationRow[], tagRows: TagRow[]): TitleFormValues {
  const localizationMap = getLocalizationMap(row, localizations);

  return {
    canonicalSlug: row.slug,
    originalTitle: row.originalTitle,
    authorName: row.authorName,
    originalLanguage: row.originalLanguage,
    displayLocales: normalizeDisplayLocales(row.displayLocales),
    contentRating: row.contentRating,
    publicationStatus: row.publicationStatus,
    format: row.format,
    enTitle: localizationMap.en.title,
    enSlug: localizationMap.en.slug,
    enDescription: localizationMap.en.description,
    esTitle: localizationMap.es.title,
    esSlug: localizationMap.es.slug,
    esDescription: localizationMap.es.description,
    enSeoTitle: localizationMap.en.seoTitle,
    enSeoDescription: localizationMap.en.seoDescription,
    enSeoKeywords: localizationMap.en.seoKeywords,
    esSeoTitle: localizationMap.es.seoTitle,
    esSeoDescription: localizationMap.es.seoDescription,
    esSeoKeywords: localizationMap.es.seoKeywords,
    frTitle: localizationMap.fr.title, frSlug: localizationMap.fr.slug, frDescription: localizationMap.fr.description,
    frSeoTitle: localizationMap.fr.seoTitle, frSeoDescription: localizationMap.fr.seoDescription, frSeoKeywords: localizationMap.fr.seoKeywords,
    deTitle: localizationMap.de.title, deSlug: localizationMap.de.slug, deDescription: localizationMap.de.description,
    deSeoTitle: localizationMap.de.seoTitle, deSeoDescription: localizationMap.de.seoDescription, deSeoKeywords: localizationMap.de.seoKeywords,
    ptTitle: localizationMap.pt.title, ptSlug: localizationMap.pt.slug, ptDescription: localizationMap.pt.description,
    ptSeoTitle: localizationMap.pt.seoTitle, ptSeoDescription: localizationMap.pt.seoDescription, ptSeoKeywords: localizationMap.pt.seoKeywords,
    tags: tagRows.map((tag) => tag.slug).join(", ")
  };
}

function mapTitleRow(
  row: BaseTitleRow,
  imageCdnBaseUrl: string,
  related: {
    localizations: LocalizationRow[];
    tagSlugs: TagRow[];
    chapters: DemoChapter[];
  }
): DemoTitle & { id: string } {
  const localizationMap = getLocalizationMap(row, related.localizations);
  const cover =
    row.coverId && row.coverPublicUrl && row.coverAltText && row.coverWidth && row.coverHeight
      ? {
          id: row.coverId,
          src: imageCdnUrl(row.coverObjectKey ?? "", imageCdnBaseUrl, row.coverPublicUrl),
          alt: row.coverAltText,
          width: row.coverWidth,
          height: row.coverHeight
        }
      : fallbackCover;

  return {
    id: row.id,
    format: row.format,
    displayLocales: normalizeDisplayLocales(row.displayLocales),
    slug: row.slug,
    originalTitle: row.originalTitle,
    titles: {
      en: localizationMap.en.title,
      es: localizationMap.es.title,
      fr: localizationMap.fr.title || localizationMap.en.title,
      de: localizationMap.de.title || localizationMap.en.title,
      pt: localizationMap.pt.title || localizationMap.en.title
    },
    descriptions: {
      en: localizationMap.en.description,
      es: localizationMap.es.description,
      fr: localizationMap.fr.description || localizationMap.en.description,
      de: localizationMap.de.description || localizationMap.en.description,
      pt: localizationMap.pt.description || localizationMap.en.description
    },
    seo: {
      en: {
        title: localizationMap.en.seoTitle || localizationMap.en.title,
        description: localizationMap.en.seoDescription || localizationMap.en.description,
        keywords: parseKeywords(localizationMap.en.seoKeywords)
      },
      es: {
        title: localizationMap.es.seoTitle || localizationMap.es.title,
        description: localizationMap.es.seoDescription || localizationMap.es.description,
        keywords: parseKeywords(localizationMap.es.seoKeywords)
      },
      fr: {
        title: localizationMap.fr.seoTitle || localizationMap.fr.title || localizationMap.en.seoTitle || localizationMap.en.title,
        description: localizationMap.fr.seoDescription || localizationMap.fr.description || localizationMap.en.seoDescription || localizationMap.en.description,
        keywords: parseKeywords(localizationMap.fr.seoKeywords || localizationMap.en.seoKeywords)
      },
      de: {
        title: localizationMap.de.seoTitle || localizationMap.de.title || localizationMap.en.seoTitle || localizationMap.en.title,
        description: localizationMap.de.seoDescription || localizationMap.de.description || localizationMap.en.seoDescription || localizationMap.en.description,
        keywords: parseKeywords(localizationMap.de.seoKeywords || localizationMap.en.seoKeywords)
      },
      pt: {
        title: localizationMap.pt.seoTitle || localizationMap.pt.title || localizationMap.en.seoTitle || localizationMap.en.title,
        description: localizationMap.pt.seoDescription || localizationMap.pt.description || localizationMap.en.seoDescription || localizationMap.en.description,
        keywords: parseKeywords(localizationMap.pt.seoKeywords || localizationMap.en.seoKeywords)
      }
    },
    cover,
    author: row.authorName,
    originalLanguage: displayLanguage(row.originalLanguage),
    publicationStatus: displayStatus(row.publicationStatus),
    contentRating: displayContentRating(row.contentRating),
    tags: related.tagSlugs.map((tag) => tag.slug),
    publishedAt: formatDate(row.publishedAt),
    viewCount: row.viewCount,
    chapters: related.chapters
  };
}

function normalizeDisplayLocales(value: unknown): Locale[] {
  const supported = new Set<Locale>(["en", "es", "fr", "de", "pt"]);
  const selected = Array.isArray(value)
    ? value.filter((item): item is Locale => typeof item === "string" && supported.has(item as Locale))
    : [];
  return selected.length > 0 ? selected : ["en", "es", "fr", "de", "pt"];
}

function mapChapterRow(
  row: ChapterRow,
  localizations: ChapterLocalizationRow[],
  pages: ChapterPageRow[],
  imageCdnBaseUrl: string
): { titleId: string; chapter: DemoChapter } {
  const localizedTitles = {
    en: `Chapter ${Number(row.chapterNumber)}`,
    es: `Capitulo ${Number(row.chapterNumber)}`,
    fr: `Chapitre ${Number(row.chapterNumber)}`,
    de: `Kapitel ${Number(row.chapterNumber)}`,
    pt: `Capítulo ${Number(row.chapterNumber)}`
  };

  for (const localization of localizations) {
    localizedTitles[localization.locale] = localization.title;
  }

  return {
    titleId: row.titleId,
    chapter: {
      slug: row.slug,
      number: Number(row.chapterNumber),
      titles: localizedTitles,
      publishedAt: formatDate(row.publishedAt),
      pages: [...pages]
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((page) => ({
          id: page.assetId,
          src: imageCdnUrl(page.objectKey, imageCdnBaseUrl, page.publicUrl),
          alt: page.altText,
          width: page.width,
          height: page.height
        }))
    }
  };
}

function getLocalizationMap(row: BaseTitleRow, localizations: LocalizationRow[]) {
  const localizationMap: Record<Locale, { title: string; slug: string; description: string; seoTitle: string; seoDescription: string; seoKeywords: string }> = {
    en: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" },
    es: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" },
    fr: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" },
    de: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" },
    pt: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" }
  };

  for (const localization of localizations) {
    localizationMap[localization.locale] = {
      title: localization.title,
      slug: localization.slug,
      description: localization.description,
      seoTitle: localization.seoTitle ?? "",
      seoDescription: localization.seoDescription ?? "",
      seoKeywords: localization.seoKeywords ?? ""
    };
  }

  for (const locale of ["fr", "de", "pt"] as const) {
    if (!localizations.some((localization) => localization.locale === locale)) {
      localizationMap[locale] = { ...localizationMap.en };
    }
  }

  return localizationMap;
}

async function attachTagsToTitle(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  titleId: string,
  tagSlugs: string[]
) {
  for (const slug of tagSlugs) {
    await tx
      .insert(tags)
      .values({
        slug,
        nameEn: labelFromSlug(slug),
        nameEs: labelFromSlug(slug),
        category: "general"
      })
      .onConflictDoNothing();

    const [tag] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (tag) {
      await tx.insert(titleTags).values({ titleId, tagId: tag.id }).onConflictDoNothing();
    }
  }
}

function parseTagSlugs(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function parseKeywords(value: string) {
  return value.split(",").map((keyword) => keyword.trim()).filter(Boolean);
}

function labelFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayStatus(status: DbTitleStatus): DemoTitle["publicationStatus"] {
  const labels = {
    ongoing: "Ongoing",
    completed: "Completed",
    hiatus: "Hiatus",
    cancelled: "Cancelled"
  } satisfies Record<DbTitleStatus, DemoTitle["publicationStatus"]>;

  return labels[status];
}

function displayContentRating(rating: DbContentRating): DemoTitle["contentRating"] {
  return rating === "safe" ? "Safe" : "18+";
}

function displayLanguage(language: string) {
  return language === "en" ? "English" : language === "es" ? "Spanish" : language;
}

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

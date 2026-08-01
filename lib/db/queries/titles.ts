import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  assets,
  chapterLocalizations,
  chapterPages,
  chapters,
  contentRatingEnum,
  tags,
  titleLocalizations,
  titleStatusEnum,
  titles,
  titleTags
} from "@/db/schema";
import type { DemoChapter, DemoTitle } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";
import { getDb } from "../client";
import { imageCdnUrl } from "@/lib/media/public-url";
import { getSiteSettings } from "@/lib/db/queries/settings";

export type TitleFormValues = {
  canonicalSlug: string;
  originalTitle: string;
  authorName: string;
  originalLanguage: string;
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
  tags: string;
};

export type AdminTitleListItem = {
  id: string;
  originalTitle: string;
  canonicalSlug: string;
  publicationStatus: string;
  contentRating: string;
  format: "manga" | "manhwa";
  updatedAt: string;
  enTitle: string;
  esTitle: string;
};

type DbTitleStatus = (typeof titleStatusEnum.enumValues)[number];
type DbContentRating = (typeof contentRatingEnum.enumValues)[number];

type BaseTitleRow = {
  id: string;
  slug: string;
  originalTitle: string;
  originalLanguage: string;
  authorName: string;
  format: "manga" | "manhwa";
  publicationStatus: DbTitleStatus;
  contentRating: DbContentRating;
  publishedAt: Date | null;
  viewCount: number;
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
  tags: ""
};

export async function listDbTitles() {
  const rows = await selectPublishedTitleRows();
  return hydrateTitleRows(rows);
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
      contentRating: displayContentRating(row.contentRating),
      format: row.format,
      updatedAt: formatDateTime(row.updatedAt),
      enTitle: localizations.en.title,
      esTitle: localizations.es.title
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
        authorName: values.authorName,
        format: values.format,
        publicationStatus: values.publicationStatus,
        contentRating: values.contentRating,
        publishedAt: null
      })
      .returning({ id: titles.id });

    await tx.insert(titleLocalizations).values([
      {
        titleId: title.id,
        locale: "en",
        title: values.enTitle,
        slug: values.enSlug,
        description: values.enDescription,
        seoTitle: values.enSeoTitle || null,
        seoDescription: values.enSeoDescription || null,
        seoKeywords: values.enSeoKeywords || null
      },
      {
        titleId: title.id,
        locale: "es",
        title: values.esTitle,
        slug: values.esSlug,
        description: values.esDescription,
        seoTitle: values.esSeoTitle || null,
        seoDescription: values.esSeoDescription || null,
        seoKeywords: values.esSeoKeywords || null
      }
    ]);

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
        authorName: values.authorName,
        format: values.format,
        publicationStatus: values.publicationStatus,
        contentRating: values.contentRating,
        updatedAt: now
      })
      .where(eq(titles.id, id));

    for (const locale of ["en", "es"] as const) {
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

export async function updateDbTitleSeo(
  id: string,
  seo: Record<Locale, { title: string; description: string; keywords: string[] }>
) {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const locale of ["en", "es"] as const) {
      await tx
        .update(titleLocalizations)
        .set({
          seoTitle: seo[locale].title,
          seoDescription: seo[locale].description,
          seoKeywords: seo[locale].keywords.join(", "),
          updatedAt: now
        })
        .where(and(eq(titleLocalizations.titleId, id), eq(titleLocalizations.locale, locale)));
    }
  });
}

export function titleFormValuesFromDemoTitle(title: DemoTitle): TitleFormValues {
  return {
    canonicalSlug: title.slug,
    originalTitle: title.originalTitle,
    authorName: title.author,
    originalLanguage: title.originalLanguage === "English" ? "en" : title.originalLanguage,
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
    tags: title.tags.join(", ")
  };
}

export function adminTitleListFromDemoTitles(titles: DemoTitle[]): AdminTitleListItem[] {
  return titles.map((title) => ({
    id: title.slug,
    originalTitle: title.originalTitle,
    canonicalSlug: title.slug,
    publicationStatus: title.publicationStatus,
    contentRating: title.contentRating,
    format: "manga",
    updatedAt: title.publishedAt,
    enTitle: title.titles.en,
    esTitle: title.titles.es
  }));
}

function selectBaseTitle() {
  return getDb()
    .select({
      id: titles.id,
      slug: titles.slug,
      originalTitle: titles.originalTitle,
      originalLanguage: titles.originalLanguage,
      authorName: titles.authorName,
      format: titles.format,
      publicationStatus: titles.publicationStatus,
      contentRating: titles.contentRating,
      publishedAt: titles.publishedAt,
      viewCount: titles.viewCount,
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

async function hydrateTitleRows(rows: BaseTitleRow[]): Promise<Array<DemoTitle & { id: string }>> {
  if (rows.length === 0) {
    return [];
  }

  const titleIds = rows.map((row) => row.id);
  const [localizationsByTitle, tagsByTitle, settings] = await Promise.all([
    getLocalizationsByTitle(titleIds),
    getTagSlugsByTitle(titleIds),
    getSiteSettings()
  ]);
  const chaptersByTitle = await getChaptersByTitle(titleIds, settings.imageCdnUrl);

  return rows.map((row) =>
    mapTitleRow(row, settings.imageCdnUrl, {
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

async function getChaptersByTitle(titleIds: string[], imageCdnBaseUrl: string) {
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
    getChapterPagesByChapter(chapterIds)
  ]);

  const mappedChapters = chapterRows.map((chapter) =>
    mapChapterRow(chapter, chapterLocalizationsByChapter.get(chapter.id) ?? [], pagesByChapter.get(chapter.id) ?? [], imageCdnBaseUrl)
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
    slug: row.slug,
    originalTitle: row.originalTitle,
    titles: {
      en: localizationMap.en.title,
      es: localizationMap.es.title
    },
    descriptions: {
      en: localizationMap.en.description,
      es: localizationMap.es.description
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

function mapChapterRow(
  row: ChapterRow,
  localizations: ChapterLocalizationRow[],
  pages: ChapterPageRow[],
  imageCdnBaseUrl: string
): { titleId: string; chapter: DemoChapter } {
  const localizedTitles = {
    en: `Chapter ${Number(row.chapterNumber)}`,
    es: `Capitulo ${Number(row.chapterNumber)}`
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
    es: { title: row.originalTitle, slug: row.slug, description: "", seoTitle: "", seoDescription: "", seoKeywords: "" }
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

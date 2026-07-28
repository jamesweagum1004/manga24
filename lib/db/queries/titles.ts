import { eq } from "drizzle-orm";
import {
  assets,
  contentRatingEnum,
  titleLocalizations,
  titleStatusEnum,
  titles,
} from "@/db/schema";
import type { DemoChapter, DemoTitle } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";
import { getDb } from "../client";

export type TitleFormValues = {
  canonicalSlug: string;
  originalTitle: string;
  authorName: string;
  originalLanguage: string;
  contentRating: "safe" | "mature_18";
  publicationStatus: "ongoing" | "completed" | "hiatus" | "cancelled";
  enTitle: string;
  enSlug: string;
  enDescription: string;
  esTitle: string;
  esSlug: string;
  esDescription: string;
};

type DbTitleStatus = (typeof titleStatusEnum.enumValues)[number];
type DbContentRating = (typeof contentRatingEnum.enumValues)[number];

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
  enTitle: "",
  enSlug: "",
  enDescription: "",
  esTitle: "",
  esSlug: "",
  esDescription: ""
};

export async function listDbTitles() {
  const db = getDb();
  const rows = await db.query.titles.findMany({
    with: titleReadWith,
    orderBy: (table, { desc }) => [desc(table.publishedAt), desc(table.createdAt)]
  });

  return rows.map(mapTitleRow);
}

export async function getDbTitleBySlug(slug: string) {
  const db = getDb();
  const row = await db.query.titles.findFirst({
    where: (table, { eq }) => eq(table.slug, slug),
    with: titleReadWith
  });

  return row ? mapTitleRow(row) : null;
}

export async function getDbTitleForAdmin(id: string) {
  const db = getDb();
  const row = await db.query.titles.findFirst({
    where: (table, { eq }) => eq(table.id, id),
    with: {
      localizations: true
    }
  });

  return row ? { id: row.id, values: mapTitleFormValues(row) } : null;
}

export async function createDbTitle(values: TitleFormValues) {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [title] = await tx
      .insert(titles)
      .values({
        slug: values.canonicalSlug,
        originalTitle: values.originalTitle,
        originalLanguage: values.originalLanguage,
        authorName: values.authorName,
        publicationStatus: values.publicationStatus,
        contentRating: values.contentRating,
        publishedAt: values.publicationStatus === "ongoing" || values.publicationStatus === "completed" ? now : null
      })
      .returning({ id: titles.id });

    await tx.insert(titleLocalizations).values([
      {
        titleId: title.id,
        locale: "en",
        title: values.enTitle,
        slug: values.enSlug,
        description: values.enDescription
      },
      {
        titleId: title.id,
        locale: "es",
        title: values.esTitle,
        slug: values.esSlug,
        description: values.esDescription
      }
    ]);

    return title.id;
  });
}

export async function updateDbTitle(id: string, values: TitleFormValues) {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(titles)
      .set({
        slug: values.canonicalSlug,
        originalTitle: values.originalTitle,
        originalLanguage: values.originalLanguage,
        authorName: values.authorName,
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
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [titleLocalizations.titleId, titleLocalizations.locale],
          set: {
            title: values[`${locale}Title`],
            slug: values[`${locale}Slug`],
            description: values[`${locale}Description`],
            updatedAt: now
          }
        });
    }
  });
}

export function titleFormValuesFromDemoTitle(title: DemoTitle): TitleFormValues {
  return {
    canonicalSlug: title.slug,
    originalTitle: title.originalTitle,
    authorName: title.author,
    originalLanguage: title.originalLanguage === "English" ? "en" : title.originalLanguage,
    contentRating: "mature_18",
    publicationStatus: title.publicationStatus.toLowerCase() as TitleFormValues["publicationStatus"],
    enTitle: title.titles.en,
    enSlug: title.slug,
    enDescription: title.descriptions.en,
    esTitle: title.titles.es,
    esSlug: title.slug,
    esDescription: title.descriptions.es
  };
}

function mapTitleFormValues(row: {
  slug: string;
  originalTitle: string;
  originalLanguage: string;
  authorName: string;
  publicationStatus: DbTitleStatus;
  contentRating: DbContentRating;
  localizations: Array<{
    locale: Locale;
    title: string;
    slug: string;
    description: string;
  }>;
}): TitleFormValues {
  const localizations = getLocalizationMap(row);

  return {
    canonicalSlug: row.slug,
    originalTitle: row.originalTitle,
    authorName: row.authorName,
    originalLanguage: row.originalLanguage,
    contentRating: row.contentRating,
    publicationStatus: row.publicationStatus,
    enTitle: localizations.en.title,
    enSlug: localizations.en.slug,
    enDescription: localizations.en.description,
    esTitle: localizations.es.title,
    esSlug: localizations.es.slug,
    esDescription: localizations.es.description
  };
}

const titleReadWith = {
  coverAsset: true,
  localizations: true,
  titleTags: {
    with: {
      tag: true
    }
  },
  chapters: {
    with: {
      localizations: true,
      pages: {
        with: {
          asset: true
        }
      }
    }
  }
} as const;

function mapTitleRow(row: {
  id: string;
  slug: string;
  originalTitle: string;
  originalLanguage: string;
  authorName: string;
  publicationStatus: DbTitleStatus;
  contentRating: DbContentRating;
  coverAsset: typeof assets.$inferSelect | null;
  publishedAt: Date | null;
  viewCount: number;
  localizations: Array<{
    locale: Locale;
    title: string;
    slug: string;
    description: string;
  }>;
  titleTags: Array<{
    tag: {
      slug: string;
    };
  }>;
  chapters: Array<{
    slug: string;
    chapterNumber: string;
    publishedAt: Date | null;
    localizations: Array<{
      locale: Locale;
      title: string;
    }>;
    pages: Array<{
      pageNumber: number;
      asset: typeof assets.$inferSelect;
    }>;
  }>;
}): DemoTitle & { id: string } {
  const localizations = getLocalizationMap(row);
  const cover = row.coverAsset
    ? {
        id: row.coverAsset.id,
        src: row.coverAsset.publicUrl,
        alt: row.coverAsset.altText,
        width: row.coverAsset.width,
        height: row.coverAsset.height
      }
    : fallbackCover;

  return {
    id: row.id,
    slug: row.slug,
    originalTitle: row.originalTitle,
    titles: {
      en: localizations.en.title,
      es: localizations.es.title
    },
    descriptions: {
      en: localizations.en.description,
      es: localizations.es.description
    },
    cover,
    author: row.authorName,
    originalLanguage: displayLanguage(row.originalLanguage),
    publicationStatus: displayStatus(row.publicationStatus),
    contentRating: displayContentRating(row.contentRating),
    tags: row.titleTags.map((item) => item.tag.slug),
    publishedAt: formatDate(row.publishedAt),
    viewCount: row.viewCount,
    chapters: [...row.chapters]
      .sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber))
      .map(mapChapterRow)
  };
}

function mapChapterRow(row: {
  slug: string;
  chapterNumber: string;
  publishedAt: Date | null;
  localizations: Array<{
    locale: Locale;
    title: string;
  }>;
  pages: Array<{
    pageNumber: number;
    asset: typeof assets.$inferSelect;
  }>;
}): DemoChapter {
  const titles = {
    en: `Chapter ${Number(row.chapterNumber)}`,
    es: `Capitulo ${Number(row.chapterNumber)}`
  };

  for (const localization of row.localizations) {
    titles[localization.locale] = localization.title;
  }

  return {
    slug: row.slug,
    number: Number(row.chapterNumber),
    titles,
    publishedAt: formatDate(row.publishedAt),
    pages: [...row.pages]
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((page) => ({
        id: page.asset.id,
        src: page.asset.publicUrl,
        alt: page.asset.altText,
        width: page.asset.width,
        height: page.asset.height
      }))
  };
}

function getLocalizationMap(row: {
  originalTitle: string;
  slug: string;
  localizations: Array<{
    locale: Locale;
    title: string;
    slug: string;
    description: string;
  }>;
}) {
  const localizations: Record<Locale, { title: string; slug: string; description: string }> = {
    en: { title: row.originalTitle, slug: row.slug, description: "" },
    es: { title: row.originalTitle, slug: row.slug, description: "" }
  };

  for (const localization of row.localizations) {
    localizations[localization.locale] = {
      title: localization.title,
      slug: localization.slug,
      description: localization.description
    };
  }

  return localizations;
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

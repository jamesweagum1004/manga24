import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const localeEnum = pgEnum("locale", ["en", "es"]);
export const publicationStatusEnum = pgEnum("publication_status", ["draft", "scheduled", "published", "archived"]);
export const titleStatusEnum = pgEnum("title_status", ["ongoing", "completed", "hiatus", "cancelled"]);
export const contentRatingEnum = pgEnum("content_rating", ["safe", "mature_18"]);
export const assetKindEnum = pgEnum("asset_kind", ["cover", "thumbnail", "chapter_page", "banner"]);

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 80 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: assetKindEnum("kind").notNull(),
  provider: varchar("provider", { length: 40 }).default("local").notNull(),
  bucket: varchar("bucket", { length: 160 }),
  objectKey: text("object_key").notNull(),
  publicUrl: text("public_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  altText: text("alt_text").notNull(),
  contentType: varchar("content_type", { length: 120 }).default("image/svg+xml").notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const titles = pgTable(
  "titles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    originalTitle: varchar("original_title", { length: 240 }).notNull(),
    originalLanguage: varchar("original_language", { length: 16 }).notNull(),
    authorName: varchar("author_name", { length: 160 }).notNull(),
    publicationStatus: titleStatusEnum("publication_status").default("ongoing").notNull(),
    contentRating: contentRatingEnum("content_rating").default("mature_18").notNull(),
    coverAssetId: uuid("cover_asset_id").references(() => assets.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slugIdx: uniqueIndex("titles_slug_idx").on(table.slug),
    publishedIdx: index("titles_published_at_idx").on(table.publishedAt)
  })
);

export const titleLocalizations = pgTable(
  "title_localizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description").notNull(),
    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 170 }),
    seoKeywords: text("seo_keywords"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    uniqueTitleLocale: uniqueIndex("title_localizations_title_locale_idx").on(table.titleId, table.locale),
    uniqueLocaleSlug: uniqueIndex("title_localizations_locale_slug_idx").on(table.locale, table.slug)
  })
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    chapterNumber: numeric("chapter_number", { precision: 8, scale: 2 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    publicationStatus: publicationStatusEnum("publication_status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    titleSlugIdx: uniqueIndex("chapters_title_slug_idx").on(table.titleId, table.slug),
    titleNumberIdx: uniqueIndex("chapters_title_number_idx").on(table.titleId, table.chapterNumber)
  })
);

export const chapterLocalizations = pgTable(
  "chapter_localizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    uniqueChapterLocale: uniqueIndex("chapter_localizations_chapter_locale_idx").on(table.chapterId, table.locale)
  })
);

export const chapterPages = pgTable(
  "chapter_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    chapterLocalizationId: uuid("chapter_localization_id")
      .notNull()
      .references(() => chapterLocalizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    pageNumber: integer("page_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    chapterPageIdx: uniqueIndex("chapter_pages_chapter_page_idx").on(table.chapterId, table.pageNumber),
    chapterLocalizationPageIdx: uniqueIndex("chapter_pages_chapter_localization_page_idx").on(
      table.chapterLocalizationId,
      table.pageNumber
    )
  })
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    nameEn: varchar("name_en", { length: 120 }).notNull(),
    nameEs: varchar("name_es", { length: 120 }).notNull(),
    category: varchar("category", { length: 80 }).default("general").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slugIdx: uniqueIndex("tags_slug_idx").on(table.slug)
  })
);

export const titleTags = pgTable(
  "title_tags",
  {
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.titleId, table.tagId] })
  })
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 120 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const titleRelations = relations(titles, ({ one, many }) => ({
  coverAsset: one(assets, {
    fields: [titles.coverAssetId],
    references: [assets.id]
  }),
  localizations: many(titleLocalizations),
  chapters: many(chapters),
  titleTags: many(titleTags)
}));

export const titleLocalizationRelations = relations(titleLocalizations, ({ one }) => ({
  title: one(titles, {
    fields: [titleLocalizations.titleId],
    references: [titles.id]
  })
}));

export const chapterRelations = relations(chapters, ({ one, many }) => ({
  title: one(titles, {
    fields: [chapters.titleId],
    references: [titles.id]
  }),
  localizations: many(chapterLocalizations)
}));

export const chapterLocalizationRelations = relations(chapterLocalizations, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [chapterLocalizations.chapterId],
    references: [chapters.id]
  }),
  pages: many(chapterPages)
}));

export const chapterPageRelations = relations(chapterPages, ({ one }) => ({
  chapterLocalization: one(chapterLocalizations, {
    fields: [chapterPages.chapterLocalizationId],
    references: [chapterLocalizations.id]
  }),
  asset: one(assets, {
    fields: [chapterPages.assetId],
    references: [assets.id]
  })
}));

export const tagRelations = relations(tags, ({ many }) => ({
  titleTags: many(titleTags)
}));

export const titleTagRelations = relations(titleTags, ({ one }) => ({
  title: one(titles, {
    fields: [titleTags.titleId],
    references: [titles.id]
  }),
  tag: one(tags, {
    fields: [titleTags.tagId],
    references: [tags.id]
  })
}));

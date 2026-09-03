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

export const localeEnum = pgEnum("locale", ["en", "es", "fr", "de", "pt"]);
export const publicationStatusEnum = pgEnum("publication_status", ["draft", "scheduled", "published", "archived"]);
export const titleStatusEnum = pgEnum("title_status", ["ongoing", "completed", "hiatus", "cancelled"]);
export const contentRatingEnum = pgEnum("content_rating", ["safe", "mature_18"]);
export const assetKindEnum = pgEnum("asset_kind", ["cover", "thumbnail", "chapter_page", "banner"]);
export const titleFormatEnum = pgEnum("title_format", ["manga", "manhwa"]);
export const adKindEnum = pgEnum("ad_kind", ["static", "exoclick"]);
export const adPositionEnum = pgEnum("ad_position", ["header", "content", "reader_top", "reader_bottom"]);
export const reportReasonEnum = pgEnum("report_reason", ["child_safety", "copyright", "privacy", "wrong_rating", "broken", "spam", "other"]);
export const reportStatusEnum = pgEnum("report_status", ["new", "reviewing", "actioned", "rejected", "closed"]);
export const reportPriorityEnum = pgEnum("report_priority", ["normal", "high", "urgent"]);

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

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  deepseekModel: varchar("deepseek_model", { length: 80 }).default("deepseek-v4-flash").notNull(),
  imageCdnUrl: text("image_cdn_url"),
  enabledLocales: jsonb("enabled_locales").$type<string[]>().default(["en", "es"]).notNull(),
  pwaEnabled: boolean("pwa_enabled").default(false).notNull(),
  pwaPromptEnabled: boolean("pwa_prompt_enabled").default(false).notNull(),
  pwaPromptThreshold: integer("pwa_prompt_threshold").default(3).notNull(),
  pwaAdsEnabled: boolean("pwa_ads_enabled").default(true).notNull(),
  homeManhwaEnabled: boolean("home_manhwa_enabled").default(true).notNull(),
  viewCountsEnabled: boolean("view_counts_enabled").default(true).notNull(),
  maintenanceEnabled: boolean("maintenance_enabled").default(false).notNull(),
  showPublishedDate: boolean("show_published_date").default(true).notNull(),
  showAuthor: boolean("show_author").default(true).notNull(),
  showChapters: boolean("show_chapters").default(true).notNull(),
  readerRecommendationCount: integer("reader_recommendation_count").default(8).notNull(),
  homeSections: jsonb("home_sections").$type<Array<{ id: string; title: string; subtitle: string; source: "popular" | "live" | "random" | "popular_period" | "latest" | "adult" | "tag" | "manhwa"; tag: string; itemCount: number; enabled: boolean; popularityPeriod: "hourly" | "custom" | "daily"; customHours: number }>>(),
  adLocaleModes: jsonb("ad_locale_modes").$type<Record<string, "inherit" | "separate">>().default({ en: "inherit", es: "inherit", fr: "inherit", de: "inherit", pt: "inherit" }).notNull(),
  googleAnalyticsEnabled: boolean("google_analytics_enabled").default(false).notNull(),
  googleAnalyticsMeasurementId: varchar("google_analytics_measurement_id", { length: 32 }),
  siteName: varchar("site_name", { length: 120 }).default("Manga24").notNull(),
  seoLocales: jsonb("seo_locales").$type<Record<string, { title: string; description: string; keywords: string }>>().default({
    en: { title: "Read Manga Online", description: "Discover manga, new releases, popular series, and the latest chapters on Manga24.", keywords: "manga, read manga online, manga chapters" },
    es: { title: "Leer manga online", description: "Descubre manga, nuevos lanzamientos, series populares y los ultimos capitulos en Manga24.", keywords: "manga, leer manga online, capitulos de manga" },
    fr: { title: "Lire des mangas en ligne", description: "Decouvrez des mangas, les nouveautes, les series populaires et les derniers chapitres sur Manga24.", keywords: "manga, lire manga en ligne, chapitres manga" },
    de: { title: "Manga online lesen", description: "Entdecke Manga, Neuerscheinungen, beliebte Serien und die neuesten Kapitel auf Manga24.", keywords: "manga, manga online lesen, manga kapitel" },
    pt: { title: "Ler manga online", description: "Descubra mangas, novos lancamentos, series populares e os capitulos mais recentes no Manga24.", keywords: "manga, ler manga online, capitulos de manga" }
  }).notNull(),
  seoDefaultImageUrl: text("seo_default_image_url"),
  sitemapEnabled: boolean("sitemap_enabled").default(true).notNull(),
  sitemapIncludeStatic: boolean("sitemap_include_static").default(true).notNull(),
  sitemapIncludeTitles: boolean("sitemap_include_titles").default(true).notNull(),
  sitemapIncludeChapters: boolean("sitemap_include_chapters").default(true).notNull(),
  sitemapIncludeTags: boolean("sitemap_include_tags").default(true).notNull(),
  indexnowEnabled: boolean("indexnow_enabled").default(false).notNull(),
  indexnowKey: varchar("indexnow_key", { length: 128 }),
  autoPublishSchedules: jsonb("auto_publish_schedules").$type<Record<string, { enabled: boolean; intervalMinutes: number; batchSize: number; lastRunAt: string | null }>>(),
  logo: jsonb("logo").$type<{ publicUrl: string; objectKey: string; format: "manga" | "manhwa"; width: number; height: number } | null>(),
  favicon: jsonb("favicon").$type<{ publicUrl: string; objectKey: string; format: "manga" | "manhwa"; width: number; height: number } | null>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const storageConfigs = pgTable("storage_configs", {
  format: titleFormatEnum("format").primaryKey(),
  provider: varchar("provider", { length: 40 }).default("backblaze-b2").notNull(),
  bucketName: varchar("bucket_name", { length: 160 }).notNull(),
  endpoint: text("endpoint").notNull(),
  region: varchar("region", { length: 80 }).notNull(),
  keyId: varchar("key_id", { length: 255 }).notNull(),
  encryptedApplicationKey: text("encrypted_application_key").notNull(),
  bunnyPublicUrl: text("bunny_public_url").notNull(),
  bunnyStorageZone: varchar("bunny_storage_zone", { length: 160 }),
  bunnyEndpoint: text("bunny_endpoint"),
  encryptedBunnyAccessKey: text("encrypted_bunny_access_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const ads = pgTable(
  "ads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    kind: adKindEnum("kind").notNull(),
    position: adPositionEnum("position").notNull(),
    surface: varchar("surface", { length: 16 }).$type<"both" | "web" | "pwa">().default("both").notNull(),
    locale: varchar("locale", { length: 8 }).$type<"en" | "es" | "fr" | "de" | "pt">(),
    imageUrl: text("image_url"),
    clickUrl: text("click_url"),
    altText: varchar("alt_text", { length: 240 }),
    embedCode: text("embed_code"),
    width: integer("width").default(728).notNull(),
    height: integer("height").default(90).notNull(),
    insertAfter: integer("insert_after").default(1).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    placementIdx: index("ads_placement_idx").on(table.position, table.isActive, table.sortOrder)
  })
);

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
    displayLocales: jsonb("display_locales").$type<string[]>().default(["en", "es", "fr", "de", "pt"]).notNull(),
    authorName: varchar("author_name", { length: 160 }).notNull(),
    format: titleFormatEnum("format").default("manga").notNull(),
    publicationStatus: titleStatusEnum("publication_status").default("ongoing").notNull(),
    contentRating: contentRatingEnum("content_rating").default("mature_18").notNull(),
    coverAssetId: uuid("cover_asset_id").references(() => assets.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    aiContentGeneratedAt: timestamp("ai_content_generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slugIdx: uniqueIndex("titles_slug_idx").on(table.slug),
    publishedIdx: index("titles_published_at_idx").on(table.publishedAt)
  })
);

export const titleViewEvents = pgTable(
  "title_view_events",
  {
    id: serial("id").primaryKey(),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    viewedAtIdx: index("title_view_events_viewed_at_idx").on(table.viewedAt),
    titleViewedAtIdx: index("title_view_events_title_viewed_at_idx").on(table.titleId, table.viewedAt)
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
    nameFr: varchar("name_fr", { length: 120 }),
    nameDe: varchar("name_de", { length: 120 }),
    namePt: varchar("name_pt", { length: 120 }),
    translationsGeneratedAt: timestamp("translations_generated_at", { withTimezone: true }),
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

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetKey: varchar("target_key", { length: 360 }).notNull(),
  targetUrl: text("target_url").notNull(),
  reason: reportReasonEnum("reason").notNull(),
  priority: reportPriorityEnum("priority").default("normal").notNull(),
  status: reportStatusEnum("status").default("new").notNull(),
  details: text("details").notNull(),
  reporterName: varchar("reporter_name", { length: 160 }),
  reporterEmail: varchar("reporter_email", { length: 320 }),
  rightsHolder: varchar("rights_holder", { length: 240 }),
  originalWork: text("original_work"),
  signature: varchar("signature", { length: 240 }),
  reporterFingerprint: varchar("reporter_fingerprint", { length: 64 }).notNull(),
  resolution: text("resolution"),
  reviewedBy: uuid("reviewed_by").references(() => admins.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  queueIdx: index("reports_queue_idx").on(table.status, table.priority, table.createdAt),
  fingerprintIdx: index("reports_fingerprint_idx").on(table.reporterFingerprint, table.createdAt)
}));

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

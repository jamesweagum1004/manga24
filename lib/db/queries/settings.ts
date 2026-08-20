import "server-only";
import { cache } from "react";
import { auditLogs, siteSettings } from "@/db/schema";
import { getDb, getDbOrNull } from "@/lib/db/client";
import { validateImageCdnUrl } from "@/lib/media/public-url";
import { normalizeEnabledLocales, type Locale } from "@/lib/i18n";
import { normalizeHomeSections, type HomeSection } from "@/lib/home-sections";

export type BrandingImage = { publicUrl: string; objectKey: string; format: "manga" | "manhwa"; width: number; height: number };

export const deepseekModels = ["deepseek-v4-flash", "deepseek-v4-pro"] as const;
export type DeepSeekModel = (typeof deepseekModels)[number];

export const getSiteSettings = cache(async () => {
  const db = getDbOrNull();
  const [settings] = db ? await db.select().from(siteSettings).limit(1) : [];
  return {
    deepseekModel: isDeepSeekModel(settings?.deepseekModel) ? settings.deepseekModel : "deepseek-v4-flash",
    imageCdnUrl: settings?.imageCdnUrl ?? process.env.NEXT_PUBLIC_IMAGE_CDN_URL ?? "",
    enabledLocales: normalizeEnabledLocales(settings?.enabledLocales),
    pwaEnabled: settings?.pwaEnabled ?? false,
    pwaPromptEnabled: settings?.pwaPromptEnabled ?? false,
    pwaPromptThreshold: normalizePwaThreshold(settings?.pwaPromptThreshold),
    pwaAdsEnabled: settings?.pwaAdsEnabled ?? true,
    homeManhwaEnabled: settings?.homeManhwaEnabled ?? true,
    viewCountsEnabled: settings?.viewCountsEnabled ?? true,
    maintenanceEnabled: settings?.maintenanceEnabled ?? false,
    showPublishedDate: settings?.showPublishedDate ?? true,
    showAuthor: settings?.showAuthor ?? true,
    showChapters: settings?.showChapters ?? true,
    readerRecommendationCount: normalizeRecommendationCount(settings?.readerRecommendationCount),
    homeSections: normalizeHomeSections(settings?.homeSections),
    adLocaleModes: normalizeAdLocaleModes(settings?.adLocaleModes),
    googleAnalyticsEnabled: settings?.googleAnalyticsEnabled ?? false,
    googleAnalyticsMeasurementId: settings?.googleAnalyticsMeasurementId ?? "",
    logo: settings?.logo ?? null,
    favicon: settings?.favicon ?? null
  } satisfies { deepseekModel: DeepSeekModel; imageCdnUrl: string; enabledLocales: Locale[]; pwaEnabled: boolean; pwaPromptEnabled: boolean; pwaPromptThreshold: 3 | 4 | 5; pwaAdsEnabled: boolean; homeManhwaEnabled: boolean; viewCountsEnabled: boolean; maintenanceEnabled: boolean; showPublishedDate: boolean; showAuthor: boolean; showChapters: boolean; readerRecommendationCount: number; homeSections: HomeSection[]; adLocaleModes: Record<Locale, "inherit" | "separate">; googleAnalyticsEnabled: boolean; googleAnalyticsMeasurementId: string; logo: BrandingImage | null; favicon: BrandingImage | null };
});

export async function updateMaintenanceSettings(input: { maintenanceEnabled: boolean }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updateHomeContentSettings(input: { homeManhwaEnabled: boolean }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updatePublicMetadataSettings(input: { showPublishedDate: boolean; showAuthor: boolean; showChapters: boolean }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updateReaderRecommendationSettings(readerRecommendationCount: number) {
  const normalized = normalizeRecommendationCount(readerRecommendationCount);
  await getDb().insert(siteSettings).values({ id: 1, readerRecommendationCount: normalized, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.id, set: { readerRecommendationCount: normalized, updatedAt: new Date() } });
}

export async function updateHomeSections(homeSections: HomeSection[]) {
  const normalized = normalizeHomeSections(homeSections);
  await getDb().insert(siteSettings).values({ id: 1, homeSections: normalized, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { homeSections: normalized, updatedAt: new Date() }
  });
}

export async function updateViewCountSettings(input: { viewCountsEnabled: boolean }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updateGoogleAnalyticsSettings(input: { googleAnalyticsEnabled: boolean; googleAnalyticsMeasurementId: string | null }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updatePwaSettings(input: { pwaEnabled: boolean; pwaPromptEnabled: boolean; pwaPromptThreshold: 3 | 4 | 5 }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updateAdDeliverySettings(input: { pwaAdsEnabled: boolean; adLocaleModes: Record<Locale, "inherit" | "separate"> }) {
  await getDb().insert(siteSettings).values({ id: 1, ...input, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() }
  });
}

export async function updateEnabledLocales(enabledLocales: Locale[]) {
  const normalized = normalizeEnabledLocales(enabledLocales);
  await getDb().insert(siteSettings).values({ id: 1, enabledLocales: normalized, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.id, set: { enabledLocales: normalized, updatedAt: new Date() } });
}

export async function updateBrandingImage(kind: "logo" | "favicon", value: BrandingImage | null) {
  const update = kind === "logo" ? { logo: value } : { favicon: value };
  await getDb().insert(siteSettings).values({ id: 1, ...update, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.id, set: { ...update, updatedAt: new Date() } });
}

export async function updateImageCdnUrl(imageCdnUrl: string, adminId: string) {
  const normalized = validateImageCdnUrl(imageCdnUrl);
  await getDb().transaction(async (tx) => {
    const [previous] = await tx.select({ imageCdnUrl: siteSettings.imageCdnUrl }).from(siteSettings).limit(1);
    await tx.insert(siteSettings).values({ id: 1, imageCdnUrl: normalized, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.id, set: { imageCdnUrl: normalized, updatedAt: new Date() } });
    await tx.insert(auditLogs).values({ adminId, action: "settings.image_cdn.updated", entityType: "site_settings", metadata: { previousOrigin: origin(previous?.imageCdnUrl), nextOrigin: origin(normalized) } });
  });
}

function origin(value: string | null | undefined) {
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

export async function updateDeepSeekModel(deepseekModel: DeepSeekModel) {
  await getDb()
    .insert(siteSettings)
    .values({ id: 1, deepseekModel, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { deepseekModel, updatedAt: new Date() }
    });
}

function isDeepSeekModel(value: string | undefined): value is DeepSeekModel {
  return deepseekModels.includes(value as DeepSeekModel);
}

function normalizePwaThreshold(value: number | undefined): 3 | 4 | 5 {
  return value === 4 || value === 5 ? value : 3;
}

function normalizeRecommendationCount(value: number | undefined) { return Math.min(24, Math.max(0, Number.isInteger(value) ? value ?? 8 : 8)); }

function normalizeAdLocaleModes(value: unknown): Record<Locale, "inherit" | "separate"> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(["en", "es", "fr", "de", "pt"].map((locale) => [locale, input[locale] === "separate" ? "separate" : "inherit"])) as Record<Locale, "inherit" | "separate">;
}

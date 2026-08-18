"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { deepseekModels, updateBrandingImage, updateDeepSeekModel, updateEnabledLocales, updateGoogleAnalyticsSettings, updateHomeContentSettings, updatePwaSettings } from "@/lib/db/queries/settings";
import { updateStorageConfig, type StorageFormat } from "@/lib/db/queries/storage-configs";
import { validateImageCdnUrl } from "@/lib/media/public-url";
import { isLocale, locales } from "@/lib/i18n";
import { uploadImages } from "@/lib/media/b2-upload";
import { filesToImages } from "@/lib/media/zip-images";

export async function updateAiSettingsAction(formData: FormData) {
  const parsed = z.enum(deepseekModels).safeParse(formData.get("deepseekModel"));
  if (!parsed.success) redirect("/manga1004/settings?error=model");
  await updateDeepSeekModel(parsed.data);
  redirect("/manga1004/settings?saved=1");
}

const storageSchema = z.object({
  provider: z.enum(["backblaze-b2", "bunny-storage"]),
  bucketName: z.string().trim().max(160),
  endpoint: z.string().trim().max(500),
  region: z.string().trim().max(80),
  keyId: z.string().trim().max(255),
  applicationKey: z.string().trim().max(500),
  bunnyStorageZone: z.string().trim().max(160),
  bunnyEndpoint: z.string().trim().max(500),
  bunnyAccessKey: z.string().trim().max(500),
  bunnyPublicUrl: z.string().trim().url().transform((value, context) => {
    try {
      return validateImageCdnUrl(value);
    } catch {
      context.addIssue({ code: "custom", message: "Use an independent HTTPS CDN origin." });
      return z.NEVER;
    }
  })
}).superRefine((value, context) => {
  if (value.provider === "backblaze-b2") {
    if (!value.bucketName || !value.endpoint || !value.region || !value.keyId) context.addIssue({ code: "custom", message: "Complete all Backblaze fields." });
  } else {
    if (!value.bunnyStorageZone || !value.bunnyEndpoint) context.addIssue({ code: "custom", message: "Complete all Bunny Storage fields." });
  }
  for (const endpoint of [value.endpoint, value.bunnyEndpoint].filter(Boolean)) {
    try { if (new URL(endpoint).protocol !== "https:") throw new Error(); } catch { context.addIssue({ code: "custom", message: "Storage endpoints must be valid HTTPS URLs." }); }
  }
  if (value.bunnyEndpoint) {
    try {
      const hostname = new URL(value.bunnyEndpoint).hostname.toLowerCase();
      if (hostname !== "storage.bunnycdn.com" && !hostname.endsWith(".storage.bunnycdn.com")) throw new Error();
    } catch { context.addIssue({ code: "custom", message: "Use the Bunny Storage API endpoint shown in the Storage Zone Access page." }); }
  }
});

export async function updateStorageSettingsAction(format: StorageFormat, formData: FormData) {
  const parsedFormat = z.enum(["manga", "manhwa"]).safeParse(format);
  const parsed = storageSchema.safeParse({
    provider: formData.get("provider"),
    bucketName: formData.get("bucketName"),
    endpoint: formData.get("endpoint"),
    region: formData.get("region"),
    keyId: formData.get("keyId"),
    applicationKey: formData.get("applicationKey"),
    bunnyPublicUrl: formData.get("bunnyPublicUrl"),
    bunnyStorageZone: formData.get("bunnyStorageZone"),
    bunnyEndpoint: formData.get("bunnyEndpoint"),
    bunnyAccessKey: formData.get("bunnyAccessKey")
  });
  if (!parsedFormat.success || !parsed.success) redirect("/manga1004/settings?error=storage-fields#storage");
  try {
    await updateStorageConfig(parsedFormat.data, parsed.data);
  } catch {
    redirect("/manga1004/settings?error=storage-secret#storage");
  }
  redirect(`/manga1004/settings?saved=${parsedFormat.data}#storage`);
}

export async function updateLanguageSettingsAction(formData: FormData) {
  const selected = locales.filter((locale) => locale === "en" || formData.get(`locale_${locale}`) === "on");
  await updateEnabledLocales(selected.filter(isLocale));
  redirect("/manga1004/settings?saved=languages#languages");
}

export async function updateHomeContentSettingsAction(formData: FormData) {
  await updateHomeContentSettings({ homeManhwaEnabled: formData.get("homeManhwaEnabled") === "on" });
  redirect("/manga1004/settings?saved=home-content#home-content");
}

export async function updatePwaSettingsAction(formData: FormData) {
  const threshold = z.coerce.number().int().min(3).max(5).safeParse(formData.get("pwaPromptThreshold"));
  if (!threshold.success) redirect("/manga1004/settings?error=pwa#pwa");
  await updatePwaSettings({
    pwaEnabled: formData.get("pwaEnabled") === "on",
    pwaPromptEnabled: formData.get("pwaPromptEnabled") === "on",
    pwaPromptThreshold: threshold.data as 3 | 4 | 5
  });
  redirect("/manga1004/settings?saved=pwa#pwa");
}

export async function updateGoogleAnalyticsSettingsAction(formData: FormData) {
  const enabled = formData.get("googleAnalyticsEnabled") === "on";
  const measurementId = String(formData.get("googleAnalyticsMeasurementId") ?? "").trim().toUpperCase();
  const parsed = z.string().regex(/^G-[A-Z0-9]{4,20}$/u).safeParse(measurementId);
  if (enabled && !parsed.success) redirect("/manga1004/settings?error=analytics#analytics");
  if (measurementId && !parsed.success) redirect("/manga1004/settings?error=analytics#analytics");
  await updateGoogleAnalyticsSettings({ googleAnalyticsEnabled: enabled, googleAnalyticsMeasurementId: measurementId || null });
  redirect("/manga1004/settings?saved=analytics#analytics");
}

export async function uploadBrandingAction(kind: "logo" | "favicon", formData: FormData) {
  const format = formData.get("format") === "manhwa" ? "manhwa" : "manga";
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) redirect(`/manga1004/settings?error=branding#branding`);
  try {
    const [image] = await filesToImages([file]);
    const [uploaded] = await uploadImages(format, `branding/${kind}`, [image], { singleFileName: `${kind}-${Date.now()}` });
    await updateBrandingImage(kind, { publicUrl: uploaded.publicUrl, objectKey: uploaded.objectKey, format, width: uploaded.width, height: uploaded.height });
  } catch {
    redirect("/manga1004/settings?error=branding#branding");
  }
  redirect(`/manga1004/settings?saved=${kind}#branding`);
}

export async function deleteBrandingAction(kind: "logo" | "favicon") {
  await updateBrandingImage(kind, null);
  redirect(`/manga1004/settings?saved=${kind}-deleted#branding`);
}

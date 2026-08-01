import "server-only";
import { auditLogs, siteSettings } from "@/db/schema";
import { getDb, getDbOrNull } from "@/lib/db/client";
import { validateImageCdnUrl } from "@/lib/media/public-url";

export const deepseekModels = ["deepseek-v4-flash", "deepseek-v4-pro"] as const;
export type DeepSeekModel = (typeof deepseekModels)[number];

export async function getSiteSettings() {
  const db = getDbOrNull();
  const [settings] = db ? await db.select().from(siteSettings).limit(1) : [];
  return {
    deepseekModel: isDeepSeekModel(settings?.deepseekModel) ? settings.deepseekModel : "deepseek-v4-flash",
    imageCdnUrl: settings?.imageCdnUrl ?? process.env.NEXT_PUBLIC_IMAGE_CDN_URL ?? ""
  } satisfies { deepseekModel: DeepSeekModel; imageCdnUrl: string };
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

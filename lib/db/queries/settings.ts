import "server-only";
import { siteSettings } from "@/db/schema";
import { getDb } from "@/lib/db/client";

export const deepseekModels = ["deepseek-v4-flash", "deepseek-v4-pro"] as const;
export type DeepSeekModel = (typeof deepseekModels)[number];

export async function getSiteSettings() {
  const [settings] = await getDb().select().from(siteSettings).limit(1);
  return {
    deepseekModel: isDeepSeekModel(settings?.deepseekModel) ? settings.deepseekModel : "deepseek-v4-flash"
  } satisfies { deepseekModel: DeepSeekModel };
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

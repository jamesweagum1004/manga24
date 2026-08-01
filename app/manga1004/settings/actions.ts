"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { deepseekModels, updateDeepSeekModel, updateImageCdnUrl } from "@/lib/db/queries/settings";
import { updateStorageConfig, type StorageFormat } from "@/lib/db/queries/storage-configs";
import { getAdminSession } from "@/lib/admin/auth";

export async function updateAiSettingsAction(formData: FormData) {
  const parsed = z.enum(deepseekModels).safeParse(formData.get("deepseekModel"));
  if (!parsed.success) redirect("/manga1004/settings?error=model");
  await updateDeepSeekModel(parsed.data);
  redirect("/manga1004/settings?saved=1");
}

export async function updateImageCdnAction(formData: FormData) {
  const value = z.string().trim().url().safeParse(formData.get("imageCdnUrl"));
  const session = await getAdminSession();
  if (!value.success || !session) redirect("/manga1004/settings?error=image-cdn#image-cdn");
  try {
    await updateImageCdnUrl(value.data, session.adminId);
  } catch {
    redirect("/manga1004/settings?error=image-cdn#image-cdn");
  }
  redirect("/manga1004/settings?saved=image-cdn#image-cdn");
}

const storageSchema = z.object({
  bucketName: z.string().trim().min(6).max(160).regex(/^[a-zA-Z0-9.-]+$/),
  endpoint: z.url().refine((value) => new URL(value).protocol === "https:", "HTTPS is required."),
  region: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  keyId: z.string().trim().min(1).max(255),
  applicationKey: z.string().trim().max(500)
});

export async function updateStorageSettingsAction(format: StorageFormat, formData: FormData) {
  const parsedFormat = z.enum(["manga", "manhwa"]).safeParse(format);
  const parsed = storageSchema.safeParse({
    bucketName: formData.get("bucketName"),
    endpoint: formData.get("endpoint"),
    region: formData.get("region"),
    keyId: formData.get("keyId"),
    applicationKey: formData.get("applicationKey")
  });
  if (!parsedFormat.success || !parsed.success) redirect("/manga1004/settings?error=storage-fields#storage");
  try {
    await updateStorageConfig(parsedFormat.data, parsed.data);
  } catch {
    redirect("/manga1004/settings?error=storage-secret#storage");
  }
  redirect(`/manga1004/settings?saved=${parsedFormat.data}#storage`);
}

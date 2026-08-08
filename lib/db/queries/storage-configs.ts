import "server-only";
import { eq } from "drizzle-orm";
import { storageConfigs } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { decryptStorageSecret, encryptStorageSecret } from "@/lib/storage-crypto";

export type StorageFormat = "manga" | "manhwa";
export type StorageConfigInput = {
  bucketName: string;
  endpoint: string;
  region: string;
  keyId: string;
  applicationKey?: string;
  bunnyPublicUrl: string;
};

export async function listStorageConfigsForAdmin() {
  const rows = await getDb().select().from(storageConfigs);
  return (["manga", "manhwa"] as const).map((format) => {
    const row = rows.find((item) => item.format === format);
    return {
      format,
      bucketName: row?.bucketName ?? "",
      endpoint: row?.endpoint ?? "",
      region: row?.region ?? "",
      keyId: row?.keyId ?? "",
      bunnyPublicUrl: row?.bunnyPublicUrl ?? "",
      hasApplicationKey: Boolean(row?.encryptedApplicationKey),
      isReady: Boolean(row?.bucketName && row.endpoint && row.region && row.keyId && row.encryptedApplicationKey && row.bunnyPublicUrl)
    };
  });
}

export async function updateStorageConfig(format: StorageFormat, input: StorageConfigInput) {
  const [current] = await getDb().select().from(storageConfigs).where(eq(storageConfigs.format, format)).limit(1);
  const encryptedApplicationKey = input.applicationKey
    ? encryptStorageSecret(input.applicationKey)
    : current?.encryptedApplicationKey;
  if (!encryptedApplicationKey) throw new Error("Application Key is required for the first save.");
  await getDb().insert(storageConfigs).values({
    format,
    bucketName: input.bucketName,
    endpoint: input.endpoint,
    region: input.region,
    keyId: input.keyId,
    encryptedApplicationKey,
    bunnyPublicUrl: input.bunnyPublicUrl,
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: storageConfigs.format,
    set: { bucketName: input.bucketName, endpoint: input.endpoint, region: input.region, keyId: input.keyId, encryptedApplicationKey, bunnyPublicUrl: input.bunnyPublicUrl, updatedAt: new Date() }
  });
}

export async function getStorageCredentials(format: StorageFormat) {
  const [config] = await getDb().select().from(storageConfigs).where(eq(storageConfigs.format, format)).limit(1);
  if (!config) throw new Error(`${format} storage is not configured.`);
  return {
    bucketName: config.bucketName,
    endpoint: config.endpoint,
    region: config.region,
    keyId: config.keyId,
    applicationKey: decryptStorageSecret(config.encryptedApplicationKey),
    bunnyPublicUrl: config.bunnyPublicUrl
  };
}

export async function getStoragePublicUrls() {
  const rows = await getDb().select({ format: storageConfigs.format, bunnyPublicUrl: storageConfigs.bunnyPublicUrl }).from(storageConfigs);
  return {
    manga: rows.find((row) => row.format === "manga")?.bunnyPublicUrl ?? "",
    manhwa: rows.find((row) => row.format === "manhwa")?.bunnyPublicUrl ?? ""
  } satisfies Record<StorageFormat, string>;
}

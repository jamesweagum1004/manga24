import "server-only";
import { eq } from "drizzle-orm";
import { storageConfigs } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { decryptStorageSecret, encryptStorageSecret } from "@/lib/storage-crypto";

export type StorageFormat = "manga" | "manhwa";
export type StorageProvider = "backblaze-b2" | "bunny-storage";
export type StorageConfigInput = {
  provider: StorageProvider;
  bucketName: string;
  endpoint: string;
  region: string;
  keyId: string;
  applicationKey?: string;
  bunnyPublicUrl: string;
  bunnyStorageZone?: string;
  bunnyEndpoint?: string;
  bunnyAccessKey?: string;
};

export async function listStorageConfigsForAdmin() {
  const rows = await getDb().select().from(storageConfigs);
  return (["manga", "manhwa"] as const).map((format) => {
    const row = rows.find((item) => item.format === format);
    return {
      format,
      provider: row?.provider === "bunny-storage" ? "bunny-storage" as const : "backblaze-b2" as const,
      bucketName: row?.bucketName ?? "",
      endpoint: row?.endpoint ?? "",
      region: row?.region ?? "",
      keyId: row?.keyId ?? "",
      bunnyPublicUrl: row?.bunnyPublicUrl ?? "",
      hasApplicationKey: Boolean(row?.encryptedApplicationKey),
      bunnyStorageZone: row?.bunnyStorageZone ?? "",
      bunnyEndpoint: row?.bunnyEndpoint ?? "",
      hasBunnyAccessKey: Boolean(row?.encryptedBunnyAccessKey),
      isReady: row?.provider === "bunny-storage"
        ? Boolean(row.bunnyStorageZone && row.bunnyEndpoint && row.encryptedBunnyAccessKey && row.bunnyPublicUrl)
        : Boolean(row?.bucketName && row.endpoint && row.region && row.keyId && row.encryptedApplicationKey && row.bunnyPublicUrl)
    };
  });
}

export async function updateStorageConfig(format: StorageFormat, input: StorageConfigInput) {
  const [current] = await getDb().select().from(storageConfigs).where(eq(storageConfigs.format, format)).limit(1);
  const encryptedApplicationKey = input.applicationKey
    ? encryptStorageSecret(input.applicationKey)
    : current?.encryptedApplicationKey;
  const encryptedBunnyAccessKey = input.bunnyAccessKey
    ? encryptStorageSecret(input.bunnyAccessKey)
    : current?.encryptedBunnyAccessKey;
  if (input.provider === "backblaze-b2" && !encryptedApplicationKey) throw new Error("Application Key is required for the first save.");
  if (input.provider === "bunny-storage" && !encryptedBunnyAccessKey) throw new Error("Bunny Storage AccessKey is required for the first save.");
  await getDb().insert(storageConfigs).values({
    format,
    provider: input.provider,
    bucketName: input.bucketName,
    endpoint: input.endpoint,
    region: input.region,
    keyId: input.keyId,
    encryptedApplicationKey: encryptedApplicationKey ?? "",
    bunnyPublicUrl: input.bunnyPublicUrl,
    bunnyStorageZone: input.bunnyStorageZone || null,
    bunnyEndpoint: input.bunnyEndpoint || null,
    encryptedBunnyAccessKey: encryptedBunnyAccessKey ?? null,
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: storageConfigs.format,
    set: { provider: input.provider, bucketName: input.bucketName, endpoint: input.endpoint, region: input.region, keyId: input.keyId, encryptedApplicationKey: encryptedApplicationKey ?? "", bunnyPublicUrl: input.bunnyPublicUrl, bunnyStorageZone: input.bunnyStorageZone || null, bunnyEndpoint: input.bunnyEndpoint || null, encryptedBunnyAccessKey: encryptedBunnyAccessKey ?? null, updatedAt: new Date() }
  });
}

export async function getStorageCredentials(format: StorageFormat) {
  const [config] = await getDb().select().from(storageConfigs).where(eq(storageConfigs.format, format)).limit(1);
  if (!config) throw new Error(`${format} storage is not configured.`);
  if (config.provider === "bunny-storage") {
    if (!config.bunnyStorageZone || !config.bunnyEndpoint || !config.encryptedBunnyAccessKey) throw new Error(`${format} Bunny Storage is incomplete.`);
    return {
      provider: "bunny-storage" as const,
      storageZone: config.bunnyStorageZone,
      endpoint: config.bunnyEndpoint,
      accessKey: decryptStorageSecret(config.encryptedBunnyAccessKey),
      bunnyPublicUrl: config.bunnyPublicUrl
    };
  }
  return {
    provider: "backblaze-b2" as const,
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

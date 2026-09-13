import "server-only";
import { getStorageDeletionCredentials, type StorageFormat, type StorageProvider } from "@/lib/db/queries/storage-configs";
import type { StoredAsset } from "@/lib/db/queries/media";

type B2Authorization = {
  authorizationToken: string;
  apiInfo: {
    storageApi: {
      apiUrl: string;
      allowed: {
        buckets: Array<{ id: string; name: string | null }>;
        capabilities: string[];
      };
    };
  };
};

type B2FileVersion = { fileId: string | null; fileName: string };
type B2VersionPage = {
  files: B2FileVersion[];
  nextFileName: string | null;
  nextFileId: string | null;
};

export async function deleteStoredAssets(format: StorageFormat, assets: StoredAsset[]) {
  const remoteAssets = assets.filter((asset) => asset.provider !== "local");
  if (remoteAssets.length === 0) return;
  const unsupported = remoteAssets.find((asset) => !isStorageProvider(asset.provider));
  if (unsupported) throw new Error(`Remote deletion is not supported for provider ${unsupported.provider}.`);

  for (const provider of ["backblaze-b2", "bunny-storage"] as const) {
    const selected = remoteAssets.filter((asset) => asset.provider === provider);
    if (selected.length === 0) continue;
    if (provider === "backblaze-b2") await deleteBackblazeAssets(format, selected);
    else await deleteBunnyAssets(format, selected);
  }

}

async function deleteBackblazeAssets(format: StorageFormat, assets: StoredAsset[]) {
  const credentials = await getStorageDeletionCredentials(format, "backblaze-b2");
  assertMatchingBucket(assets, credentials.bucketName, "Backblaze");
  const authResponse = await fetch("https://api.backblazeb2.com/b2api/v4/b2_authorize_account", {
    headers: { Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.applicationKey}`).toString("base64")}` },
    cache: "no-store"
  });
  if (!authResponse.ok) throw new Error("Backblaze authorization failed. Check the configured key.");
  const authorization = await authResponse.json() as B2Authorization;
  const storageApi = authorization.apiInfo.storageApi;
  for (const capability of ["listFiles", "deleteFiles"]) {
    if (!storageApi.allowed.capabilities.includes(capability)) {
      throw new Error(`Backblaze key requires ${capability} permission before media can be deleted.`);
    }
  }
  const bucket = storageApi.allowed.buckets.find((item) => item.name === credentials.bucketName);
  if (!bucket) throw new Error(`Backblaze key cannot access ${credentials.bucketName}.`);

  const requestedNames = new Set(assets.map((asset) => asset.objectKey));
  const versions: B2FileVersion[] = [];
  for (const prefix of parentPrefixes(requestedNames)) {
    let startFileName: string | null = null;
    let startFileId: string | null = null;
    do {
      const url = new URL(`${storageApi.apiUrl}/b2api/v4/b2_list_file_versions`);
      url.searchParams.set("bucketId", bucket.id);
      url.searchParams.set("prefix", prefix);
      url.searchParams.set("maxFileCount", "1000");
      if (startFileName) url.searchParams.set("startFileName", startFileName);
      if (startFileId) url.searchParams.set("startFileId", startFileId);
      const response = await fetch(url, { headers: { Authorization: authorization.authorizationToken }, cache: "no-store" });
      if (!response.ok) throw new Error(`Backblaze could not list file versions (${response.status}).`);
      const page = await response.json() as B2VersionPage;
      versions.push(...page.files.filter((file) => file.fileId && requestedNames.has(file.fileName)));
      startFileName = page.nextFileName;
      startFileId = page.nextFileId;
    } while (startFileName);
  }

  await inBatches(versions, 10, async (version) => {
    const response = await fetch(`${storageApi.apiUrl}/b2api/v4/b2_delete_file_version`, {
      method: "POST",
      headers: { Authorization: authorization.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: version.fileName, fileId: version.fileId }),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Backblaze could not permanently delete ${version.fileName} (${response.status}).`);
  });
}

async function deleteBunnyAssets(format: StorageFormat, assets: StoredAsset[]) {
  const credentials = await getStorageDeletionCredentials(format, "bunny-storage");
  assertMatchingBucket(assets, credentials.storageZone, "Bunny Storage");
  const endpoint = new URL(credentials.endpoint);
  if (endpoint.protocol !== "https:") throw new Error("Bunny Storage requires an HTTPS endpoint.");
  await inBatches(assets, 10, async (asset) => {
    const url = new URL(`${encodePath(credentials.storageZone)}/${encodePath(asset.objectKey)}`, `${endpoint.toString().replace(/\/$/u, "")}/`);
    const response = await fetch(url, { method: "DELETE", headers: { AccessKey: credentials.accessKey }, cache: "no-store" });
    if (!response.ok && response.status !== 404) throw new Error(`Bunny Storage could not delete ${asset.objectKey} (${response.status}).`);
  });
}

function parentPrefixes(objectKeys: Set<string>) {
  return [...new Set([...objectKeys].map((key) => `${key.slice(0, Math.max(0, key.lastIndexOf("/") + 1))}`))];
}

function assertMatchingBucket(assets: StoredAsset[], expected: string, label: string) {
  const mismatch = assets.find((asset) => asset.bucket !== expected);
  if (mismatch) throw new Error(`${label} credentials do not match the asset bucket ${mismatch.bucket ?? "(missing)"}.`);
}

function isStorageProvider(value: string): value is StorageProvider {
  return value === "backblaze-b2" || value === "bunny-storage";
}

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

async function inBatches<T>(items: T[], size: number, operation: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(operation));
  }
}

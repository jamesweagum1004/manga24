export type StoredAsset = {
  id: string;
  path: string;
  alt: string;
  width: number;
  height: number;
};

export interface StorageAdapter {
  publicUrl(asset: StoredAsset): string;
}

export class LocalPublicStorageAdapter implements StorageAdapter {
  publicUrl(asset: StoredAsset) {
    return asset.path;
  }
}

export class CdnStorageAdapter implements StorageAdapter {
  constructor(private readonly baseUrl: string) {}

  publicUrl(asset: StoredAsset) {
    return new URL(asset.path.replace(/^\//, ""), this.baseUrl).toString();
  }
}

export const storage = new LocalPublicStorageAdapter();

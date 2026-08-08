import "server-only";
import { createHash } from "node:crypto";
import { getStorageCredentials, type StorageFormat } from "@/lib/db/queries/storage-configs";
import type { UploadImage } from "./zip-images";
import { imageCdnUrl, validateImageCdnUrl } from "./public-url";

type Authorization = {
  authorizationToken: string;
  apiInfo: { storageApi: { apiUrl: string; allowed: { buckets: Array<{ id: string; name: string | null }>; capabilities: string[] } } };
};

export type UploadedMedia = {
  provider: "backblaze-b2";
  bucket: string;
  objectKey: string;
  publicUrl: string;
  width: number;
  height: number;
  contentType: string;
  fileSize: number;
};

export async function uploadImages(format: StorageFormat, prefix: string, images: UploadImage[], options?: { singleFileName?: string }): Promise<UploadedMedia[]> {
  const credentials = await getStorageCredentials(format);
  const imageCdnBaseUrl = validateImageCdnUrl(credentials.bunnyPublicUrl);
  const authResponse = await fetch("https://api.backblazeb2.com/b2api/v4/b2_authorize_account", {
    headers: { Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.applicationKey}`).toString("base64")}` },
    cache: "no-store"
  });
  if (!authResponse.ok) throw new Error("Backblaze authorization failed. Check the configured key.");
  const authorization = await authResponse.json() as Authorization;
  const storageApi = authorization.apiInfo.storageApi;
  if (!storageApi.allowed.capabilities.includes("writeFiles")) throw new Error("Backblaze key requires writeFiles permission.");
  const bucket = storageApi.allowed.buckets.find((item) => item.name === credentials.bucketName);
  if (!bucket) throw new Error(`Backblaze key is not restricted to ${credentials.bucketName}.`);
  const uploadTargetResponse = await fetch(`${storageApi.apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${encodeURIComponent(bucket.id)}`, {
    headers: { Authorization: authorization.authorizationToken },
    cache: "no-store"
  });
  if (!uploadTargetResponse.ok) throw new Error("Unable to obtain a Backblaze upload URL.");
  const uploadTarget = await uploadTargetResponse.json() as { uploadUrl: string; authorizationToken: string };

  const uploaded: UploadedMedia[] = [];
  for (const [index, image] of images.entries()) {
    const extension = image.contentType === "image/jpeg" ? "jpg" : image.contentType.split("/")[1];
    const filename = images.length === 1 && options?.singleFileName ? `${options.singleFileName}.${extension}` : `${String(index + 1).padStart(4, "0")}.${extension}`;
    const objectKey = `${prefix}/${filename}`;
    const metadata = imageDimensions(image.bytes, image.contentType);
    if (!metadata) throw new Error(`${image.name} has an invalid or mismatched image header.`);
    const response = await fetch(uploadTarget.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadTarget.authorizationToken,
        "X-Bz-File-Name": encodeB2Name(objectKey),
        "Content-Type": image.contentType,
        "Content-Length": String(image.bytes.length),
        "X-Bz-Content-Sha1": createHash("sha1").update(image.bytes).digest("hex")
      },
      body: new Uint8Array(image.bytes)
    });
    if (!response.ok) throw new Error(`Backblaze rejected ${image.name}.`);
    uploaded.push({ provider: "backblaze-b2", bucket: credentials.bucketName, objectKey, publicUrl: imageCdnUrl(objectKey, imageCdnBaseUrl), width: metadata.width, height: metadata.height, contentType: image.contentType, fileSize: image.bytes.length });
  }
  return uploaded;
}

function encodeB2Name(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function imageDimensions(bytes: Buffer, contentType: string): { width: number; height: number } | null {
  if (contentType === "image/gif" && bytes.length >= 10 && (bytes.toString("ascii", 0, 6) === "GIF87a" || bytes.toString("ascii", 0, 6) === "GIF89a")) {
    return validDimensions(bytes.readUInt16LE(6), bytes.readUInt16LE(8));
  }
  if (contentType === "image/png" && bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return validDimensions(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  }
  if (contentType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return validDimensions(bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5));
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2) return null;
      offset += 2 + length;
    }
  }
  if (contentType === "image/webp" && bytes.length >= 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const kind = bytes.toString("ascii", 12, 16);
    if (kind === "VP8X") return validDimensions(1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3));
    if (kind === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return validDimensions(bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff);
    if (kind === "VP8L" && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return validDimensions((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
    }
  }
  if (contentType === "image/avif" && bytes.length >= 32 && bytes.toString("ascii", 4, 8) === "ftyp" && bytes.subarray(8, Math.min(bytes.length, 64)).includes("avif")) {
    for (let offset = 0; offset + 20 <= bytes.length; offset += 1) if (bytes.toString("ascii", offset + 4, offset + 8) === "ispe") return validDimensions(bytes.readUInt32BE(offset + 12), bytes.readUInt32BE(offset + 16));
  }
  return null;
}

function validDimensions(width: number, height: number) {
  return width > 0 && height > 0 && width <= 20_000 && height <= 40_000 ? { width, height } : null;
}

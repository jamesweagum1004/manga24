import "server-only";
import { createHash } from "node:crypto";
import { getStorageCredentials, type StorageFormat } from "@/lib/db/queries/storage-configs";
import type { UploadImage } from "./zip-images";
import { imageCdnUrl, validateImageCdnUrl } from "./public-url";

type Authorization = {
  authorizationToken: string;
  apiInfo: { storageApi: { apiUrl: string; allowed: { buckets: Array<{ id: string; name: string | null }>; capabilities: string[] } } };
};

type BackblazeCredentials = Extract<Awaited<ReturnType<typeof getStorageCredentials>>, { provider: "backblaze-b2" }>;
type BackblazeSession = { authorization: Authorization; bucketId: string };
type B2ErrorDetails = { status: number; statusText: string; code: string | null; message: string | null; body: unknown };

// B2 can temporarily run out of upload workers during bursts. Allow a few
// minutes of recovery across the complete batch without reusing upload tokens.
const backblazeUploadAttempts = 5;

export type UploadedMedia = {
  provider: "backblaze-b2" | "bunny-storage";
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
  if (credentials.provider === "bunny-storage") {
    return uploadToBunnyStorage(credentials, prefix, images, imageCdnBaseUrl, options);
  }
  let session = await authorizeBackblaze(credentials);

  const uploaded: UploadedMedia[] = [];
  for (const [index, image] of images.entries()) {
    const extension = image.contentType === "image/jpeg" ? "jpg" : image.contentType.split("/")[1];
    const filename = images.length === 1 && options?.singleFileName ? `${options.singleFileName}.${extension}` : `${String(index + 1).padStart(4, "0")}.${extension}`;
    const objectKey = `${prefix}/${filename}`;
    const metadata = imageDimensions(image.bytes, image.contentType);
    if (!metadata) throw new Error(`${image.name} has an invalid or mismatched image header.`);
    let completed = false;
    for (let attempt = 1; attempt <= backblazeUploadAttempts; attempt += 1) {
      try {
        // B2 upload URLs are deliberately single-use here. Every file and every
        // retry obtains a fresh URL/token pair before sending any bytes.
        const targetResponse = await requestBackblazeUploadTarget(session);
        if (!targetResponse.ok) {
          const details = await b2ErrorDetails(targetResponse);
          logB2Failure("get_upload_url", image.name, objectKey, attempt, details);
          if (!isRetryableB2Failure(details) || attempt === backblazeUploadAttempts) {
            throw reportedB2Error(b2FailureMessage(`Unable to obtain an upload URL for ${image.name}`, details));
          }
          if (details.status === 401) session = await authorizeBackblaze(credentials);
          await waitForB2Retry(attempt, targetResponse.headers.get("retry-after"));
          continue;
        }

        const uploadTarget = await readUploadTarget(targetResponse, image.name);
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
        if (response.ok) {
          completed = true;
          break;
        }

        const details = await b2ErrorDetails(response);
        logB2Failure("upload", image.name, objectKey, attempt, details);
        if (!isRetryableB2Failure(details) || attempt === backblazeUploadAttempts) {
          throw reportedB2Error(b2FailureMessage(`Backblaze rejected ${image.name}`, details));
        }
        if (details.status === 401) session = await authorizeBackblaze(credentials);
        await waitForB2Retry(attempt, response.headers.get("retry-after"));
      } catch (error) {
        if (isReportedB2Error(error)) throw error;
        console.error("Backblaze B2 request failed before receiving a response.", {
          operation: "upload",
          file: image.name,
          objectKey,
          attempt,
          maxAttempts: backblazeUploadAttempts,
          cause: error instanceof Error ? error.message : String(error)
        });
        if (attempt === backblazeUploadAttempts) throw new Error(`Backblaze upload failed for ${image.name} after ${backblazeUploadAttempts} attempts.`, { cause: error });
        await waitForB2Retry(attempt, null);
      }
    }
    if (!completed) throw new Error(`Backblaze upload failed for ${image.name}.`);
    uploaded.push({ provider: "backblaze-b2", bucket: credentials.bucketName, objectKey, publicUrl: imageCdnUrl(objectKey, imageCdnBaseUrl), width: metadata.width, height: metadata.height, contentType: image.contentType, fileSize: image.bytes.length });
  }
  return uploaded;
}

async function authorizeBackblaze(credentials: BackblazeCredentials): Promise<BackblazeSession> {
  const response = await fetch("https://api.backblazeb2.com/b2api/v4/b2_authorize_account", {
    headers: { Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.applicationKey}`).toString("base64")}` },
    cache: "no-store"
  });
  if (!response.ok) {
    const details = await b2ErrorDetails(response);
    logB2Failure("authorize_account", null, null, 1, details);
    throw new Error(b2FailureMessage("Backblaze authorization failed", details));
  }
  const authorization = await response.json() as Authorization;
  const storageApi = authorization.apiInfo.storageApi;
  if (!storageApi.allowed.capabilities.includes("writeFiles")) throw new Error("Backblaze key requires writeFiles permission.");
  const bucket = storageApi.allowed.buckets.find((item) => item.name === credentials.bucketName);
  if (!bucket) throw new Error(`Backblaze key is not restricted to ${credentials.bucketName}.`);
  return { authorization, bucketId: bucket.id };
}

function requestBackblazeUploadTarget(session: BackblazeSession) {
  const storageApi = session.authorization.apiInfo.storageApi;
  return fetch(`${storageApi.apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${encodeURIComponent(session.bucketId)}`, {
    headers: { Authorization: session.authorization.authorizationToken },
    cache: "no-store"
  });
}

async function readUploadTarget(response: Response, fileName: string) {
  const target = await response.json() as { uploadUrl?: unknown; authorizationToken?: unknown };
  if (typeof target.uploadUrl !== "string" || typeof target.authorizationToken !== "string") {
    console.error("Backblaze B2 returned an invalid upload target.", { file: fileName, status: response.status, responseBody: target });
    throw reportedB2Error(`Backblaze returned an invalid upload target for ${fileName}.`);
  }
  return { uploadUrl: target.uploadUrl, authorizationToken: target.authorizationToken };
}

async function b2ErrorDetails(response: Response): Promise<B2ErrorDetails> {
  const text = await response.text();
  let body: unknown = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* Preserve a non-JSON response for diagnostics. */ }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : null;
  return {
    status: response.status,
    statusText: response.statusText,
    code: typeof record?.code === "string" ? record.code : null,
    message: typeof record?.message === "string" ? record.message : null,
    body
  };
}

function isRetryableB2Failure(details: B2ErrorDetails) {
  // B2 occasionally returns transient internal_error (500) responses while
  // processing uploads. Retry these with a newly issued upload URL just like
  // throttling and temporary service-unavailable responses.
  return [429, 500, 502, 503, 504].includes(details.status) || (details.status === 401 && (details.code === "bad_auth_token" || details.code === "expired_auth_token"));
}

function logB2Failure(operation: string, file: string | null, objectKey: string | null, attempt: number, details: B2ErrorDetails) {
  console.error("Backblaze B2 request rejected.", {
    operation,
    file,
    objectKey,
    attempt,
    maxAttempts: backblazeUploadAttempts,
    httpStatus: details.status,
    httpStatusText: details.statusText,
    b2ErrorCode: details.code,
    b2ErrorMessage: details.message,
    responseBody: details.body
  });
}

function b2FailureMessage(prefix: string, details: B2ErrorDetails) {
  const code = details.code ? ` ${details.code}` : "";
  const message = details.message ? `: ${details.message}` : "";
  return `${prefix} (HTTP ${details.status}${code}${message}).`;
}

function reportedB2Error(message: string) {
  const error = new Error(message) as Error & { reportedB2Error: true };
  error.reportedB2Error = true;
  return error;
}

function isReportedB2Error(error: unknown): error is Error & { reportedB2Error: true } {
  return error instanceof Error && "reportedB2Error" in error;
}

async function waitForB2Retry(attempt: number, retryAfter: string | null) {
  const retryAfterMs = parseRetryAfter(retryAfter);
  const delayMs = retryAfterMs ?? 1_000 * (2 ** (attempt - 1));
  await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 30_000)));
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

async function uploadToBunnyStorage(
  credentials: Extract<Awaited<ReturnType<typeof getStorageCredentials>>, { provider: "bunny-storage" }>,
  prefix: string,
  images: UploadImage[],
  imageCdnBaseUrl: string,
  options?: { singleFileName?: string }
): Promise<UploadedMedia[]> {
  const endpoint = new URL(credentials.endpoint);
  if (endpoint.protocol !== "https:") throw new Error("Bunny Storage requires an HTTPS endpoint.");
  const uploaded: UploadedMedia[] = [];

  for (const [index, image] of images.entries()) {
    const extension = image.contentType === "image/jpeg" ? "jpg" : image.contentType.split("/")[1];
    const filename = images.length === 1 && options?.singleFileName ? `${options.singleFileName}.${extension}` : `${String(index + 1).padStart(4, "0")}.${extension}`;
    const objectKey = `${prefix}/${filename}`;
    const metadata = imageDimensions(image.bytes, image.contentType);
    if (!metadata) throw new Error(`${image.name} has an invalid or mismatched image header.`);
    const uploadUrl = new URL(`${encodeB2Name(credentials.storageZone)}/${encodeB2Name(objectKey)}`, `${endpoint.toString().replace(/\/$/u, "")}/`);
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: credentials.accessKey,
        "Content-Type": image.contentType,
        Checksum: createHash("sha256").update(image.bytes).digest("hex").toUpperCase()
      },
      body: new Uint8Array(image.bytes)
    });
    if (!response.ok) throw new Error(`Bunny Storage rejected ${image.name} (${response.status}).`);
    uploaded.push({ provider: "bunny-storage", bucket: credentials.storageZone, objectKey, publicUrl: imageCdnUrl(objectKey, imageCdnBaseUrl), width: metadata.width, height: metadata.height, contentType: image.contentType, fileSize: image.bytes.length });
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

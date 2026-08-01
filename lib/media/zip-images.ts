import "server-only";
import { inflateRawSync } from "node:zlib";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const imagePattern = /\.(?:jpe?g|png|webp|avif)$/iu;

export type UploadImage = { name: string; bytes: Buffer; contentType: string };

export function extractZipImages(input: Buffer): UploadImage[] {
  if (input.length > 120 * 1024 * 1024) throw new Error("ZIP files must be 120 MB or smaller.");
  const eocdOffset = findSignature(input, EOCD, Math.max(0, input.length - 65_557));
  if (eocdOffset < 0) throw new Error("Invalid ZIP archive.");
  const count = input.readUInt16LE(eocdOffset + 10);
  const centralOffset = input.readUInt32LE(eocdOffset + 16);
  if (count < 1 || count > 500) throw new Error("ZIP must contain between 1 and 500 files.");

  const images: UploadImage[] = [];
  let offset = centralOffset;
  let totalSize = 0;
  for (let index = 0; index < count; index += 1) {
    if (input.readUInt32LE(offset) !== CENTRAL) throw new Error("Invalid ZIP directory.");
    const method = input.readUInt16LE(offset + 10);
    const compressedSize = input.readUInt32LE(offset + 20);
    const size = input.readUInt32LE(offset + 24);
    const nameLength = input.readUInt16LE(offset + 28);
    const extraLength = input.readUInt16LE(offset + 30);
    const commentLength = input.readUInt16LE(offset + 32);
    const localOffset = input.readUInt32LE(offset + 42);
    const name = input.subarray(offset + 46, offset + 46 + nameLength).toString("utf8").replace(/\\/gu, "/");
    offset += 46 + nameLength + extraLength + commentLength;
    if (!imagePattern.test(name) || name.startsWith("__MACOSX/") || name.split("/").some((part) => part === "..")) continue;
    if (size > 25 * 1024 * 1024) throw new Error(`${name} is larger than 25 MB.`);
    totalSize += size;
    if (totalSize > 350 * 1024 * 1024) throw new Error("Uncompressed ZIP content is too large.");
    if (input.readUInt32LE(localOffset) !== LOCAL) throw new Error("Invalid ZIP file entry.");
    const localNameLength = input.readUInt16LE(localOffset + 26);
    const localExtraLength = input.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = input.subarray(dataOffset, dataOffset + compressedSize);
    const bytes = method === 0 ? Buffer.from(compressed) : method === 8 ? inflateRawSync(compressed) : null;
    if (!bytes || bytes.length !== size) throw new Error(`${name} uses an unsupported ZIP compression method.`);
    images.push({ name: basename(name), bytes, contentType: contentTypeFor(name) });
  }
  if (images.length === 0) throw new Error("ZIP does not contain supported images.");
  return images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

export async function filesToImages(files: File[]) {
  const images: UploadImage[] = [];
  for (const file of files) {
    if (!imagePattern.test(file.name)) throw new Error(`${file.name} is not a supported image.`);
    if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);
    images.push({ name: basename(file.name), bytes: Buffer.from(await file.arrayBuffer()), contentType: contentTypeFor(file.name) });
  }
  return images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

function findSignature(buffer: Buffer, signature: number, start: number) {
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) if (buffer.readUInt32LE(offset) === signature) return offset;
  return -1;
}
function basename(value: string) { return value.split("/").at(-1) ?? value; }
function contentTypeFor(name: string) {
  const extension = name.split(".").at(-1)?.toLowerCase();
  return extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/avif";
}

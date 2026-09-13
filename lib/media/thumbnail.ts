import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { get } from "node:https";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.join(process.cwd(), ".cache", "thumbnails");
const maxBytes = 512 * 1024 * 1024;
const pending = new Map<string, Promise<Buffer>>();
let active = 0;
const waiters: Array<() => void> = [];
let lastCleanup = 0;

export function isPublicIPv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)));
}

// Pin the checked DNS result to the actual connection; redirects are never followed.
async function downloadCover(url: URL): Promise<Buffer> {
  const addresses = await lookup(url.hostname, { family: 4, all: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIPv4(address))) throw new Error("Invalid image host");
  return new Promise((resolve, reject) => {
    const request = get(url, {
      family: 4,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { Accept: "image/webp,image/jpeg,image/png,image/avif,image/gif" }
    }, (response) => {
      if (response.statusCode !== 200 || !/^image\/(webp|jpeg|png|avif|gif)(;|$)/i.test(response.headers["content-type"] ?? "")) {
        response.resume(); reject(new Error("Invalid cover response")); return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 12 * 1024 * 1024) { request.destroy(new Error("Cover too large")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    });
    const timer = setTimeout(() => request.destroy(new Error("Cover download timed out")), 12000);
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
  });
}

export async function resizeCover(bytes: Buffer, width: number) {
  return sharp(bytes, { limitInputPixels: 40_000_000, animated: false })
    .rotate().resize({ width, height: width * 4, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72, effort: 3 }).timeout({ seconds: 5 }).toBuffer();
}

async function cleanupCache() {
  if (Date.now() - lastCleanup < 60_000) return;
  lastCleanup = Date.now();
  const entries = await readdir(directory);
  const files = await Promise.all(entries.filter((name) => /^[a-f0-9]{64}\.webp$/.test(name)).map(async (name) => {
    const file = path.join(directory, name);
    const info = await stat(file);
    return { file, size: info.size, time: info.mtimeMs };
  }));
  let total = files.reduce((sum, file) => sum + file.size, 0);
  for (const file of files.sort((a, b) => a.time - b.time)) {
    if (total <= maxBytes && Date.now() - file.time < 7 * 86400_000) break;
    await unlink(file.file).catch(() => undefined);
    total -= file.size;
  }
}

export async function getThumbnail(source: URL, width: number, version: string) {
  const key = createHash("sha256").update(`v1:${source.href}:${width}:${version}`).digest("hex");
  const file = path.join(directory, `${key}.webp`);
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs < 7 * 86400_000) return await readFile(file);
  } catch { /* First request generates the cached file. */ }
  const existing = pending.get(key);
  if (existing) return existing;
  if (pending.size >= 32) throw new Error("Thumbnail queue full");
  const job = (async () => {
    while (active >= 2) await new Promise<void>((resolve) => waiters.push(resolve));
    active++;
    try {
      const bytes = await resizeCover(await downloadCover(source), width);
      await mkdir(directory, { recursive: true });
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, bytes);
        await rename(temporary, file);
      } finally { await unlink(temporary).catch(() => undefined); }
      await cleanupCache().catch(() => undefined);
      return bytes;
    } finally { active--; waiters.shift()?.(); }
  })();
  pending.set(key, job);
  try { return await job; } finally { pending.delete(key); }
}

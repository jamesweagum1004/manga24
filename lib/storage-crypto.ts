import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

export function isStorageEncryptionConfigured() {
  return Boolean(process.env.STORAGE_CONFIG_ENCRYPTION_KEY?.trim());
}

export function encryptStorageSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptStorageSecret(value: string) {
  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== VERSION || !iv || !tag || !encrypted) throw new Error("Unsupported encrypted storage credential.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

function encryptionKey() {
  const secret = process.env.STORAGE_CONFIG_ENCRYPTION_KEY?.trim();
  if (!secret) throw new Error("STORAGE_CONFIG_ENCRYPTION_KEY is not configured.");
  return createHash("sha256").update(secret).digest();
}

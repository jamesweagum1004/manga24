"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAd, deleteAd, getAd, updateAd, type AdValues } from "@/lib/db/queries/ads";
import { uploadImages } from "@/lib/media/b2-upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const optionalUrl = z
  .preprocess((value) => (typeof value === "string" ? value.trim() : ""), z.union([z.literal(""), z.url()]))
  .refine((value) => !value || ["http:", "https:"].includes(new URL(value).protocol), "Use an HTTP or HTTPS URL.");
const baseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["static", "exoclick"]),
  position: z.enum(["header", "content"]),
  clickUrl: optionalUrl,
  altText: z.string().trim().max(240),
  embedCode: z.string().trim().max(20000),
  width: z.coerce.number().int().min(1).max(4000),
  height: z.coerce.number().int().min(1).max(2000),
  insertAfter: z.coerce.number().int().min(1).max(20),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean()
});

export async function createAdAction(formData: FormData) {
  const parsed = parseForm(formData);
  if (!parsed.success) redirect("/manga1004/ads?error=invalid");
  const imageUrl = await saveImage(formData.get("image"));
  const values = makeValues(parsed.data, imageUrl);
  if (!isComplete(values)) redirect("/manga1004/ads?error=missing-content");
  await createAd(values);
  redirect("/manga1004/ads?saved=created");
}

export async function updateAdAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = parseForm(formData);
  if (!id.success || !parsed.success) redirect("/manga1004/ads?error=invalid");
  const current = await getAd(id.data);
  if (!current) redirect("/manga1004/ads?error=not-found");
  const uploaded = await saveImage(formData.get("image"));
  const imageUrl = uploaded ?? current.imageUrl;
  const values = makeValues(parsed.data, imageUrl);
  if (!isComplete(values)) redirect("/manga1004/ads?error=missing-content");
  await updateAd(id.data, values);
  redirect("/manga1004/ads?saved=updated");
}

export async function deleteAdAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/manga1004/ads?error=invalid");
  const current = await getAd(id.data);
  if (current) {
    await deleteAd(id.data);
  }
  redirect("/manga1004/ads?saved=deleted");
}

function parseForm(formData: FormData) {
  return baseSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    position: formData.get("position"),
    clickUrl: formData.get("clickUrl"),
    altText: formData.get("altText"),
    embedCode: formData.get("embedCode"),
    width: formData.get("width"),
    height: formData.get("height"),
    insertAfter: formData.get("insertAfter"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on"
  });
}

function makeValues(data: z.infer<typeof baseSchema>, imageUrl: string | null): AdValues {
  return {
    ...data,
    imageUrl: data.kind === "static" ? imageUrl : null,
    clickUrl: data.clickUrl || null,
    altText: data.altText || null,
    embedCode: data.kind === "exoclick" ? data.embedCode : null
  };
}

function isComplete(values: AdValues) {
  return values.kind === "static" ? Boolean(values.imageUrl) : Boolean(values.embedCode);
}

async function saveImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_FILE_SIZE) redirect("/manga1004/ads?error=file-size");
  const bytes = Buffer.from(await value.arrayBuffer());
  const extension = detectImageExtension(bytes);
  if (!extension) redirect("/manga1004/ads?error=file-type");
  const filename = `${randomUUID()}.${extension}`;
  const now = new Date();
  const prefix = `ads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const [uploaded] = await uploadImages("manga", prefix, [{ name: filename, bytes, contentType: contentType(extension) }], { singleFileName: filename.replace(/\.[^.]+$/u, "") });
  return uploaded.publicUrl;
}

function detectImageExtension(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "webp";
  if (header.slice(4, 12) === "ftypavif" || header.slice(4, 12) === "ftypavis") return "avif";
  return null;
}

function contentType(extension: string) {
  if (extension === "jpg") return "image/jpeg";
  return `image/${extension}`;
}

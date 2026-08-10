import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDbChapter, updateDbChapter } from "@/lib/db/queries/chapters";
import { attachCover, getChapterIdForImport, getChapterMediaTarget, getTitleMediaTarget, getTitlePublishingState, publishTitle, replaceChapterPages } from "@/lib/db/queries/media";
import { createDbTitle, getDbTitleForAdmin, updateDbTitle, type TitleFormValues } from "@/lib/db/queries/titles";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { generateTitleSeo } from "@/lib/deepseek/seo";
import { uploadImages } from "@/lib/media/b2-upload";
import { extractZipImages, filesToImages, type UploadImage } from "@/lib/media/zip-images";
import { chapterObjectPrefix, coverObjectPrefix } from "@/lib/media/object-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).max(180);
const manifestSchema = z.object({
  title: z.object({
    canonicalSlug: slug,
    originalTitle: z.string().trim().min(1).max(240),
    authorName: z.string().trim().min(1).max(160),
    originalLanguage: z.string().trim().min(2).max(16),
    format: z.enum(["manga", "manhwa"]),
    contentRating: z.enum(["safe", "mature_18"]),
    publicationStatus: z.enum(["ongoing", "completed", "hiatus", "cancelled"]).default("ongoing"),
    enTitle: z.string().trim().min(1).max(240),
    enSlug: slug.optional(),
    enDescription: z.string().trim().min(1).max(4000),
    esTitle: z.string().trim().min(1).max(240),
    esSlug: slug.optional(),
    esDescription: z.string().trim().min(1).max(4000),
    frTitle: z.string().trim().min(1).max(240).optional(), frSlug: slug.optional(), frDescription: z.string().trim().min(1).max(4000).optional(),
    deTitle: z.string().trim().min(1).max(240).optional(), deSlug: slug.optional(), deDescription: z.string().trim().min(1).max(4000).optional(),
    ptTitle: z.string().trim().min(1).max(240).optional(), ptSlug: slug.optional(), ptDescription: z.string().trim().min(1).max(4000).optional(),
    tags: z.array(slug).max(60).default([]),
    seo: z.object({ enTitle: z.string().max(70), enDescription: z.string().max(170), enKeywords: z.array(z.string().max(80)).max(20), esTitle: z.string().max(70), esDescription: z.string().max(170), esKeywords: z.array(z.string().max(80)).max(20), frTitle: z.string().max(70).optional(), frDescription: z.string().max(170).optional(), frKeywords: z.array(z.string().max(80)).max(20).optional(), deTitle: z.string().max(70).optional(), deDescription: z.string().max(170).optional(), deKeywords: z.array(z.string().max(80)).max(20).optional(), ptTitle: z.string().max(70).optional(), ptDescription: z.string().max(170).optional(), ptKeywords: z.array(z.string().max(80)).max(20).optional() }).optional(),
    generateSeo: z.boolean().default(true)
  }),
  chapter: z.object({ number: z.union([z.string(), z.number()]).transform(String), slug, enTitle: z.string().min(1).max(240), esTitle: z.string().min(1).max(240), frTitle: z.string().min(1).max(240).optional(), deTitle: z.string().min(1).max(240).optional(), ptTitle: z.string().min(1).max(240).optional(), publicationStatus: z.enum(["draft", "scheduled", "published", "archived"]).default("draft") }).optional(),
  publish: z.boolean().default(false)
});

export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await request.formData();
    const manifestRaw = form.get("manifest");
    if (typeof manifestRaw !== "string") return NextResponse.json({ error: "manifest is required" }, { status: 400 });
    const parsed = manifestSchema.safeParse(JSON.parse(manifestRaw));
    if (!parsed.success) return NextResponse.json({ error: "Invalid manifest", issues: parsed.error.issues }, { status: 400 });
    const manifest = parsed.data;
    let values = titleValues(manifest.title);
    if (!manifest.title.seo && manifest.title.generateSeo) {
      const settings = await getSiteSettings();
      const generated = await generateTitleSeo(values, settings.deepseekModel);
      values = { ...values, enSeoTitle: generated.en.title, enSeoDescription: generated.en.description, enSeoKeywords: generated.en.keywords.join(", "), esSeoTitle: generated.es.title, esSeoDescription: generated.es.description, esSeoKeywords: generated.es.keywords.join(", "), frSeoTitle: generated.fr.title, frSeoDescription: generated.fr.description, frSeoKeywords: generated.fr.keywords.join(", "), deSeoTitle: generated.de.title, deSeoDescription: generated.de.description, deSeoKeywords: generated.de.keywords.join(", "), ptSeoTitle: generated.pt.title, ptSeoDescription: generated.pt.description, ptSeoKeywords: generated.pt.keywords.join(", ") };
    }
    const existing = await getDbTitleForAdmin(manifest.title.canonicalSlug);
    const titleId = existing ? (await updateDbTitle(existing.id, values), existing.id) : await createDbTitle(values);
    const titleTarget = await getTitleMediaTarget(titleId);
    if (!titleTarget) throw new Error("Unable to load the imported title.");

    const cover = form.get("cover");
    if (cover instanceof File && cover.size > 0) {
      const [image] = await filesToImages([cover]);
      const [uploaded] = await uploadImages(titleTarget.format, coverObjectPrefix(titleTarget.format, titleTarget.slug, titleTarget.createdAt), [image], { singleFileName: "cover" });
      await attachCover(titleId, uploaded, `${values.originalTitle} cover`);
    }

    let chapterId: string | null = null;
    if (manifest.chapter) {
      const chapterValues = { titleId, chapterNumber: manifest.chapter.number, canonicalSlug: manifest.chapter.slug, publicationStatus: "draft" as const, enTitle: manifest.chapter.enTitle, esTitle: manifest.chapter.esTitle, frTitle: manifest.chapter.frTitle ?? manifest.chapter.enTitle, deTitle: manifest.chapter.deTitle ?? manifest.chapter.enTitle, ptTitle: manifest.chapter.ptTitle ?? manifest.chapter.enTitle };
      chapterId = await getChapterIdForImport(titleId, manifest.chapter.slug);
      if (chapterId) await updateDbChapter(chapterId, chapterValues); else chapterId = await createDbChapter(chapterValues);
      const zip = form.get("chapterZip");
      const pageFiles = form.getAll("pages").filter((item): item is File => item instanceof File && item.size > 0);
      let images: UploadImage[] | null = null;
      if (zip instanceof File && zip.size > 0) images = extractZipImages(Buffer.from(await zip.arrayBuffer()));
      else if (pageFiles.length > 0) images = await filesToImages(pageFiles);
      if (images) {
        const target = await getChapterMediaTarget(chapterId);
        if (!target) throw new Error("Unable to load imported chapter.");
        const uploaded = await uploadImages(target.format, chapterObjectPrefix(target.format, target.titleSlug, target.slug, target.titleCreatedAt), images);
        await replaceChapterPages(chapterId, target.chapterLocalizationId, uploaded, `${values.originalTitle} ${manifest.chapter.slug}`);
      }
      await updateDbChapter(chapterId, { ...chapterValues, publicationStatus: manifest.chapter.publicationStatus });
    }

    let published = false;
    if (manifest.publish) {
      const state = await getTitlePublishingState(titleId);
      if (!state?.ready) throw new Error(state?.reason ?? "Title is not ready to publish.");
      await publishTitle(titleId);
      published = true;
    }
    return NextResponse.json({ ok: true, titleId, chapterId, published });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 });
  }
}

function authorized(header: string | null) {
  const expected = process.env.N8N_IMPORT_API_KEY;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !token) return false;
  const left = createHash("sha256").update(token).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function titleValues(input: z.infer<typeof manifestSchema>["title"]): TitleFormValues {
  const seo = input.seo;
  return { canonicalSlug: input.canonicalSlug, originalTitle: input.originalTitle, authorName: input.authorName, originalLanguage: input.originalLanguage, format: input.format, contentRating: input.contentRating, publicationStatus: input.publicationStatus, enTitle: input.enTitle, enSlug: input.enSlug ?? input.canonicalSlug, enDescription: input.enDescription, esTitle: input.esTitle, esSlug: input.esSlug ?? input.canonicalSlug, esDescription: input.esDescription, frTitle: input.frTitle ?? input.enTitle, frSlug: input.frSlug ?? input.canonicalSlug, frDescription: input.frDescription ?? input.enDescription, deTitle: input.deTitle ?? input.enTitle, deSlug: input.deSlug ?? input.canonicalSlug, deDescription: input.deDescription ?? input.enDescription, ptTitle: input.ptTitle ?? input.enTitle, ptSlug: input.ptSlug ?? input.canonicalSlug, ptDescription: input.ptDescription ?? input.enDescription, tags: input.tags.join(", "), enSeoTitle: seo?.enTitle ?? "", enSeoDescription: seo?.enDescription ?? "", enSeoKeywords: seo?.enKeywords.join(", ") ?? "", esSeoTitle: seo?.esTitle ?? "", esSeoDescription: seo?.esDescription ?? "", esSeoKeywords: seo?.esKeywords.join(", ") ?? "", frSeoTitle: seo?.frTitle ?? "", frSeoDescription: seo?.frDescription ?? "", frSeoKeywords: seo?.frKeywords?.join(", ") ?? "", deSeoTitle: seo?.deTitle ?? "", deSeoDescription: seo?.deDescription ?? "", deSeoKeywords: seo?.deKeywords?.join(", ") ?? "", ptSeoTitle: seo?.ptTitle ?? "", ptSeoDescription: seo?.ptDescription ?? "", ptSeoKeywords: seo?.ptKeywords?.join(", ") ?? "" };
}

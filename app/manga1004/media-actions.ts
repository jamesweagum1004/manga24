"use server";

import { redirect } from "next/navigation";
import { attachCover, getChapterMediaTarget, getTitleMediaTarget, getTitlePublishingState, publishTitle, replaceChapterPages, unpublishTitle } from "@/lib/db/queries/media";
import { uploadImages } from "@/lib/media/b2-upload";
import { extractZipImages, filesToImages, type UploadImage } from "@/lib/media/zip-images";
import { chapterObjectPrefix, coverObjectPrefix } from "@/lib/media/object-key";

export async function uploadCoverAction(titleId: string, formData: FormData) {
  const setup = formData.get("setup") === "1";
  const target = await getTitleMediaTarget(titleId);
  if (!target) redirect(`/manga1004/titles?mediaError=${encodeURIComponent("Title not found.")}`);
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent("Choose a cover image.")}${setup ? "&setup=cover" : ""}`);
  try {
    const [image] = await filesToImages([file]);
    const [uploaded] = await uploadImages(target.format, coverObjectPrefix(target.format, target.slug, target.createdAt), [image], { singleFileName: "cover" });
    await attachCover(titleId, uploaded, `${target.originalTitle} cover`);
  } catch (error) {
    redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent(message(error))}${setup ? "&setup=cover" : ""}`);
  }
  redirect(`/manga1004/titles/${titleId}?mediaSaved=cover${setup ? "&setup=chapter" : ""}`);
}

export async function uploadChapterPagesAction(chapterId: string, formData: FormData) {
  const setup = formData.get("setup") === "1";
  const target = await getChapterMediaTarget(chapterId);
  if (!target) redirect(`/manga1004/chapters?mediaError=${encodeURIComponent("Chapter not found.")}`);
  try {
    const zip = formData.get("zip");
    const files = formData.getAll("pages").filter((item): item is File => item instanceof File && item.size > 0);
    let images: UploadImage[];
    if (zip instanceof File && zip.size > 0) images = extractZipImages(Buffer.from(await zip.arrayBuffer()));
    else if (files.length > 0) images = await filesToImages(files);
    else throw new Error("Choose a ZIP file or page images.");
    const uploaded = await uploadImages(target.format, chapterObjectPrefix(target.format, target.titleSlug, target.slug, target.titleCreatedAt), images);
    await replaceChapterPages(chapterId, target.chapterLocalizationId, uploaded, `${target.title} ${target.slug}`);
  } catch (error) {
    redirect(`/manga1004/chapters/${chapterId}?mediaError=${encodeURIComponent(message(error))}${setup ? "&setup=pages" : ""}`);
  }
  redirect(setup ? `/manga1004/titles/${target.titleId}?setup=seo&mediaSaved=pages` : `/manga1004/chapters/${chapterId}?mediaSaved=pages`);
}

export async function publishTitleAction(titleId: string, formData?: FormData) {
  const setup = formData?.get("setup") === "1";
  const state = await getTitlePublishingState(titleId);
  if (!state) redirect("/manga1004/titles");
  if (!state.ready) redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent(state.reason ?? "Title is not ready.")}${setup ? "&setup=seo" : ""}`);
  await publishTitle(titleId);
  redirect(`/manga1004/titles/${titleId}?mediaSaved=published${setup ? "&setup=complete" : ""}`);
}

export async function unpublishTitleAction(titleId: string) {
  await unpublishTitle(titleId);
  redirect(`/manga1004/titles/${titleId}?mediaSaved=unpublished`);
}

function message(error: unknown) { return error instanceof Error ? error.message.slice(0, 300) : "Media upload failed."; }

"use server";

import { redirect } from "next/navigation";
import { attachCover, getChapterMediaTarget, getTitleMediaTarget, getTitlePublishingState, publishTitle, replaceChapterPages } from "@/lib/db/queries/media";
import { uploadImages } from "@/lib/media/b2-upload";
import { extractZipImages, filesToImages, type UploadImage } from "@/lib/media/zip-images";

export async function uploadCoverAction(titleId: string, formData: FormData) {
  const target = await getTitleMediaTarget(titleId);
  if (!target) redirect(`/manga1004/titles?mediaError=${encodeURIComponent("Title not found.")}`);
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent("Choose a cover image.")}`);
  try {
    const [image] = await filesToImages([file]);
    const [uploaded] = await uploadImages(target.format, `titles/${target.slug}/cover`, [image]);
    await attachCover(titleId, uploaded, `${target.originalTitle} cover`);
  } catch (error) {
    redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent(message(error))}`);
  }
  redirect(`/manga1004/titles/${titleId}?mediaSaved=cover`);
}

export async function uploadChapterPagesAction(chapterId: string, formData: FormData) {
  const target = await getChapterMediaTarget(chapterId);
  if (!target) redirect(`/manga1004/chapters?mediaError=${encodeURIComponent("Chapter not found.")}`);
  try {
    const zip = formData.get("zip");
    const files = formData.getAll("pages").filter((item): item is File => item instanceof File && item.size > 0);
    let images: UploadImage[];
    if (zip instanceof File && zip.size > 0) images = extractZipImages(Buffer.from(await zip.arrayBuffer()));
    else if (files.length > 0) images = await filesToImages(files);
    else throw new Error("Choose a ZIP file or page images.");
    const uploaded = await uploadImages(target.format, `titles/${target.titleSlug}/chapters/${target.slug}`, images);
    await replaceChapterPages(chapterId, target.chapterLocalizationId, uploaded, `${target.title} ${target.slug}`);
  } catch (error) {
    redirect(`/manga1004/chapters/${chapterId}?mediaError=${encodeURIComponent(message(error))}`);
  }
  redirect(`/manga1004/chapters/${chapterId}?mediaSaved=pages`);
}

export async function publishTitleAction(titleId: string) {
  const state = await getTitlePublishingState(titleId);
  if (!state) redirect("/manga1004/titles");
  if (!state.ready) redirect(`/manga1004/titles/${titleId}?mediaError=${encodeURIComponent(state.reason ?? "Title is not ready.")}`);
  await publishTitle(titleId);
  redirect(`/manga1004/titles/${titleId}?mediaSaved=published`);
}

function message(error: unknown) { return error instanceof Error ? error.message.slice(0, 300) : "Media upload failed."; }

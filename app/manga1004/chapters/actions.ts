"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createDbChapter, deleteDbChapter, setDbChapterPublicationStatus, updateDbChapter, type ChapterFormValues } from "@/lib/db/queries/chapters";
import { getAdminChapterList } from "@/lib/data/source";
import { getPublishedChapterUrls, submitIndexNow, uniqueUrls } from "@/lib/search-indexing";

const schema = z.object({
  titleId: z.string().uuid("Choose a title."),
  chapterNumber: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "Use a number such as 1 or 12.5."),
  canonicalSlug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  publicationStatus: z.enum(["draft", "scheduled", "published", "archived"]),
  enTitle: z.string().trim().min(1).max(240),
  esTitle: z.string().trim().min(1).max(240),
  frTitle: z.string().trim().min(1).max(240),
  deTitle: z.string().trim().min(1).max(240),
  ptTitle: z.string().trim().min(1).max(240)
});

export type ChapterFormState = {
  values: ChapterFormValues;
  errors?: Partial<Record<keyof ChapterFormValues, string[]>>;
  formError?: string;
};

export async function createChapterAction(_state: ChapterFormState, formData: FormData): Promise<ChapterFormState> {
  const setup = formData.get("setup") === "1";
  const parsed = parse(formData);
  if (!parsed.success) return parsed.state;
  let id: string;
  try {
    id = await createDbChapter(parsed.data);
  } catch (error) {
    return { values: parsed.data, formError: databaseError(error) };
  }
  await updateChapterSearchDiscovery([], [id]);
  redirect(`/manga1004/chapters/${id}?saved=created${setup ? "&setup=pages" : ""}`);
}

export async function updateChapterAction(id: string, _state: ChapterFormState, formData: FormData): Promise<ChapterFormState> {
  const setup = formData.get("setup") === "1";
  const parsed = parse(formData);
  if (!parsed.success) return parsed.state;
  const previousUrls = await getPublishedChapterUrls([id]);
  try {
    await updateDbChapter(id, parsed.data);
  } catch (error) {
    return { values: parsed.data, formError: databaseError(error) };
  }
  await updateChapterSearchDiscovery(previousUrls, [id]);
  redirect(`/manga1004/chapters/${id}?saved=updated${setup ? "&setup=pages" : ""}`);
}

export async function setChapterPublicationAction(titleId: string, chapterId: string, status: "draft" | "published") {
  const previousUrls = await getPublishedChapterUrls([chapterId]);
  await setDbChapterPublicationStatus(chapterId, status);
  await updateChapterSearchDiscovery(previousUrls, [chapterId]);
  redirect(`/manga1004/titles/${titleId}?chapterSaved=${status}`);
}

export async function deleteChapterAction(titleId: string, chapterId: string) {
  const removedUrls = await getPublishedChapterUrls([chapterId]);
  await deleteDbChapter(chapterId);
  await updateChapterSearchDiscovery(removedUrls, []);
  redirect(`/manga1004/titles/${titleId}?deleted=chapter`);
}

const bulkChapterSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(300),
  action: z.enum(["published", "draft", "archived", "delete"])
});

export async function bulkChapterAction(titleId: string, formData: FormData) {
  const parsed = bulkChapterSchema.safeParse({
    ids: [...new Set(formData.getAll("chapterIds").filter((value): value is string => typeof value === "string"))],
    action: formData.get("bulkAction")
  });
  if (!parsed.success) redirect(`/manga1004/titles/${titleId}?bulkError=selection`);

  const chapters = await getAdminChapterList(titleId);
  const selected = chapters.filter((chapter) => parsed.data.ids.includes(chapter.id));
  let updated = 0;
  let skipped = parsed.data.ids.length - selected.length;
  const changedIds = selected.map((chapter) => chapter.id);
  const previousUrls = await getPublishedChapterUrls(changedIds);

  for (const chapter of selected) {
    if (parsed.data.action === "published" && chapter.pageCount === 0) {
      skipped += 1;
      continue;
    }
    if (parsed.data.action === "delete") await deleteDbChapter(chapter.id);
    else await setDbChapterPublicationStatus(chapter.id, parsed.data.action);
    updated += 1;
  }

  await updateChapterSearchDiscovery(previousUrls, parsed.data.action === "delete" ? [] : changedIds);

  redirect(`/manga1004/titles/${titleId}?bulk=${parsed.data.action}&changed=${updated}&skipped=${skipped}`);
}

async function updateChapterSearchDiscovery(previousUrls: string[], currentChapterIds: string[]) {
  const currentUrls = await getPublishedChapterUrls(currentChapterIds);
  revalidatePath("/sitemap.xml");
  revalidateTag("public-catalog");
  await submitIndexNow(uniqueUrls([...previousUrls, ...currentUrls]));
}

function parse(formData: FormData) {
  const values = Object.fromEntries(["titleId", "chapterNumber", "canonicalSlug", "publicationStatus", "enTitle", "esTitle", "frTitle", "deTitle", "ptTitle"].map((key) => [key, formData.get(key)]));
  const result = schema.safeParse(values);
  return result.success
    ? { success: true as const, data: result.data }
    : { success: false as const, state: { values: values as ChapterFormValues, errors: result.error.flatten().fieldErrors } };
}

function databaseError(error: unknown) {
  if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
    return "This title already has a chapter with the same number or slug.";
  }
  return error instanceof Error ? error.message : "Unable to save chapter.";
}

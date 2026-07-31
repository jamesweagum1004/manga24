"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDbChapter, updateDbChapter, type ChapterFormValues } from "@/lib/db/queries/chapters";

const schema = z.object({
  titleId: z.string().uuid("Choose a title."),
  chapterNumber: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "Use a number such as 1 or 12.5."),
  canonicalSlug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  publicationStatus: z.enum(["draft", "scheduled", "published", "archived"]),
  enTitle: z.string().trim().min(1).max(240),
  esTitle: z.string().trim().min(1).max(240)
});

export type ChapterFormState = {
  values: ChapterFormValues;
  errors?: Partial<Record<keyof ChapterFormValues, string[]>>;
  formError?: string;
};

export async function createChapterAction(_state: ChapterFormState, formData: FormData): Promise<ChapterFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return parsed.state;
  let id: string;
  try {
    id = await createDbChapter(parsed.data);
  } catch (error) {
    return { values: parsed.data, formError: databaseError(error) };
  }
  redirect(`/manga1004/chapters/${id}?saved=created`);
}

export async function updateChapterAction(id: string, _state: ChapterFormState, formData: FormData): Promise<ChapterFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return parsed.state;
  try {
    await updateDbChapter(id, parsed.data);
  } catch (error) {
    return { values: parsed.data, formError: databaseError(error) };
  }
  redirect(`/manga1004/chapters/${id}?saved=updated`);
}

function parse(formData: FormData) {
  const values = Object.fromEntries(["titleId", "chapterNumber", "canonicalSlug", "publicationStatus", "enTitle", "esTitle"].map((key) => [key, formData.get(key)]));
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

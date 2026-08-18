"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDbTitle, deleteDbTitle, updateDbTitle, updateDbTitlesPublicationStatus, type TitleFormValues } from "@/lib/db/queries/titles";
import { databaseNotConfiguredMessage, isDatabaseConfigured } from "@/lib/data/source";
import { locales } from "@/lib/i18n";
import { getTitlePublishingState, publishTitle, unpublishTitle } from "@/lib/db/queries/media";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(180, "Slug must be 180 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`);

const tagListSchema = z
  .string()
  .trim()
  .max(1000, "Tags must be 1000 characters or fewer.")
  .refine(
    (value) =>
      value.length === 0 ||
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .every((tag) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)),
    "Use comma-separated lowercase slugs, such as romance, slice-of-life."
  );

const titleFormSchema = z.object({
  canonicalSlug: slugSchema,
  originalTitle: requiredText("Original title", 240),
  authorName: requiredText("Author name", 160),
  originalLanguage: requiredText("Original language", 16),
  displayLocales: z.array(z.enum(locales)).min(1, "Choose at least one display language."),
  contentRating: z.enum(["safe", "mature_18"], "Choose a content rating."),
  publicationStatus: z.enum(["ongoing", "completed", "hiatus", "cancelled"], "Choose a publication status."),
  format: z.enum(["manga", "manhwa"], "Choose Manga or Manhwa."),
  enTitle: requiredText("English title", 240),
  enSlug: slugSchema,
  enDescription: requiredText("English description", 4000),
  esTitle: requiredText("Spanish title", 240),
  esSlug: slugSchema,
  esDescription: requiredText("Spanish description", 4000),
  enSeoTitle: z.string().trim().max(70, "English SEO title must be 70 characters or fewer."),
  enSeoDescription: z.string().trim().max(170, "English SEO description must be 170 characters or fewer."),
  enSeoKeywords: z.string().trim().max(500, "English SEO keywords must be 500 characters or fewer."),
  esSeoTitle: z.string().trim().max(70, "Spanish SEO title must be 70 characters or fewer."),
  esSeoDescription: z.string().trim().max(170, "Spanish SEO description must be 170 characters or fewer."),
  esSeoKeywords: z.string().trim().max(500, "Spanish SEO keywords must be 500 characters or fewer."),
  frTitle: requiredText("French title", 240), frSlug: slugSchema, frDescription: requiredText("French description", 4000),
  frSeoTitle: z.string().trim().max(70), frSeoDescription: z.string().trim().max(170), frSeoKeywords: z.string().trim().max(500),
  deTitle: requiredText("German title", 240), deSlug: slugSchema, deDescription: requiredText("German description", 4000),
  deSeoTitle: z.string().trim().max(70), deSeoDescription: z.string().trim().max(170), deSeoKeywords: z.string().trim().max(500),
  ptTitle: requiredText("Portuguese title", 240), ptSlug: slugSchema, ptDescription: requiredText("Portuguese description", 4000),
  ptSeoTitle: z.string().trim().max(70), ptSeoDescription: z.string().trim().max(170), ptSeoKeywords: z.string().trim().max(500),
  tags: tagListSchema
});

export type TitleFormState = {
  values: TitleFormValues;
  errors?: Partial<Record<keyof TitleFormValues, string[]>>;
  formError?: string;
};

export async function createTitleAction(_state: TitleFormState, formData: FormData): Promise<TitleFormState> {
  const parsed = parseTitleForm(formData);
  if (!parsed.success) {
    return parsed.state;
  }

  if (!isDatabaseConfigured()) {
    return {
      values: parsed.values,
      formError: databaseNotConfiguredMessage
    };
  }

  let id: string;
  try {
    id = await createDbTitle(parsed.values);
  } catch (error) {
    return {
      values: parsed.values,
      formError: getDatabaseWriteError(error)
    };
  }

  redirect(`/manga1004/titles/${id}`);
}

export async function updateTitleAction(
  id: string,
  _state: TitleFormState,
  formData: FormData
): Promise<TitleFormState> {
  const parsed = parseTitleForm(formData);
  if (!parsed.success) {
    return parsed.state;
  }

  if (!isDatabaseConfigured()) {
    return {
      values: parsed.values,
      formError: databaseNotConfiguredMessage
    };
  }

  try {
    await updateDbTitle(id, parsed.values);
  } catch (error) {
    return {
      values: parsed.values,
      formError: getDatabaseWriteError(error)
    };
  }

  redirect(`/manga1004/titles/${id}`);
}

export async function deleteTitleAction(id: string) {
  if (!isDatabaseConfigured()) redirect("/manga1004/titles");
  await deleteDbTitle(id);
  redirect("/manga1004/titles?deleted=title");
}

const bulkTitleSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["publish", "unpublish", "ongoing", "completed", "hiatus", "cancelled", "delete"])
});

export async function bulkTitleAction(formData: FormData) {
  const parsed = bulkTitleSchema.safeParse({
    ids: [...new Set(formData.getAll("titleIds").filter((value): value is string => typeof value === "string"))],
    action: formData.get("bulkAction")
  });
  if (!parsed.success || !isDatabaseConfigured()) redirect("/manga1004/titles?bulkError=selection");

  const { ids, action } = parsed.data;
  let updated = 0;
  let skipped = 0;

  if (action === "publish") {
    for (const id of ids) {
      const state = await getTitlePublishingState(id);
      if (!state?.ready) {
        skipped += 1;
        continue;
      }
      await publishTitle(id);
      updated += 1;
    }
  } else if (action === "unpublish") {
    await Promise.all(ids.map((id) => unpublishTitle(id)));
    updated = ids.length;
  } else if (action === "delete") {
    for (const id of ids) await deleteDbTitle(id);
    updated = ids.length;
  } else {
    await updateDbTitlesPublicationStatus(ids, action);
    updated = ids.length;
  }

  redirect(`/manga1004/titles?bulk=${action}&changed=${updated}&skipped=${skipped}`);
}

function parseTitleForm(formData: FormData) {
  const values = {
    canonicalSlug: getFormValue(formData, "canonicalSlug"),
    originalTitle: getFormValue(formData, "originalTitle"),
    authorName: getFormValue(formData, "authorName"),
    originalLanguage: getFormValue(formData, "originalLanguage"),
    displayLocales: locales.filter((locale) => formData.get(`displayLocale_${locale}`) === "on"),
    contentRating: getFormValue(formData, "contentRating"),
    publicationStatus: getFormValue(formData, "publicationStatus"),
    format: getFormValue(formData, "format"),
    enTitle: getFormValue(formData, "enTitle"),
    enSlug: getFormValue(formData, "enSlug"),
    enDescription: getFormValue(formData, "enDescription"),
    esTitle: getFormValue(formData, "esTitle"),
    esSlug: getFormValue(formData, "esSlug"),
    esDescription: getFormValue(formData, "esDescription"),
    enSeoTitle: getFormValue(formData, "enSeoTitle"),
    enSeoDescription: getFormValue(formData, "enSeoDescription"),
    enSeoKeywords: getFormValue(formData, "enSeoKeywords"),
    esSeoTitle: getFormValue(formData, "esSeoTitle"),
    esSeoDescription: getFormValue(formData, "esSeoDescription"),
    esSeoKeywords: getFormValue(formData, "esSeoKeywords"),
    frTitle: getFormValue(formData, "frTitle"), frSlug: getFormValue(formData, "frSlug"), frDescription: getFormValue(formData, "frDescription"),
    frSeoTitle: getFormValue(formData, "frSeoTitle"), frSeoDescription: getFormValue(formData, "frSeoDescription"), frSeoKeywords: getFormValue(formData, "frSeoKeywords"),
    deTitle: getFormValue(formData, "deTitle"), deSlug: getFormValue(formData, "deSlug"), deDescription: getFormValue(formData, "deDescription"),
    deSeoTitle: getFormValue(formData, "deSeoTitle"), deSeoDescription: getFormValue(formData, "deSeoDescription"), deSeoKeywords: getFormValue(formData, "deSeoKeywords"),
    ptTitle: getFormValue(formData, "ptTitle"), ptSlug: getFormValue(formData, "ptSlug"), ptDescription: getFormValue(formData, "ptDescription"),
    ptSeoTitle: getFormValue(formData, "ptSeoTitle"), ptSeoDescription: getFormValue(formData, "ptSeoDescription"), ptSeoKeywords: getFormValue(formData, "ptSeoKeywords"),
    tags: getFormValue(formData, "tags")
  };
  const result = titleFormSchema.safeParse(values);

  if (!result.success) {
    return {
      success: false as const,
      state: {
        values: values as TitleFormValues,
        errors: result.error.flatten().fieldErrors
      }
    };
  }

  return {
    success: true as const,
    values: result.data
  };
}

function getFormValue(formData: FormData, key: Exclude<keyof TitleFormValues, "displayLocales">) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getDatabaseWriteError(error: unknown) {
  if (isUniqueViolation(error)) {
    return "A title or localization with that slug already exists.";
  }

  return error instanceof Error ? error.message : "Unable to save title.";
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

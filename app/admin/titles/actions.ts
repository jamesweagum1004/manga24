"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDbTitle, updateDbTitle, type TitleFormValues } from "@/lib/db/queries/titles";
import { databaseNotConfiguredMessage, isDatabaseConfigured } from "@/lib/data/source";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(180, "Slug must be 180 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`);

const titleFormSchema = z.object({
  canonicalSlug: slugSchema,
  originalTitle: requiredText("Original title", 240),
  authorName: requiredText("Author name", 160),
  originalLanguage: requiredText("Original language", 16),
  contentRating: z.enum(["safe", "mature_18"], "Choose a content rating."),
  publicationStatus: z.enum(["ongoing", "completed", "hiatus", "cancelled"], "Choose a publication status."),
  enTitle: requiredText("English title", 240),
  enSlug: slugSchema,
  enDescription: requiredText("English description", 4000),
  esTitle: requiredText("Spanish title", 240),
  esSlug: slugSchema,
  esDescription: requiredText("Spanish description", 4000)
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

  redirect(`/admin/titles/${id}`);
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

  redirect(`/admin/titles/${id}`);
}

function parseTitleForm(formData: FormData) {
  const values = {
    canonicalSlug: getFormValue(formData, "canonicalSlug"),
    originalTitle: getFormValue(formData, "originalTitle"),
    authorName: getFormValue(formData, "authorName"),
    originalLanguage: getFormValue(formData, "originalLanguage"),
    contentRating: getFormValue(formData, "contentRating"),
    publicationStatus: getFormValue(formData, "publicationStatus"),
    enTitle: getFormValue(formData, "enTitle"),
    enSlug: getFormValue(formData, "enSlug"),
    enDescription: getFormValue(formData, "enDescription"),
    esTitle: getFormValue(formData, "esTitle"),
    esSlug: getFormValue(formData, "esSlug"),
    esDescription: getFormValue(formData, "esDescription")
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

function getFormValue(formData: FormData, key: keyof TitleFormValues) {
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

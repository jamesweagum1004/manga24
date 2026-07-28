"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { databaseNotConfiguredMessage, isDatabaseConfigured } from "@/lib/data/source";
import { createDbTag, type TagFormValues } from "@/lib/db/queries/tags";

const tagFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(120, "Slug must be 120 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120, "Name must be 120 characters or fewer."),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(80, "Category must be 80 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.")
});

export type TagFormState = {
  values: TagFormValues;
  errors?: Partial<Record<keyof TagFormValues, string[]>>;
  formError?: string;
};

export async function createTagAction(_state: TagFormState, formData: FormData): Promise<TagFormState> {
  const parsed = tagFormSchema.safeParse({
    slug: getFormValue(formData, "slug"),
    name: getFormValue(formData, "name"),
    category: getFormValue(formData, "category")
  });

  if (!parsed.success) {
    return {
      values: {
        slug: getFormValue(formData, "slug"),
        name: getFormValue(formData, "name"),
        category: getFormValue(formData, "category")
      },
      errors: parsed.error.flatten().fieldErrors
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      values: parsed.data,
      formError: databaseNotConfiguredMessage
    };
  }

  try {
    await createDbTag(parsed.data);
  } catch (error) {
    return {
      values: parsed.data,
      formError: error instanceof Error ? error.message : "Unable to save tag."
    };
  }

  redirect("/admin/tags");
}

function getFormValue(formData: FormData, key: keyof TagFormValues) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

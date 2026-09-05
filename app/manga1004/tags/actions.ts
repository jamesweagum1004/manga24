"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { databaseNotConfiguredMessage, isDatabaseConfigured } from "@/lib/data/source";
import { createDbTag, listDbPendingTagTranslations, replaceDbTags, updateDbTagTranslations, type TagFormValues } from "@/lib/db/queries/tags";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { generateTagTranslations } from "@/lib/deepseek/seo";

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
    const id = await createDbTag(parsed.data);
    await translateTag(id, parsed.data.slug, parsed.data.name);
  } catch (error) {
    return {
      values: parsed.data,
      formError: error instanceof Error ? error.message : "Unable to save tag."
    };
  }

  redirect("/manga1004/tags");
}

export async function updateTagAction(slug: string, formData: FormData) {
  const parsed = tagFormSchema.safeParse({ slug, name: formData.get("name"), category: formData.get("category") });
  if (!parsed.success || !isDatabaseConfigured()) redirect("/manga1004/tags?error=edit");
  try {
    const id = await createDbTag(parsed.data);
    await translateTag(id, parsed.data.slug, parsed.data.name);
  } catch (error) {
    console.error("Tag update or translation failed", { slug, error });
    redirect("/manga1004/tags?error=edit");
  }
  revalidateTag("public-catalog");
  revalidatePath("/", "layout");
  redirect("/manga1004/tags?updated=1");
}

async function translateTag(id: string, slug: string, name: string) {
  const settings = await getSiteSettings();
  const [generated] = await generateTagTranslations([{ slug, name }], settings.deepseekModel);
  if (!generated) throw new Error("DeepSeek did not return the tag translation.");
  await updateDbTagTranslations(id, generated);
}

export async function replaceTagsAction(formData: FormData) {
  const sourceSlugs = String(formData.get("sourceSlugs") ?? "").split(",").map((slug) => slug.trim().toLowerCase()).filter(Boolean);
  const parsed = z.object({
    sourceSlugs: z.array(tagFormSchema.shape.slug).min(1).max(50),
    replacementSlug: tagFormSchema.shape.slug,
    replacementName: tagFormSchema.shape.name,
    replacementCategory: tagFormSchema.shape.category
  }).safeParse({ sourceSlugs, replacementSlug: formData.get("replacementSlug"), replacementName: formData.get("replacementName"), replacementCategory: formData.get("replacementCategory") });
  if (!parsed.success || !isDatabaseConfigured()) redirect("/manga1004/tags?error=replace");
  let result: Awaited<ReturnType<typeof replaceDbTags>>;
  try {
    result = await replaceDbTags(parsed.data.sourceSlugs, { slug: parsed.data.replacementSlug, name: parsed.data.replacementName, category: parsed.data.replacementCategory });
  } catch {
    redirect("/manga1004/tags?error=replace");
  }
  redirect(`/manga1004/tags?replaced=${result.tagsReplaced}&titles=${result.titlesUpdated}`);
}

export async function translatePendingTagsAction() {
  if (!isDatabaseConfigured()) redirect("/manga1004/tags?error=translate");
  const pending = await listDbPendingTagTranslations(40);
  const settings = await getSiteSettings();
  let translated = 0;
  let failed = 0;
  for (let offset = 0; offset < pending.length; offset += 40) {
    const batch = pending.slice(offset, offset + 40);
    try {
      const generated = await generateTagTranslations(batch.map(({ slug, name }) => ({ slug, name })), settings.deepseekModel);
      const bySlug = new Map(generated.map((item) => [item.slug, item]));
      for (const tag of batch) {
        const item = bySlug.get(tag.slug);
        if (!item) { failed += 1; continue; }
        await updateDbTagTranslations(tag.id, item);
        translated += 1;
      }
    } catch (error) {
      failed += batch.length;
      console.error("Tag translation batch failed", { slugs: batch.map((tag) => tag.slug), error });
    }
  }
  revalidateTag("public-catalog");
  revalidatePath("/", "layout");
  redirect(`/manga1004/tags?translation=pending&translated=${translated}&failed=${failed}`);
}

function getFormValue(formData: FormData, key: keyof TagFormValues) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

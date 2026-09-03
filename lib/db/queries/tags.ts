import { asc, eq, inArray, isNull } from "drizzle-orm";
import { tags, titleTags } from "@/db/schema";
import type { DemoTag } from "@/lib/demo-data";
import { getDb } from "../client";

export type AdminTagListItem = {
  id: string;
  slug: string;
  name: string;
  nameEs: string;
  nameFr: string | null;
  nameDe: string | null;
  namePt: string | null;
  translationsGeneratedAt: Date | null;
  category: string;
};

export type TagFormValues = {
  slug: string;
  name: string;
  category: string;
};

export type PublicTagListItem = {
  slug: string;
  nameEn: string;
  nameEs: string;
  nameFr: string | null;
  nameDe: string | null;
  namePt: string | null;
  category: string;
};

export const emptyTagFormValues: TagFormValues = {
  slug: "",
  name: "",
  category: "genre"
};

export async function listDbAdminTags(): Promise<AdminTagListItem[]> {
  const rows = await getDb()
    .select({
      id: tags.id,
      slug: tags.slug,
      name: tags.nameEn,
      nameEs: tags.nameEs,
      nameFr: tags.nameFr,
      nameDe: tags.nameDe,
      namePt: tags.namePt,
      translationsGeneratedAt: tags.translationsGeneratedAt,
      category: tags.category
    })
    .from(tags)
    .orderBy(asc(tags.category), asc(tags.slug));

  return rows;
}

export async function listDbPublicTags(): Promise<PublicTagListItem[]> {
  return getDb()
    .select({ slug: tags.slug, nameEn: tags.nameEn, nameEs: tags.nameEs, nameFr: tags.nameFr, nameDe: tags.nameDe, namePt: tags.namePt, category: tags.category })
    .from(tags)
    .orderBy(asc(tags.nameEn));
}

export async function createDbTag(values: TagFormValues) {
  const [tag] = await getDb()
    .insert(tags)
    .values({
      slug: values.slug,
      nameEn: values.name,
      nameEs: values.name,
      category: values.category
    })
    .onConflictDoUpdate({
      target: tags.slug,
      set: {
        nameEn: values.name,
        nameEs: values.name,
        nameFr: null,
        nameDe: null,
        namePt: null,
        translationsGeneratedAt: null,
        category: values.category,
        updatedAt: new Date()
      }
    })
    .returning({ id: tags.id });

  return tag.id;
}

export async function getDbTagBySlug(slug: string) {
  const [tag] = await getDb().select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return tag ?? null;
}

export async function replaceDbTags(sourceSlugs: string[], replacement: TagFormValues) {
  return getDb().transaction(async (transaction) => {
    const [target] = await transaction.insert(tags).values({
      slug: replacement.slug,
      nameEn: replacement.name,
      nameEs: replacement.name,
      nameFr: null,
      nameDe: null,
      namePt: null,
      translationsGeneratedAt: null,
      category: replacement.category
    }).onConflictDoUpdate({
      target: tags.slug,
      set: { nameEn: replacement.name, nameEs: replacement.name, nameFr: null, nameDe: null, namePt: null, translationsGeneratedAt: null, category: replacement.category, updatedAt: new Date() }
    }).returning({ id: tags.id });

    const uniqueSources = [...new Set(sourceSlugs)].filter((slug) => slug !== replacement.slug);
    if (uniqueSources.length === 0) return { tagsReplaced: 0, titlesUpdated: 0 };
    const sourceTags = await transaction.select({ id: tags.id }).from(tags).where(inArray(tags.slug, uniqueSources));
    if (sourceTags.length === 0) return { tagsReplaced: 0, titlesUpdated: 0 };
    const sourceIds = sourceTags.map((tag) => tag.id);
    const relations = await transaction.select({ titleId: titleTags.titleId }).from(titleTags).where(inArray(titleTags.tagId, sourceIds));
    const titleIds = [...new Set(relations.map((relation) => relation.titleId))];
    if (titleIds.length > 0) {
      await transaction.insert(titleTags).values(titleIds.map((titleId) => ({ titleId, tagId: target.id }))).onConflictDoNothing();
    }
    await transaction.delete(titleTags).where(inArray(titleTags.tagId, sourceIds));
    await transaction.delete(tags).where(inArray(tags.id, sourceIds));
    return { tagsReplaced: sourceTags.length, titlesUpdated: titleIds.length };
  });
}

export async function listDbPendingTagTranslations(limit = 100) {
  return getDb().select({ id: tags.id, slug: tags.slug, name: tags.nameEn })
    .from(tags)
    .where(isNull(tags.translationsGeneratedAt))
    .orderBy(asc(tags.slug))
    .limit(limit);
}

export async function updateDbTagTranslations(id: string, values: { es: string; fr: string; de: string; pt: string }) {
  await getDb().update(tags).set({
    nameEs: values.es,
    nameFr: values.fr,
    nameDe: values.de,
    namePt: values.pt,
    translationsGeneratedAt: new Date(),
    updatedAt: new Date()
  }).where(eq(tags.id, id));
}

export function adminTagListFromDemoTags(demoTags: DemoTag[]): AdminTagListItem[] {
  return demoTags.map((tag) => ({
    id: tag.slug,
    slug: tag.slug,
    name: tag.names.en,
    nameEs: tag.names.es,
    nameFr: tag.names.fr,
    nameDe: tag.names.de,
    namePt: tag.names.pt,
    translationsGeneratedAt: new Date(),
    category: "genre"
  }));
}

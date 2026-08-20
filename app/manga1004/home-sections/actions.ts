"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSiteSettings, updateHomeSections } from "@/lib/db/queries/settings";
import { homeSectionSources } from "@/lib/home-sections";

const schema = z.object({ title: z.string().trim().min(1).max(80), subtitle: z.string().trim().max(80), source: z.enum(homeSectionSources), tag: z.string().trim().toLowerCase().max(80).refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)), itemCount: z.coerce.number().int().min(1).max(30), enabled: z.boolean() });

export async function createHomeSectionAction(formData: FormData) {
  const parsed = parse(formData);
  if (!parsed.success) redirect("/manga1004/home-sections?error=fields");
  const settings = await getSiteSettings();
  const id = `${slugify(parsed.data.title) || "section"}-${Date.now().toString(36)}`;
  await updateHomeSections([...settings.homeSections, { id, ...parsed.data }]);
  redirect("/manga1004/home-sections?saved=created");
}

export async function updateHomeSectionAction(id: string, formData: FormData) {
  const parsed = parse(formData);
  if (!parsed.success) redirect("/manga1004/home-sections?error=fields");
  const settings = await getSiteSettings();
  await updateHomeSections(settings.homeSections.map((section) => section.id === id ? { id, ...parsed.data } : section));
  redirect("/manga1004/home-sections?saved=updated");
}

export async function deleteHomeSectionAction(id: string) {
  const settings = await getSiteSettings();
  const remaining = settings.homeSections.filter((section) => section.id !== id);
  if (remaining.length === 0) redirect("/manga1004/home-sections?error=last-section");
  await updateHomeSections(remaining);
  redirect("/manga1004/home-sections?saved=deleted");
}

function parse(formData: FormData) { return schema.safeParse({ title: formData.get("title"), subtitle: formData.get("subtitle"), source: formData.get("source"), tag: formData.get("tag"), itemCount: formData.get("itemCount"), enabled: formData.get("enabled") === "on" }); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 50); }

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSiteSettings, updateHomeSections } from "@/lib/db/queries/settings";
import { homeSectionSources, popularityPeriods } from "@/lib/home-sections";
import { generateHomeSectionTranslations } from "@/lib/deepseek/seo";

const schema = z.object({ title: z.string().trim().min(1).max(80), subtitle: z.string().trim().max(80), source: z.enum(homeSectionSources), tag: z.string().trim().toLowerCase().max(80).refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)), itemCount: z.coerce.number().int().min(1).max(30), popularityPeriod: z.enum(popularityPeriods), customHours: z.coerce.number().int().min(1).max(168), enabled: z.boolean() });

export async function createHomeSectionAction(formData: FormData) {
  const parsed = parse(formData);
  if (!parsed.success) redirect("/manga1004/home-sections?error=fields");
  const settings = await getSiteSettings();
  const id = `${slugify(parsed.data.title) || "section"}-${Date.now().toString(36)}`;
  const localizations = await translate(parsed.data.title, parsed.data.subtitle, settings.deepseekModel);
  await updateHomeSections([...settings.homeSections, { id, ...parsed.data, localizations }]);
  redirect("/manga1004/home-sections?saved=created");
}

export async function updateHomeSectionAction(id: string, formData: FormData) {
  const parsed = parse(formData);
  if (!parsed.success) redirect("/manga1004/home-sections?error=fields");
  const settings = await getSiteSettings();
  const localizations = await translate(parsed.data.title, parsed.data.subtitle, settings.deepseekModel);
  await updateHomeSections(settings.homeSections.map((section) => section.id === id ? { id, ...parsed.data, localizations } : section));
  redirect("/manga1004/home-sections?saved=updated");
}

export async function deleteHomeSectionAction(id: string) {
  const settings = await getSiteSettings();
  const remaining = settings.homeSections.filter((section) => section.id !== id);
  if (remaining.length === 0) redirect("/manga1004/home-sections?error=last-section");
  await updateHomeSections(remaining);
  redirect("/manga1004/home-sections?saved=deleted");
}

export async function moveHomeSectionAction(id: string, direction: "up" | "down") {
  const settings = await getSiteSettings();
  const currentIndex = settings.homeSections.findIndex((section) => section.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= settings.homeSections.length) {
    redirect("/manga1004/home-sections?error=order");
  }
  const reordered = [...settings.homeSections];
  [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
  await updateHomeSections(reordered);
  redirect("/manga1004/home-sections?saved=moved");
}

export async function translateHomeSectionsAction() {
  const settings = await getSiteSettings();
  const translated = [];
  for (const section of settings.homeSections) translated.push({ ...section, localizations: await translate(section.title, section.subtitle, settings.deepseekModel) });
  await updateHomeSections(translated);
  redirect("/manga1004/home-sections?saved=translated");
}

async function translate(title: string, subtitle: string, model: Awaited<ReturnType<typeof getSiteSettings>>["deepseekModel"]) {
  const generated = await generateHomeSectionTranslations({ title, subtitle }, model);
  return { en: { title, subtitle }, ...generated };
}

function parse(formData: FormData) { return schema.safeParse({ title: formData.get("title"), subtitle: formData.get("subtitle"), source: formData.get("source"), tag: formData.get("tag"), itemCount: formData.get("itemCount"), popularityPeriod: formData.get("popularityPeriod"), customHours: formData.get("customHours"), enabled: formData.get("enabled") === "on" }); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 50); }

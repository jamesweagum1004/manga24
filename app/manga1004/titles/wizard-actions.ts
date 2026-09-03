"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDbTitle } from "@/lib/db/queries/titles";
import { displayLocalesForOriginalLanguage, locales } from "@/lib/i18n";

const schema = z.object({ originalTitle: z.string().trim().min(1).max(240), authorName: z.string().trim().min(1).max(160), originalLanguage: z.string().trim().min(2).max(16), format: z.enum(["manga", "manhwa"]), contentRating: z.enum(["safe", "mature_18"]), publicationStatus: z.enum(["ongoing", "completed", "hiatus", "cancelled"]), description: z.string().trim().min(10).max(4000), tags: z.string().trim().max(1000) });
export type QuickTitleState = { error?: string };

export async function createTitleWizardAction(_state: QuickTitleState, formData: FormData): Promise<QuickTitleState> {
  const parsed = schema.safeParse(Object.fromEntries(["originalTitle", "authorName", "originalLanguage", "format", "contentRating", "publicationStatus", "description", "tags"].map((key) => [key, formData.get(key)])));
  if (!parsed.success) return { error: "Complete the required fields. The description must be at least 10 characters." };
  const value = parsed.data;
  const canonicalSlug = slugify(value.originalTitle) || `title-${randomBytes(4).toString("hex")}`;
  try {
    const id = await createDbTitle({ canonicalSlug, originalTitle: value.originalTitle, authorName: value.authorName, originalLanguage: value.originalLanguage, displayLocales: displayLocalesForOriginalLanguage(value.originalLanguage, [...locales]), format: value.format, contentRating: value.contentRating, publicationStatus: value.publicationStatus, enTitle: value.originalTitle, enSlug: canonicalSlug, enDescription: value.description, esTitle: value.originalTitle, esSlug: canonicalSlug, esDescription: value.description, frTitle: value.originalTitle, frSlug: canonicalSlug, frDescription: value.description, deTitle: value.originalTitle, deSlug: canonicalSlug, deDescription: value.description, ptTitle: value.originalTitle, ptSlug: canonicalSlug, ptDescription: value.description, enSeoTitle: "", enSeoDescription: "", enSeoKeywords: "", esSeoTitle: "", esSeoDescription: "", esSeoKeywords: "", frSeoTitle: "", frSeoDescription: "", frSeoKeywords: "", deSeoTitle: "", deSeoDescription: "", deSeoKeywords: "", ptSeoTitle: "", ptSeoDescription: "", ptSeoKeywords: "", tags: value.tags });
    redirect(`/manga1004/titles/${id}?setup=cover`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: error instanceof Error ? error.message : "Unable to create title." };
  }
}

function slugify(value: string) { return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 180); }
function isRedirect(error: unknown) { return (error instanceof Error && error.message === "NEXT_REDIRECT") || (typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")); }

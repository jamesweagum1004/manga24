"use server";

import { redirect } from "next/navigation";
import { getAdminTitleById } from "@/lib/data/source";
import { generateTitleSeo } from "@/lib/deepseek/seo";
import { updateDbTitleSeo } from "@/lib/db/queries/titles";

export async function generateSeoAction(id: string) {
  const title = await getAdminTitleById(id);
  if (!title) {
    redirect("/not-found");
  }

  try {
    const seo = await generateTitleSeo(title.values);
    await updateDbTitleSeo(title.id, seo);
  } catch (error) {
    const message = getSeoErrorMessage(error);
    redirect(`/manga1004/titles/${encodeURIComponent(id)}?seoError=${encodeURIComponent(message)}`);
  }

  redirect(`/manga1004/titles/${encodeURIComponent(id)}?seoGenerated=1`);
}

function getSeoErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unable to generate SEO metadata.";
  if (error.message === "DEEPSEEK_API_KEY is not configured.") return error.message;
  if (error.message.startsWith("DeepSeek request failed")) return error.message;
  if (error.message === "DeepSeek returned an empty response.") return error.message;
  return "DeepSeek returned invalid SEO metadata. Please try again.";
}

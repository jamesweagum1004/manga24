import "server-only";
import { z } from "zod";
import type { TitleFormValues } from "@/lib/db/queries/titles";
import type { DeepSeekModel } from "@/lib/db/queries/settings";

const localeSeoSchema = z.object({
  title: z.string().trim().min(1).transform((value) => value.slice(0, 70)),
  description: z.string().trim().min(1).transform((value) => value.slice(0, 170)),
  keywords: z
    .union([z.array(z.string()), z.string()])
    .transform((value) => (Array.isArray(value) ? value : value.split(",")))
    .transform((keywords) =>
      [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))].slice(0, 10)
    )
    .refine((keywords) => keywords.length > 0, "At least one keyword is required.")
});

const generatedSeoSchema = z.object({
  en: localeSeoSchema,
  es: localeSeoSchema,
  fr: localeSeoSchema,
  de: localeSeoSchema,
  pt: localeSeoSchema
});

const localeContentSchema = localeSeoSchema.extend({
  catalogDescription: z.string().trim().min(40).transform((value) => value.slice(0, 1200))
});

const generatedContentSchema = z.object({
  en: localeContentSchema,
  es: localeContentSchema,
  fr: localeContentSchema,
  de: localeContentSchema,
  pt: localeContentSchema
});

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1)
});

export type GeneratedTitleSeo = z.infer<typeof generatedSeoSchema>;
export type GeneratedTitleContent = z.infer<typeof generatedContentSchema>;

export async function generateTitleSeo(values: TitleFormValues, model: DeepSeekModel): Promise<GeneratedTitleSeo> {
  return generatedSeoSchema.parse(await requestDeepSeek(values, model, false));
}

export async function generateTitleContent(values: TitleFormValues, model: DeepSeekModel): Promise<GeneratedTitleContent> {
  return generatedContentSchema.parse(await requestDeepSeek(values, model, true));
}

async function requestDeepSeek(values: TitleFormValues, model: DeepSeekModel, includeCatalogDescription: boolean) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You create accurate multilingual catalog copy and SEO metadata for a legal, licensed manga catalog. Return JSON only. Do not invent plot facts, awards, availability, creators, or claims. Avoid graphic or explicit wording. Keep SEO titles under 60 characters when practical and SEO descriptions between 120 and 160 characters. Output exactly five keys: en, es, fr, de, pt. Each key must contain title, description, keywords${includeCatalogDescription ? ", and catalogDescription (a natural 2-4 sentence catalog summary based only on supplied facts)" : ""}.`
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: includeCatalogDescription ? "Rewrite catalog descriptions and generate SEO metadata using only the supplied catalog facts." : "Generate SEO metadata in JSON from only the supplied catalog facts.",
            originalTitle: values.originalTitle,
            author: values.authorName,
            originalLanguage: values.originalLanguage,
            status: values.publicationStatus,
            contentRating: values.contentRating,
            tags: values.tags,
            english: { title: values.enTitle, description: values.enDescription },
            spanish: { title: values.esTitle, description: values.esDescription },
            french: { title: values.frTitle, description: values.frDescription },
            german: { title: values.deTitle, description: values.deDescription },
            portuguese: { title: values.ptTitle, description: values.ptDescription }
          })
        }
      ]
    }),
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed (${response.status}).`);
  }

  const completion = completionSchema.parse(await response.json());
  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return JSON.parse(stripJsonFence(content)) as unknown;
}

function stripJsonFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
}

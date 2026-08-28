import "server-only";
import { z } from "zod";
import type { TitleFormValues } from "@/lib/db/queries/titles";
import type { DeepSeekModel } from "@/lib/db/queries/settings";
import { localeLabels, locales, type Locale } from "@/lib/i18n";

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
  en: localeSeoSchema.optional(),
  es: localeSeoSchema.optional(),
  fr: localeSeoSchema.optional(),
  de: localeSeoSchema.optional(),
  pt: localeSeoSchema.optional()
});

const localeContentSchema = localeSeoSchema.extend({
  catalogDescription: z.string().trim().min(40).transform((value) => value.slice(0, 1200))
});

const generatedContentSchema = z.object({
  en: localeContentSchema.optional(),
  es: localeContentSchema.optional(),
  fr: localeContentSchema.optional(),
  de: localeContentSchema.optional(),
  pt: localeContentSchema.optional()
});

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1)
});

export type GeneratedTitleSeo = z.infer<typeof generatedSeoSchema>;
export type GeneratedTitleContent = z.infer<typeof generatedContentSchema>;

export async function generateTitleSeo(values: TitleFormValues, model: DeepSeekModel): Promise<GeneratedTitleSeo> {
  const selectedLocales = getSelectedLocales(values);
  const generated = generatedSeoSchema.parse(await requestDeepSeek(values, model, false, selectedLocales));
  return requireSelectedLocales(generated, selectedLocales);
}

export async function generateTitleContent(values: TitleFormValues, model: DeepSeekModel): Promise<GeneratedTitleContent> {
  const selectedLocales = getSelectedLocales(values);
  const generated = generatedContentSchema.parse(await requestDeepSeek(values, model, true, selectedLocales));
  return requireSelectedLocales(generated, selectedLocales);
}

async function requestDeepSeek(
  values: TitleFormValues,
  model: DeepSeekModel,
  includeCatalogDescription: boolean,
  selectedLocales: Locale[]
) {
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
            `You create accurate multilingual catalog copy and SEO metadata for a legal, licensed manga catalog. Return JSON only. Do not invent plot facts, awards, availability, creators, or claims. Avoid graphic or explicit wording. Keep SEO titles under 60 characters when practical and SEO descriptions between 120 and 160 characters. Output exactly these requested locale keys and no others: ${selectedLocales.join(", ")}. Each key must contain title, description, keywords${includeCatalogDescription ? ", and catalogDescription (a natural 2-4 sentence catalog summary based only on supplied facts)" : ""}.`
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
            targetLocales: selectedLocales.map((locale) => ({ code: locale, language: localeLabels[locale] })),
            localizations: selectedLocalizationFacts(values, selectedLocales)
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

function getSelectedLocales(values: TitleFormValues): Locale[] {
  const selected = locales.filter((locale) => values.displayLocales.includes(locale));
  return selected.length > 0 ? selected : ["en"];
}

function selectedLocalizationFacts(values: TitleFormValues, selectedLocales: Locale[]) {
  const facts: Record<Locale, { title: string; description: string }> = {
    en: { title: values.enTitle, description: values.enDescription },
    es: { title: values.esTitle, description: values.esDescription },
    fr: { title: values.frTitle, description: values.frDescription },
    de: { title: values.deTitle, description: values.deDescription },
    pt: { title: values.ptTitle, description: values.ptDescription }
  };

  return Object.fromEntries(selectedLocales.map((locale) => [locale, facts[locale]]));
}

function requireSelectedLocales<T>(generated: Partial<Record<Locale, T>>, selectedLocales: Locale[]) {
  const selected: Partial<Record<Locale, T>> = {};
  for (const locale of selectedLocales) {
    const value = generated[locale];
    if (!value) throw new Error(`DeepSeek did not return requested locale: ${locale}.`);
    selected[locale] = value;
  }
  return selected;
}

function stripJsonFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
}

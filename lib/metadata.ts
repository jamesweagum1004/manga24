import type { Metadata } from "next";
import { env } from "@/lib/env";
import type { Locale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/db/queries/settings";

type MetadataInput = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function siteUrl(path = "") {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

export function localizedAlternates(locale: Locale, pathWithoutLocale: string, enabledLocales: Locale[]) {
  const languages = Object.fromEntries(
    enabledLocales.map((locale) => [locale, siteUrl(`/${locale}${pathWithoutLocale}`)])
  ) as Record<string, string>;

  return {
    canonical: siteUrl(`/${locale}${pathWithoutLocale}`),
    languages: {
      ...languages,
      "x-default": siteUrl(`/en${pathWithoutLocale}`)
    }
  };
}

export async function buildMetadata(input: MetadataInput): Promise<Metadata> {
  const settings = await getSiteSettings();
  const image = metadataImageUrl(input.image, settings.imageCdnUrl);

  return {
    title: `${input.title} | Manga24`,
    description: input.description,
    keywords: input.keywords,
    alternates: localizedAlternates(input.locale, input.path, settings.enabledLocales),
    openGraph: {
      title: `${input.title} | Manga24`,
      description: input.description,
      type: "website",
      url: siteUrl(`/${input.locale}${input.path}`),
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      locale: input.locale
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | Manga24`,
      description: input.description,
      images: [image]
    },
    robots: input.noIndex ? { index: false, follow: false } : undefined
  };
}

function metadataImageUrl(image: string | undefined, imageCdnBaseUrl: string) {
  if (image && /^https?:\/\//u.test(image)) return image;
  if (imageCdnBaseUrl) {
    const path = image?.replace(/^\/+/u, "") ?? "branding/og.webp";
    return new URL(path, `${imageCdnBaseUrl.replace(/\/$/u, "")}/`).toString();
  }
  return siteUrl(image ?? "/placeholders/og.svg");
}

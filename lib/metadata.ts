import type { Metadata } from "next";
import { env } from "@/lib/env";
import { locales, type Locale } from "@/lib/i18n";

type MetadataInput = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
};

export function siteUrl(path = "") {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

export function localizedAlternates(pathWithoutLocale: string) {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, siteUrl(`/${locale}${pathWithoutLocale}`)])
  ) as Record<string, string>;

  return {
    canonical: siteUrl(`/en${pathWithoutLocale}`),
    languages: {
      ...languages,
      "x-default": siteUrl(`/en${pathWithoutLocale}`)
    }
  };
}

export function buildMetadata(input: MetadataInput): Metadata {
  const image = input.image ?? "/placeholders/og.svg";

  return {
    title: `${input.title} | Manga24`,
    description: input.description,
    alternates: localizedAlternates(input.path),
    openGraph: {
      title: `${input.title} | Manga24`,
      description: input.description,
      type: "website",
      url: siteUrl(`/${input.locale}${input.path}`),
      images: [{ url: siteUrl(image), width: 1200, height: 630, alt: input.title }],
      locale: input.locale
    },
    robots: input.noIndex ? { index: false, follow: false } : undefined
  };
}

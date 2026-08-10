import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/db/queries/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: "Manga24",
    description: "A multilingual vertical-scroll manga reader platform.",
    icons: settings.favicon ? { icon: settings.favicon.publicUrl, shortcut: settings.favicon.publicUrl } : undefined,
    verification: env.GOOGLE_SITE_VERIFICATION ? { google: env.GOOGLE_SITE_VERIFICATION } : undefined
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d4482f"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const rawLocale = requestHeaders.get("x-manga-locale") ?? "en";
  const locale = ["en", "es", "fr", "de", "pt"].includes(rawLocale) ? rawLocale : "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { PwaManager } from "@/components/pwa-manager";
import { PanicButton } from "@/components/panic-button";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: settings.siteName,
    description: settings.seoLocales.en.description,
    manifest: settings.pwaEnabled ? "/manifest.webmanifest" : undefined,
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }],
      shortcut: "/favicon.ico",
      apple: "/favicon.ico"
    },
    verification: env.GOOGLE_SITE_VERIFICATION ? { google: env.GOOGLE_SITE_VERIFICATION } : undefined,
    robots: settings.maintenanceEnabled ? { index: false, follow: false, nocache: true } : undefined
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d4482f"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [requestHeaders, settings] = await Promise.all([headers(), getSiteSettings()]);
  const rawLocale = requestHeaders.get("x-manga-locale") ?? "en";
  const locale = ["en", "es", "fr", "de", "pt"].includes(rawLocale) ? rawLocale : "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}<PanicButton enabled={settings.panicButtonEnabled && !settings.maintenanceEnabled} /><PwaManager locale={locale as "en" | "es" | "fr" | "de" | "pt"} enabled={settings.pwaEnabled && !settings.maintenanceEnabled} promptEnabled={settings.pwaPromptEnabled} threshold={settings.pwaPromptThreshold} /></body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: "Manga24",
  description: "A multilingual vertical-scroll manga reader platform."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d4482f"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-manga-locale") === "es" ? "es" : "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

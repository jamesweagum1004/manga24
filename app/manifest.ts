import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const icon = settings.favicon?.publicUrl ?? "/pwa-icon.svg";
  return {
    name: "Manga24",
    short_name: "Manga24",
    description: "A multilingual vertical-scroll manga reader.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#d4482f",
    icons: [{ src: icon, sizes: "any", type: settings.favicon ? undefined : "image/svg+xml", purpose: "any" }]
  };
}

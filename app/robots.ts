import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const settings = await getSiteSettings();
  const hostname = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const blockAll = hostname !== "manga24.net" && hostname !== "www.manga24.net";

  if (blockAll) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }]
    };
  }

  const result: MetadataRoute.Robots = {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/manga1004", "/manga1004/", "/en/report", "/es/report"]
      }
    ]
  };
  if (settings.sitemapEnabled) result.sitemap = `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`;
  return result;
}

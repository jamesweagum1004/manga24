import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const blockAll = hostname === "dev.manga24.net" || hostname === "localhost" || hostname === "127.0.0.1";

  if (blockAll) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }]
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/manga1004", "/manga1004/"]
      }
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
  };
}

import { getSitemapFiles, sitemapFileName } from "@/lib/sitemaps";
import { siteUrl } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = await getSitemapFiles();
  const body = files.map((file) => `<sitemap><loc>${escapeXml(siteUrl(`/sitemaps/${sitemapFileName(file.locale, file.kind, file.page)}`))}</loc></sitemap>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

function escapeXml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }

import { isLocale } from "@/lib/i18n";
import { getSitemapEntries, sitemapPageSize, type SitemapKind } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = /^([a-zA-Z-]+)-(manga|chapters)(?:-(\d+))?\.xml$/u.exec(name);
  if (!match || !isLocale(match[1])) return new Response("Not Found", { status: 404 });
  const page = Number(match[3] ?? "1");
  if (!Number.isSafeInteger(page) || page < 1) return new Response("Not Found", { status: 404 });
  const entries = await getSitemapEntries(match[1], match[2] as SitemapKind);
  const chunk = entries.slice((page - 1) * sitemapPageSize, page * sitemapPageSize);
  if (page > 1 && chunk.length === 0) return new Response("Not Found", { status: 404 });
  const body = chunk.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${entry.lastModified.toISOString()}</lastmod></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

function escapeXml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }

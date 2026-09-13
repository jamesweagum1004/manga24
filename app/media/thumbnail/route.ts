import { and, eq, isNotNull } from "drizzle-orm";
import { assets, titles } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { getStoragePublicUrls } from "@/lib/db/queries/storage-configs";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { imageCdnUrl } from "@/lib/media/public-url";
import { getThumbnail } from "@/lib/media/thumbnail";
import { thumbnailWidths } from "@/lib/media/thumbnail-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("src") ?? "";
  const width = Number(params.get("w"));
  if (source.length > 2048 || !thumbnailWidths.some((size) => size === width)) return new Response(null, { status: 400 });
  let url: URL;
  let key: string;
  try {
    url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) throw new Error();
    key = decodeURIComponent(url.pathname.slice(1));
  } catch { return new Response(null, { status: 400 }); }

  try {
    // This is not an arbitrary image proxy: only published title covers qualify.
    const [asset] = await getDb().select({
      publicUrl: assets.publicUrl, objectKey: assets.objectKey,
      updatedAt: assets.updatedAt, format: titles.format
    }).from(assets).innerJoin(titles, eq(titles.coverAssetId, assets.id))
      .where(and(eq(assets.objectKey, key), isNotNull(titles.publishedAt))).limit(1);
    if (!asset) return new Response(null, { status: 404 });
    const [storage, settings] = await Promise.all([getStoragePublicUrls(), getSiteSettings()]);
    const expected = imageCdnUrl(asset.objectKey, storage[asset.format] || settings.imageCdnUrl, asset.publicUrl);
    if (url.href !== expected) return new Response(null, { status: 404 });
    try {
      const bytes = await getThumbnail(url, width, asset.updatedAt.toISOString());
      return new Response(new Uint8Array(bytes), { headers: {
        "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff"
      } });
    } catch {
      // Keep the site usable on CDN/encoder/cache failures, without caching failures.
      return new Response(null, { status: 307, headers: { Location: expected, "Cache-Control": "no-store" } });
    }
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

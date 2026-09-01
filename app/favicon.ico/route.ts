import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getSiteSettings();
  if (!settings.favicon?.publicUrl) {
    return defaultFavicon();
  }

  try {
    const source = await fetch(settings.favicon.publicUrl, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!source.ok || !source.body) throw new Error(`Favicon origin returned HTTP ${source.status}`);
    return new Response(source.body, {
      headers: {
        "Content-Type": source.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Unable to load configured favicon", error);
    return defaultFavicon();
  }
}

async function defaultFavicon() {
  const icon = await readFile(join(process.cwd(), "public", "pwa-icon.svg"));
  return new Response(icon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

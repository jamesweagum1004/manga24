import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const settings = await getSiteSettings();
  if (!settings.favicon?.publicUrl) {
    return NextResponse.redirect(new URL("/pwa-icon.svg", request.url), 307);
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
    return NextResponse.redirect(new URL("/pwa-icon.svg", request.url), 307);
  }
}

import { getSiteSettings } from "@/lib/db/queries/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getSiteSettings();
  if (!settings.indexnowEnabled || !settings.indexnowKey) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(settings.indexnowKey, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

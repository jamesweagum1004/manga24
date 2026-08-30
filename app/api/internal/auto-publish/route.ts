import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { runDueAutoPublishSchedules } from "@/lib/auto-publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const results = await runDueAutoPublishSchedules();
    if (results.some((result) => result.published > 0)) {
      revalidatePath("/sitemap.xml");
      revalidateTag("public-catalog");
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Automatic publish scheduler failed", error);
    return NextResponse.json({ error: "Automatic publish scheduler failed" }, { status: 500 });
  }
}

function authorized(header: string | null) {
  const expected = process.env.N8N_IMPORT_API_KEY;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !token) return false;
  const left = createHash("sha256").update(token).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { recordDbTitleView } from "@/lib/db/queries/titles";
import { isDatabaseConfigured } from "@/lib/data/source";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 204 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid title." }, { status: 400 });

  await recordDbTitleView(parsed.data.slug);
  return new NextResponse(null, { status: 204 });
}

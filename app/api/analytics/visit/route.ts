import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCountryCode } from "@/lib/analytics/country";
import { getDb } from "@/lib/db/client";
import { siteVisitEvents } from "@/db/schema";
import { isDatabaseConfigured } from "@/lib/data/source";

export const dynamic = "force-dynamic";
const schema = z.object({ visitorId: z.string().uuid(), pathname: z.string().startsWith("/").max(500) });

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 204 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return new NextResponse(null, { status: 400 });
  const visitorKey = createHash("sha256").update(`${process.env.ANALYTICS_HASH_SALT ?? "manga24"}:${body.data.visitorId}`).digest("hex");
  await getDb().insert(siteVisitEvents).values({ visitorKey, countryCode: getCountryCode(request.headers), pathname: body.data.pathname });
  return new NextResponse(null, { status: 204 });
}

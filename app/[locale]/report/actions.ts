"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { countRecentReports, createReport } from "@/lib/db/queries/reports";

const schema = z.object({
  targetType: z.enum(["title", "chapter", "site"]),
  targetKey: z.string().trim().min(1).max(360),
  targetUrl: z.string().trim().min(1).max(2000).refine((value) => value.startsWith("/") && !value.startsWith("//"), "Invalid target URL."),
  reason: z.enum(["child_safety", "copyright", "privacy", "wrong_rating", "broken", "spam", "other"]),
  details: z.string().trim().min(10).max(5000),
  reporterName: z.string().trim().max(160),
  reporterEmail: z.union([z.literal(""), z.string().trim().email().max(320)]),
  rightsHolder: z.string().trim().max(240),
  originalWork: z.string().trim().max(3000),
  signature: z.string().trim().max(240),
  website: z.string().max(0)
}).superRefine((value, context) => {
  if (value.reason === "copyright") {
    for (const key of ["reporterName", "reporterEmail", "rightsHolder", "originalWork", "signature"] as const) {
      if (!value[key]) context.addIssue({ code: "custom", path: [key], message: "Required for a copyright notice." });
    }
  }
});

export type PublicReportState = { success?: boolean; reference?: string; error?: string };

export async function submitReportAction(_state: PublicReportState, formData: FormData): Promise<PublicReportState> {
  const values = Object.fromEntries(["targetType", "targetKey", "targetUrl", "reason", "details", "reporterName", "reporterEmail", "rightsHolder", "originalWork", "signature", "website"].map((key) => [key, formData.get(key)]));
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { error: "Please complete the required fields. Copyright notices require identity, rights, work, contact, and signature details." };
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const fingerprint = createHash("sha256").update(`${process.env.ADMIN_SESSION_SECRET ?? "manga24"}:${address}`).digest("hex");
  if (await countRecentReports(fingerprint, new Date(Date.now() - 15 * 60 * 1000)) >= 5) return { error: "Too many reports. Please wait 15 minutes and try again." };
  const report = parsed.data;
  const id = await createReport({
    targetType: report.targetType,
    targetKey: report.targetKey,
    targetUrl: report.targetUrl,
    reason: report.reason,
    details: report.details,
    reporterName: report.reporterName || null,
    reporterEmail: report.reporterEmail || null,
    rightsHolder: report.rightsHolder || null,
    originalWork: report.originalWork || null,
    signature: report.signature || null,
    priority: report.reason === "child_safety" ? "urgent" : report.reason === "copyright" || report.reason === "privacy" ? "high" : "normal",
    reporterFingerprint: fingerprint
  });
  return { success: true, reference: id.slice(0, 8) };
}

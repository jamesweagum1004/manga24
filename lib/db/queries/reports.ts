import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { auditLogs, reports } from "@/db/schema";
import { getDb } from "@/lib/db/client";

export type ReportReason = typeof reports.$inferInsert.reason;
export type ReportStatus = typeof reports.$inferInsert.status;

export async function countRecentReports(fingerprint: string, since: Date) {
  const rows = await getDb().select({ id: reports.id }).from(reports).where(and(eq(reports.reporterFingerprint, fingerprint), gte(reports.createdAt, since)));
  return rows.length;
}

export async function createReport(values: Omit<typeof reports.$inferInsert, "id" | "createdAt" | "updatedAt" | "status">) {
  const [report] = await getDb().insert(reports).values(values).returning({ id: reports.id });
  return report.id;
}

export async function listReports() {
  return getDb().select().from(reports).orderBy(desc(reports.createdAt));
}

export async function updateReport(id: string, adminId: string, status: ReportStatus, resolution: string) {
  const now = new Date();
  await getDb().transaction(async (tx) => {
    await tx.update(reports).set({ status, resolution, reviewedBy: adminId, reviewedAt: now, updatedAt: now }).where(eq(reports.id, id));
    await tx.insert(auditLogs).values({ adminId, action: `report.${status}`, entityType: "report", entityId: id, metadata: { resolution } });
  });
}

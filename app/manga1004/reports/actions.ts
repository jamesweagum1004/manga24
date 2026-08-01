"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/auth";
import { updateReport } from "@/lib/db/queries/reports";

export async function reviewReportAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/not-found");
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "actioned", "rejected", "closed"]), resolution: z.string().trim().min(3).max(5000) }).safeParse({ id: formData.get("id"), status: formData.get("status"), resolution: formData.get("resolution") });
  if (!parsed.success) redirect("/manga1004/reports?error=invalid");
  await updateReport(parsed.data.id, session.adminId, parsed.data.status, parsed.data.resolution);
  redirect("/manga1004/reports?saved=1");
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticateAdmin } from "@/lib/db/queries/admins";
import { createAdminSession } from "@/lib/admin/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(256)
});

export async function loginAdminAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    redirect("/manga1004?error=1");
  }

  const admin = await authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!admin || !admin.username) {
    redirect("/manga1004?error=1");
  }

  await createAdminSession(admin.id, admin.username);
  redirect("/manga1004/dashboard");
}

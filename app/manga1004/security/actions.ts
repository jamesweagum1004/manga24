"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAdminSession, createAdminSession, getAdminSession } from "@/lib/admin/auth";
import { changeAdminPassword, createAdmin, updateAdminAccount } from "@/lib/db/queries/admins";

const usernameSchema = z.string().trim().min(3).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/);
const passwordSchema = z.string().min(12).max(256);

export async function createAdminAction(formData: FormData) {
  const parsed = z
    .object({
      username: usernameSchema,
      email: z.string().trim().email().max(255),
      displayName: z.string().trim().min(1).max(120),
      password: passwordSchema
    })
    .safeParse({
      username: formData.get("username"),
      email: formData.get("email"),
      displayName: formData.get("displayName"),
      password: formData.get("password")
    });

  if (!parsed.success) {
    redirect("/manga1004/security?error=invalid-admin");
  }

  try {
    await createAdmin(parsed.data);
  } catch {
    redirect("/manga1004/security?error=duplicate-admin");
  }
  redirect("/manga1004/security?saved=admin");
}

export async function changePasswordAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/not-found");

  const parsed = z
    .object({
      currentPassword: z.string().min(1).max(256),
      newPassword: passwordSchema,
      confirmPassword: z.string()
    })
    .refine((value) => value.newPassword === value.confirmPassword)
    .safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword")
    });
  if (!parsed.success) redirect("/manga1004/security?error=invalid-password");

  const changed = await changeAdminPassword(session.adminId, parsed.data.currentPassword, parsed.data.newPassword);
  if (!changed) redirect("/manga1004/security?error=current-password");
  redirect("/manga1004/security?saved=password");
}

export async function updateAdminAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/not-found");

  const parsed = z
    .object({
      adminId: z.string().uuid(),
      username: usernameSchema,
      email: z.string().trim().email().max(255),
      displayName: z.string().trim().min(1).max(120),
      password: z.union([z.literal(""), passwordSchema]),
      isActive: z.boolean()
    })
    .safeParse({
      adminId: formData.get("adminId"),
      username: formData.get("username"),
      email: formData.get("email"),
      displayName: formData.get("displayName"),
      password: formData.get("password"),
      isActive: formData.get("isActive") === "on"
    });
  if (!parsed.success) redirect("/manga1004/security?error=invalid-admin");
  if (parsed.data.adminId === session.adminId && !parsed.data.isActive) {
    redirect("/manga1004/security?error=self-disable");
  }

  try {
    await updateAdminAccount(parsed.data.adminId, {
      username: parsed.data.username,
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      isActive: parsed.data.isActive,
      password: parsed.data.password || undefined
    });
  } catch {
    redirect("/manga1004/security?error=duplicate-admin");
  }
  if (parsed.data.adminId === session.adminId) {
    await createAdminSession(session.adminId, parsed.data.username);
  }
  redirect("/manga1004/security?saved=admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/");
}

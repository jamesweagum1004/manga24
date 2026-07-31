import "server-only";
import { eq, isNull } from "drizzle-orm";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin/auth";

export async function authenticateAdmin(username: string, password: string) {
  const db = getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);

  if (admin) {
    if (!admin.isActive || !verifyAdminPassword(password, admin.passwordHash)) {
      return null;
    }
    return admin;
  }

  const bootstrapUsername = process.env.ADMIN_USERNAME;
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  if (!bootstrapUsername || !bootstrapPassword || username !== bootstrapUsername || password !== bootstrapPassword) {
    return null;
  }

  const [demoAdmin] = await db.select().from(admins).where(isNull(admins.username)).limit(1);
  const passwordHash = hashAdminPassword(password);
  if (demoAdmin) {
    const [initialized] = await db
      .update(admins)
      .set({
        username,
        displayName: "Manga24 Administrator",
        passwordHash,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(admins.id, demoAdmin.id))
      .returning();
    return initialized;
  }

  const [created] = await db
    .insert(admins)
    .values({
      username,
      email: `${username}@local.invalid`,
      displayName: "Manga24 Administrator",
      passwordHash
    })
    .returning();
  return created;
}

export async function listAdmins() {
  return getDb()
    .select({
      id: admins.id,
      username: admins.username,
      email: admins.email,
      displayName: admins.displayName,
      isActive: admins.isActive,
      createdAt: admins.createdAt
    })
    .from(admins)
    .orderBy(admins.createdAt);
}

export async function createAdmin(values: {
  username: string;
  email: string;
  displayName: string;
  password: string;
}) {
  return getDb().insert(admins).values({
    username: values.username,
    email: values.email,
    displayName: values.displayName,
    passwordHash: hashAdminPassword(values.password)
  });
}

export async function updateAdminAccount(
  adminId: string,
  values: { username: string; email: string; displayName: string; isActive: boolean; password?: string }
) {
  await getDb()
    .update(admins)
    .set({
      username: values.username,
      email: values.email,
      displayName: values.displayName,
      isActive: values.isActive,
      ...(values.password ? { passwordHash: hashAdminPassword(values.password) } : {}),
      updatedAt: new Date()
    })
    .where(eq(admins.id, adminId));
}

export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
  const db = getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
  if (!admin || !verifyAdminPassword(currentPassword, admin.passwordHash)) {
    return false;
  }

  await db
    .update(admins)
    .set({ passwordHash: hashAdminPassword(newPassword), updatedAt: new Date() })
    .where(eq(admins.id, adminId));
  return true;
}

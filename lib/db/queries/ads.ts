import "server-only";
import { asc, eq } from "drizzle-orm";
import { ads } from "@/db/schema";
import { getDb, getDbOrNull } from "@/lib/db/client";

export type AdKind = "static" | "exoclick";
export type AdPosition = "header" | "content";

export type AdValues = {
  name: string;
  kind: AdKind;
  position: AdPosition;
  imageUrl: string | null;
  clickUrl: string | null;
  altText: string | null;
  embedCode: string | null;
  width: number;
  height: number;
  insertAfter: number;
  sortOrder: number;
  isActive: boolean;
};

export async function listAds() {
  const db = getDbOrNull();
  if (!db) return [];
  return db.select().from(ads).orderBy(asc(ads.position), asc(ads.insertAfter), asc(ads.sortOrder));
}

export async function listActiveAds(position: AdPosition) {
  const rows = await listAds();
  return rows.filter((ad) => ad.isActive && ad.position === position);
}

export async function getAd(id: string) {
  const [ad] = await getDb().select().from(ads).where(eq(ads.id, id)).limit(1);
  return ad ?? null;
}

export async function createAd(values: AdValues) {
  await getDb().insert(ads).values(values);
}

export async function updateAd(id: string, values: AdValues) {
  await getDb().update(ads).set({ ...values, updatedAt: new Date() }).where(eq(ads.id, id));
}

export async function deleteAd(id: string) {
  await getDb().delete(ads).where(eq(ads.id, id));
}

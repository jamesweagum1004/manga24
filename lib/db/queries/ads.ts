import "server-only";
import { asc, eq } from "drizzle-orm";
import { ads } from "@/db/schema";
import { getDb, getDbOrNull } from "@/lib/db/client";
import { getSiteSettings } from "./settings";
import type { Locale } from "@/lib/i18n";

export type AdKind = "static" | "exoclick";
export type AdPosition = "header" | "content";
export type AdSurface = "both" | "web" | "pwa";

export type AdValues = {
  name: string;
  kind: AdKind;
  position: AdPosition;
  surface: AdSurface;
  locale: Locale | null;
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

export async function listActiveAds(position: AdPosition, locale: Locale) {
  const [rows, settings] = await Promise.all([listAds(), getSiteSettings()]);
  const selectedLocale = settings.adLocaleModes[locale] === "separate" ? locale : null;
  return rows.filter((ad) => ad.isActive && ad.position === position && ad.locale === selectedLocale);
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

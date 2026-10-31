import "server-only";
import { and, count, countDistinct, gte, sql } from "drizzle-orm";
import { siteVisitEvents } from "@/db/schema";
import { getDb } from "@/lib/db/client";

export async function getVisitAnalytics() {
  const db = getDb();
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const [todayTotals, yesterdayTotals, countries, topPages, daily] = await Promise.all([
    db.select({ visitors: countDistinct(siteVisitEvents.visitorKey), pageViews: count() }).from(siteVisitEvents).where(gte(siteVisitEvents.visitedAt, today)),
    db.select({ visitors: countDistinct(siteVisitEvents.visitorKey), pageViews: count() }).from(siteVisitEvents).where(and(gte(siteVisitEvents.visitedAt, yesterday), sql`${siteVisitEvents.visitedAt} < ${today}`)),
    db.select({ country: siteVisitEvents.countryCode, visitors: countDistinct(siteVisitEvents.visitorKey), pageViews: count() }).from(siteVisitEvents).where(gte(siteVisitEvents.visitedAt, sevenDaysAgo)).groupBy(siteVisitEvents.countryCode).orderBy(sql`count(*) desc`).limit(12),
    db.select({ pathname: siteVisitEvents.pathname, pageViews: count() }).from(siteVisitEvents).where(gte(siteVisitEvents.visitedAt, sevenDaysAgo)).groupBy(siteVisitEvents.pathname).orderBy(sql`count(*) desc`).limit(8),
    db.select({ day: sql<string>`to_char(date_trunc('day', ${siteVisitEvents.visitedAt}), 'YYYY-MM-DD')`, visitors: countDistinct(siteVisitEvents.visitorKey), pageViews: count() }).from(siteVisitEvents).where(gte(siteVisitEvents.visitedAt, sevenDaysAgo)).groupBy(sql`date_trunc('day', ${siteVisitEvents.visitedAt})`).orderBy(sql`date_trunc('day', ${siteVisitEvents.visitedAt})`)
  ]);
  return { today: todayTotals[0], yesterday: yesterdayTotals[0], countries, topPages, daily };
}

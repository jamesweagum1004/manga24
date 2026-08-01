import type { Metadata } from "next";
import Link from "next/link";
import { getLocaleOrDefault } from "@/lib/i18n";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report content | Manga24", robots: { index: false, follow: false } };

export default async function ReportPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ type?: string; key?: string; url?: string }> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = getLocaleOrDefault(rawLocale);
  const type = query.type === "title" || query.type === "chapter" ? query.type : "site";
  const key = (query.key ?? "site").slice(0, 360);
  const url = (query.url ?? `/${locale}`).slice(0, 2000);
  return <main className="mx-auto max-w-3xl px-4 py-8"><Link href={url.startsWith("/") ? url : `/${locale}`} className="text-sm font-black text-[var(--accent)]">← Back</Link><p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Safety & legal</p><h1 className="mt-1 text-3xl font-black">Report content</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Reports are reviewed by an administrator. Child-safety reports receive urgent priority. False or abusive reports may be rejected.</p><div className="mt-4 rounded-xl bg-[var(--surface-strong)] p-3 text-xs font-bold">Target: {key}</div><ReportForm targetType={type} targetKey={key} targetUrl={url} /></main>;
}

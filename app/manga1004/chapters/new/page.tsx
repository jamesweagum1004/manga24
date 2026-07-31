import Link from "next/link";
import { getAdminTitleList } from "@/lib/data/source";
import { emptyChapterFormValues } from "@/lib/db/queries/chapters";
import { createChapterAction } from "../actions";
import { ChapterForm } from "../chapter-form";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({ searchParams }: { searchParams: Promise<{ title?: string }> }) {
  const [titles, query] = await Promise.all([getAdminTitleList(), searchParams]);
  const selected = titles.some((title) => title.id === query.title) ? query.title! : "";
  return <main className="mx-auto max-w-4xl px-4 py-8"><Link href="/manga1004/chapters" className="text-sm font-bold text-[var(--accent)]">← Back to chapters</Link><h1 className="mt-3 text-3xl font-black">New Chapter</h1><p className="mt-2 text-sm text-[var(--muted)]">Create chapter metadata first. Page image management will be added to the saved chapter.</p><ChapterForm action={createChapterAction} initialState={{ values: { ...emptyChapterFormValues, titleId: selected } }} titles={titles} submitLabel="Create chapter" /></main>;
}

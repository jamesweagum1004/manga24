import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminTitleList } from "@/lib/data/source";
import { getDbChapterForAdmin } from "@/lib/db/queries/chapters";
import { updateChapterAction } from "../actions";
import { ChapterForm } from "../chapter-form";

export const dynamic = "force-dynamic";

export default async function AdminChapterPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [chapter, titles] = await Promise.all([getDbChapterForAdmin(id), getAdminTitleList()]);
  if (!chapter) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/manga1004/chapters" className="text-sm font-bold text-[var(--accent)]">← Back to chapters</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-black">Edit Chapter</h1><p className="mt-1 text-sm font-bold text-[var(--muted)]">{chapter.pageCount} uploaded pages</p></div>
        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-black">ID: {chapter.id.slice(0, 8)}</span>
      </div>
      {query.saved ? <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">Chapter saved successfully.</p> : null}
      <ChapterForm action={updateChapterAction.bind(null, chapter.id)} initialState={{ values: chapter.values }} titles={titles} submitLabel="Save chapter" />
      <section className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-black">Chapter pages</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">This chapter currently has {chapter.pageCount} pages. Bulk page upload, drag-to-reorder, and page deletion will be built as the next media-management step.</p>
      </section>
    </main>
  );
}

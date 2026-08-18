import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminTitleList } from "@/lib/data/source";
import { getDbChapterForAdmin } from "@/lib/db/queries/chapters";
import { deleteChapterAction, updateChapterAction } from "../actions";
import { ChapterForm } from "../chapter-form";
import { uploadChapterPagesAction } from "../../media-actions";
import { TitleSetupSteps } from "@/components/admin/title-setup-steps";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export const dynamic = "force-dynamic";

export default async function AdminChapterPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; mediaSaved?: string; mediaError?: string; setup?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [chapter, titles] = await Promise.all([getDbChapterForAdmin(id), getAdminTitleList()]);
  if (!chapter) notFound();
  const setup = query.setup === "pages";
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/manga1004/titles/${chapter.values.titleId}`} className="text-sm font-bold text-[var(--accent)]">← Back to title</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-black">Edit Chapter</h1><p className="mt-1 text-sm font-bold text-[var(--muted)]">{chapter.pageCount} uploaded pages</p></div>
        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-black">ID: {chapter.id.slice(0, 8)}</span>
      </div>
      {setup ? <TitleSetupSteps current={4} /> : null}
      {query.saved ? <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">Chapter saved successfully.</p> : null}
      <ChapterForm action={updateChapterAction.bind(null, chapter.id)} initialState={{ values: chapter.values }} titles={titles} submitLabel="Save chapter" setup={setup} />
      <section className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-black">Chapter pages</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">This chapter currently has {chapter.pageCount} pages. Uploading replaces the current page list after every file reaches B2 successfully.</p>
        {query.mediaSaved === "pages" ? <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">Pages uploaded, naturally sorted, and connected.</p> : null}
        {query.mediaError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{query.mediaError}</p> : null}
        <form action={uploadChapterPagesAction.bind(null, chapter.id)} className="mt-5 grid gap-4">
          {setup ? <input type="hidden" name="setup" value="1" /> : null}
          <label className="grid gap-1.5 text-sm font-black"><span>ZIP archive · max 120 MB</span><input type="file" name="zip" accept=".zip,application/zip" className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" /></label>
          <div className="text-center text-xs font-black uppercase text-[var(--muted)]">or</div>
          <label className="grid gap-1.5 text-sm font-black"><span>Multiple page images · JPG, PNG, WebP or AVIF</span><input type="file" name="pages" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" /></label>
          <p className="text-xs leading-5 text-[var(--muted)]">Files are ordered naturally by filename: 1, 2, 3 … 10. Use zero-padded names such as 001.jpg for predictable imports.</p>
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white">{setup ? "Upload pages and continue" : "Upload and replace pages"}</button>
        </form>
      </section>
      {!setup ? <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-black text-red-900">Delete chapter</h2>
        <p className="mt-2 text-sm font-bold text-red-800">This removes the chapter and all connected page records. This cannot be undone.</p>
        <form action={deleteChapterAction.bind(null, chapter.values.titleId, chapter.id)} className="mt-4">
          <ConfirmSubmitButton message="Delete this chapter and all its pages? This cannot be undone." className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white">Delete chapter permanently</ConfirmSubmitButton>
        </form>
      </section> : null}
    </main>
  );
}

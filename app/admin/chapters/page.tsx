import Link from "next/link";
import { getActiveDataSource, getAdminChapterList } from "@/lib/data/source";

export const dynamic = "force-dynamic";

export default async function AdminChaptersPage() {
  const chapters = await getAdminChapterList();
  const source = getActiveDataSource();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-3xl font-black">Chapters</h1>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">Source: {source}</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {chapters.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No chapters are available yet.</div>
        ) : (
          chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/admin/chapters/${encodeURIComponent(chapter.id)}`}
              className="grid gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)] md:grid-cols-[1fr_1fr_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{chapter.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">Chapter {chapter.chapterNumber}</span>
              </span>
              <span className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                <span className="truncate">{chapter.canonicalSlug}</span>
                <span>
                  {chapter.publicationStatus} - {chapter.pageCount} pages
                </span>
              </span>
              <span className="self-center text-xs font-bold text-[var(--accent)]">Edit</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

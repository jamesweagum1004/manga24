import Link from "next/link";
import { getActiveDataSource, getAdminChapterList } from "@/lib/data/source";

export const dynamic = "force-dynamic";

type Query = { q?: string; status?: string; format?: string; page?: string; sort?: string };
const groupsPerPage = 20;
const previewCount = 5;

export default async function AdminChaptersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const [chapters, query] = await Promise.all([getAdminChapterList(), searchParams]);
  const search = query.q?.trim().toLowerCase() ?? "";
  const filtered = chapters.filter((chapter) =>
    (!search || `${chapter.title} ${chapter.canonicalSlug} ${chapter.chapterNumber}`.toLowerCase().includes(search)) &&
    (!query.status || chapter.publicationStatusValue === query.status) &&
    (!query.format || chapter.format === query.format)
  );
  const groups = [...groupByTitle(filtered).values()].sort((left, right) => query.sort === "title"
    ? left[0].title.localeCompare(right[0].title)
    : Math.max(...right.map((item) => item.updatedAtValue)) - Math.max(...left.map((item) => item.updatedAtValue)));
  const pageCount = Math.max(1, Math.ceil(groups.length / groupsPerPage));
  const currentPage = clamp(Number(query.page) || 1, 1, pageCount);
  const visibleGroups = groups.slice((currentPage - 1) * groupsPerPage, currentPage * groupsPerPage);
  const published = chapters.filter((chapter) => chapter.publicationStatusValue === "published").length;
  const drafts = chapters.filter((chapter) => chapter.publicationStatusValue === "draft").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Content workspace</p><h1 className="mt-1 text-3xl font-black">Chapters</h1><p className="mt-1 text-sm font-bold text-[var(--muted)]">Recent titles first · collapsed by default · Source: {getActiveDataSource()}</p></div>
        <Link href="/manga1004/chapters/new" className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white shadow-sm">+ New Chapter</Link>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="All chapters" value={chapters.length} />
        <Stat label="Published" value={published} tone="green" />
        <Stat label="Drafts" value={drafts} tone="amber" />
        <Stat label="Titles" value={new Set(chapters.map((chapter) => chapter.titleId)).size} />
      </section>

      <form className="mt-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm lg:grid-cols-[1fr_150px_150px_150px_auto]">
        <input name="q" defaultValue={query.q} placeholder="Search title, chapter, or slug…" className={controlClass} />
        <select name="format" defaultValue={query.format ?? ""} className={controlClass}><option value="">All formats</option><option value="manga">Manga</option><option value="manhwa">Manhwa</option></select>
        <select name="status" defaultValue={query.status ?? ""} className={controlClass}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
        <select name="sort" defaultValue={query.sort ?? "recent"} className={controlClass}><option value="recent">Recently updated</option><option value="title">Title A–Z</option></select>
        <button className="rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)]">Filter</button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-[var(--muted)]">
        <span>{groups.length.toLocaleString()} titles · {filtered.length.toLocaleString()} chapters</span>
        {pageCount > 1 ? <span>Page {currentPage} of {pageCount}</span> : null}
      </div>

      <section className="mt-3 grid gap-3">
        {visibleGroups.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center"><p className="font-black">No matching chapters</p><p className="mt-1 text-sm text-[var(--muted)]">Change the filters or create a new chapter.</p></div> : null}
        {visibleGroups.map((items) => {
          const first = items[0];
          const newestFirst = [...items].sort((a, b) => b.updatedAtValue - a.updatedAtValue);
          const preview = search ? newestFirst : newestFirst.slice(0, previewCount);
          return (
            <details key={first.titleId} open={Boolean(search)} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-4 bg-[var(--surface-strong)] px-5 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-white">{first.format === "manhwa" ? "W" : "M"}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-black">{first.title}</span><span className="mt-0.5 block text-xs font-bold text-[var(--muted)]">{first.format === "manhwa" ? "Manhwa" : "Manga"} · {items.length} chapters · Updated {newestFirst[0]?.updatedAt}</span></span>
                <Link href={`/manga1004/chapters/new?title=${first.titleId}`} className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black sm:block">+ Add chapter</Link>
                <span className="text-lg transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="divide-y divide-[var(--border)]">
                {preview.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} />)}
                {!search && items.length > previewCount ? <p className="px-5 py-3 text-center text-xs font-bold text-[var(--muted)]">Showing the {previewCount} most recently updated chapters. Search this title to find older chapters.</p> : null}
              </div>
            </details>
          );
        })}
      </section>

      {pageCount > 1 ? <nav aria-label="Chapter title pages" className="mt-6 flex items-center justify-center gap-3"><PageLink query={query} page={currentPage - 1} disabled={currentPage === 1}>← Previous</PageLink><span className="text-sm font-black">{currentPage} / {pageCount}</span><PageLink query={query} page={currentPage + 1} disabled={currentPage === pageCount}>Next →</PageLink></nav> : null}
    </main>
  );
}

type Chapter = Awaited<ReturnType<typeof getAdminChapterList>>[number];
function ChapterRow({ chapter }: { chapter: Chapter }) { return <Link href={`/manga1004/chapters/${encodeURIComponent(chapter.id)}`} className="grid items-center gap-3 px-5 py-4 hover:bg-[var(--background)] sm:grid-cols-[90px_1fr_120px_100px_auto]"><strong>Ch. {chapter.chapterNumber}</strong><span className="min-w-0"><span className="block truncate text-sm font-bold">{chapter.canonicalSlug}</span><span className="text-xs text-[var(--muted)]">Updated {chapter.updatedAt}</span></span><Status value={chapter.publicationStatusValue} label={chapter.publicationStatus} /><span className="text-sm font-bold text-[var(--muted)]">{chapter.pageCount} pages</span><span className="text-sm font-black text-[var(--accent)]">Edit →</span></Link>; }
function PageLink({ query, page, disabled, children }: { query: Query; page: number; disabled: boolean; children: React.ReactNode }) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(query)) if (value && key !== "page") params.set(key, value); params.set("page", String(page)); return disabled ? <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-black opacity-35">{children}</span> : <Link href={`?${params}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-black">{children}</Link>; }
function Stat({ label, value, tone }: { label: string; value: number; tone?: "green" | "amber" }) { return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"><p className="text-xs font-black uppercase text-[var(--muted)]">{label}</p><p className={`mt-2 text-3xl font-black ${tone === "green" ? "text-green-600" : tone === "amber" ? "text-amber-600" : ""}`}>{value}</p></div>; }
function Status({ value, label }: { value: string; label: string }) { const color = value === "published" ? "bg-green-100 text-green-700" : value === "draft" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"; return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${color}`}>{label}</span>; }
const controlClass = "min-h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold";
function groupByTitle<T extends { titleId: string }>(items: T[]) { const groups = new Map<string, T[]>(); for (const item of items) groups.set(item.titleId, [...(groups.get(item.titleId) ?? []), item]); return groups; }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)); }

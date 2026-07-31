import Link from "next/link";
import {
  databaseNotConfiguredMessage,
  getActiveDataSource,
  getAdminTitleList,
  isDatabaseConfigured
} from "@/lib/data/source";

export const dynamic = "force-dynamic";

type Folder = "all" | "manga" | "manhwa";

export default async function AdminTitlesPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const titles = await getAdminTitleList();
  const query = await searchParams;
  const activeFolder: Folder = query.folder === "manga" || query.folder === "manhwa" ? query.folder : "all";
  const visibleTitles = activeFolder === "all" ? titles : titles.filter((title) => title.format === activeFolder);
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Titles</h1>
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">Source: {source}</p>
        </div>
        <Link href="/manga1004/titles/new" className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
          New Title
        </Link>
      </div>
      {!writesEnabled ? (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {databaseNotConfiguredMessage}
        </div>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <FolderLink href="/manga1004/titles" label="All Titles" count={titles.length} active={activeFolder === "all"} />
        <FolderLink href="/manga1004/titles?folder=manga" label="Manga" count={titles.filter((title) => title.format === "manga").length} active={activeFolder === "manga"} />
        <FolderLink href="/manga1004/titles?folder=manhwa" label="Manhwa" count={titles.filter((title) => title.format === "manhwa").length} active={activeFolder === "manhwa"} />
      </div>
      <h2 className="mt-7 text-xl font-black">{activeFolder === "all" ? "All Titles" : activeFolder === "manga" ? "Manga" : "Manhwa"}</h2>
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {visibleTitles.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No titles are available in this folder.</div>
        ) : (
          visibleTitles.map((title) => (
            <Link
              key={title.id}
              href={`/manga1004/titles/${title.id}`}
              className="grid gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)] md:grid-cols-[1.2fr_1fr_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{title.originalTitle}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">{title.canonicalSlug}</span>
              </span>
              <span className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                <span>
                  {title.format === "manga" ? "Manga" : "Manhwa"} - {title.publicationStatus} - {title.contentRating} - Updated {title.updatedAt}
                </span>
                <span className="truncate">EN: {title.enTitle}</span>
                <span className="truncate">ES: {title.esTitle}</span>
              </span>
              <span className="self-center text-xs font-bold text-[var(--accent)]">Edit</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

function FolderLink({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative rounded-xl border p-5 pt-7 transition-colors before:absolute before:-top-2 before:left-4 before:h-3 before:w-20 before:rounded-t-lg before:border before:border-b-0 ${
        active
          ? "border-[var(--accent)] bg-[var(--surface)] before:border-[var(--accent)] before:bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)] before:border-[var(--border)] before:bg-[var(--surface-strong)] hover:border-[var(--accent)]"
      }`}
    >
      <span className="block font-black">{label}</span>
      <span className="mt-1 block text-sm font-bold text-[var(--muted)]">{count} titles</span>
    </Link>
  );
}

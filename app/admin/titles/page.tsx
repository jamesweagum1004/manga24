import Link from "next/link";
import {
  databaseNotConfiguredMessage,
  getActiveDataSource,
  getAdminTitleList,
  isDatabaseConfigured
} from "@/lib/data/source";

export const dynamic = "force-dynamic";

export default async function AdminTitlesPage() {
  const titles = await getAdminTitleList();
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Titles</h1>
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">Source: {source}</p>
        </div>
        <Link href="/admin/titles/new" className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
          New Title
        </Link>
      </div>
      {!writesEnabled ? (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {databaseNotConfiguredMessage}
        </div>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {titles.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No titles are available yet.</div>
        ) : (
          titles.map((title) => (
            <Link
              key={title.id}
              href={`/admin/titles/${title.id}`}
              className="grid gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)] md:grid-cols-[1.2fr_1fr_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{title.originalTitle}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">{title.canonicalSlug}</span>
              </span>
              <span className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                <span>
                  {title.publicationStatus} - {title.contentRating} - Updated {title.updatedAt}
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

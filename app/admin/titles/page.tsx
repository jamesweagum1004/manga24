import Link from "next/link";
import { databaseNotConfiguredMessage, getActiveDataSource, getCatalogTitles, isDatabaseConfigured } from "@/lib/data/source";

export const dynamic = "force-dynamic";

export default async function AdminTitlesPage() {
  const titles = await getCatalogTitles();
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
              key={title.slug}
              href={`/admin/titles/${"id" in title ? title.id : title.slug}`}
              className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)]"
            >
              <span>
                <span className="block text-sm font-black">{title.originalTitle}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {title.publicationStatus} - {title.slug}
                </span>
              </span>
              <span className="text-xs font-bold text-[var(--accent)]">Edit</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { demoTitles } from "@/lib/demo-data";

export default function AdminTitlesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Titles</h1>
        <Link href="/admin/titles/new" className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
          New Title
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {demoTitles.map((title) => (
          <Link
            key={title.slug}
            href={`/admin/titles/${title.slug}`}
            className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)]"
          >
            <span>
              <span className="block text-sm font-black">{title.originalTitle}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">{title.publicationStatus}</span>
            </span>
            <span className="text-xs font-bold text-[var(--accent)]">Edit</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

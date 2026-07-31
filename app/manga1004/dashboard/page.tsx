import Link from "next/link";
import { getActiveDataSource, isDatabaseConfigured } from "@/lib/data/source";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-black">Admin Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Compact operational controls for the next Manga24 foundation step.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <AdminCard href="/manga1004/titles" title="Titles" body={`Browse title records from the active ${source} source.`} />
        <AdminCard href="/manga1004/titles/new" title="New Title" body={writesEnabled ? "Create canonical and localized title metadata." : "Writes need DATABASE_URL."} />
        <AdminCard href="/manga1004/chapters" title="Chapters" body="Review chapter metadata and page counts." />
        <AdminCard href="/manga1004/tags" title="Tags" body="Manage tag slugs and categories." />
        <AdminCard href="/manga1004/dashboard" title="DB Status" body={writesEnabled ? "PostgreSQL runtime source is configured." : "Demo fallback is active."} />
        <AdminCard href="/manga1004/dashboard" title="Deployment Info" body="Placeholder for service and deploy health checks." />
      </div>
    </main>
  );
}

function AdminCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]">
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
    </Link>
  );
}

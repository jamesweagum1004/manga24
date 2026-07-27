import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-black">Admin Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        Internal backend routes are scaffolded for title and chapter management. Authentication and roles are intentionally
        not implemented in this milestone.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <AdminCard href="/admin/titles" title="Manage Titles" body="Review localized metadata, tags, cover assets, and status." />
        <AdminCard href="/admin/titles/new" title="Create Title" body="Placeholder form route for the first content workflow." />
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

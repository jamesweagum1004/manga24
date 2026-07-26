export default function AdminNewTitlePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black">New Title</h1>
      <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Placeholder for the internal title creation form. The database schema already supports canonical title data,
          localized descriptions, cover assets, tags, and publication status.
        </p>
      </div>
    </main>
  );
}

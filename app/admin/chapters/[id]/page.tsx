export default async function AdminChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">Chapter Editor</h1>
      <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Placeholder editor for chapter ID <span className="font-bold text-[var(--foreground)]">{id}</span>. Ordered page
          assets and localized chapter titles are represented in the Drizzle schema.
        </p>
      </div>
    </main>
  );
}

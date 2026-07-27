import { notFound } from "next/navigation";
import { demoTitles } from "@/lib/demo-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTitleEditPage({ params }: PageProps) {
  const { id } = await params;
  const title = demoTitles.find((item) => item.slug === id);
  if (!title) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">{title.originalTitle}</h1>
      <div className="mt-6 grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <Field label="Canonical slug" value={title.slug} />
        <Field label="Author" value={title.author} />
        <Field label="Status" value={title.publicationStatus} />
        <Field label="Content rating" value={title.contentRating} />
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getAdminTitleById, isDatabaseConfigured } from "@/lib/data/source";
import { updateTitleAction } from "../actions";
import { TitleForm } from "../title-form";
import { generateSeoAction } from "./seo-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTitleEditPage({ params, searchParams }: PageProps & { searchParams: Promise<{ seoGenerated?: string; seoError?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const title = await getAdminTitleById(id);
  if (!title) {
    notFound();
  }
  const updateAction = updateTitleAction.bind(null, title.id);
  const writesEnabled = isDatabaseConfigured();
  const generateAction = generateSeoAction.bind(null, title.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">{title.values.originalTitle}</h1>
      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">DeepSeek SEO</h2>
            <p className="text-sm text-[var(--muted)]">Generate English and Spanish metadata, then review it in the form below.</p>
          </div>
          <form action={generateAction}>
            <button disabled={!writesEnabled} className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-black text-[var(--background)] disabled:opacity-50">
              Generate SEO
            </button>
          </form>
        </div>
        {query.seoGenerated ? <p className="mt-3 text-sm font-bold text-green-700">SEO metadata generated and saved. Review it below.</p> : null}
        {query.seoError ? <p className="mt-3 text-sm font-bold text-red-700">{query.seoError}</p> : null}
      </div>
      <TitleForm
        action={updateAction}
        initialState={{ values: title.values }}
        submitLabel="Save Title"
        writesEnabled={writesEnabled}
      />
    </main>
  );
}

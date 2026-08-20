import { databaseNotConfiguredMessage, getActiveDataSource, getAdminTagList, isDatabaseConfigured } from "@/lib/data/source";
import { emptyTagFormValues } from "@/lib/db/queries/tags";
import { createTagAction, replaceTagsAction } from "./actions";
import { TagForm } from "./tag-form";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ replaced?: string; titles?: string; error?: string }> }) {
  const query = await searchParams;
  const tags = await getAdminTagList();
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-black">Tags</h1>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">Source: {source}</p>
      </div>

      {!writesEnabled ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {databaseNotConfiguredMessage}
        </div>
      ) : null}

      {query.replaced ? <p className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">Replaced {query.replaced} source tags across {query.titles ?? "0"} titles.</p> : null}
      {query.error ? <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">Unable to replace tags. Check that every slug uses lowercase letters, numbers, and hyphens.</p> : null}

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-xl font-black text-amber-950">Replace and merge tags</h2>
        <p className="mt-1 text-sm font-bold text-amber-900">Move every title from unwanted source tags into one preferred tag. Duplicate links are removed and the old source tags are deleted.</p>
        <form action={replaceTagsAction} className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-black md:col-span-3"><span>Source tag slugs (comma-separated)</span><input name="sourceSlugs" required placeholder="loli, lolicon" className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-black"><span>Replacement slug</span><input name="replacementSlug" required defaultValue="teen" className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-black"><span>Replacement name</span><input name="replacementName" required defaultValue="Teen" className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-black"><span>Category</span><input name="replacementCategory" required defaultValue="content" className={inputClass} /></label>
          <button disabled={!writesEnabled} className="w-fit rounded-xl bg-amber-800 px-5 py-3 text-sm font-black text-white disabled:opacity-40 md:col-span-3">Replace tags</button>
        </form>
      </section>

      <TagForm action={createTagAction} initialState={{ values: emptyTagFormValues }} writesEnabled={writesEnabled} />

      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {tags.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No tags are available yet.</div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="grid gap-1 border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_1fr_1fr]"
            >
              <span className="text-sm font-black">{tag.slug}</span>
              <span className="text-sm font-bold">{tag.name}</span>
              <span className="text-xs font-bold uppercase text-[var(--muted)]">{tag.category}</span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-medium";

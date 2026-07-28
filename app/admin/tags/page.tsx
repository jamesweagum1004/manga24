import { databaseNotConfiguredMessage, getActiveDataSource, getAdminTagList, isDatabaseConfigured } from "@/lib/data/source";
import { emptyTagFormValues } from "@/lib/db/queries/tags";
import { createTagAction } from "./actions";
import { TagForm } from "./tag-form";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
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

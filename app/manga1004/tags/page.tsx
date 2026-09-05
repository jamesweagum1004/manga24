import { databaseNotConfiguredMessage, getActiveDataSource, getAdminTagList, isDatabaseConfigured } from "@/lib/data/source";
import { emptyTagFormValues } from "@/lib/db/queries/tags";
import { createTagAction, replaceTagsAction, translatePendingTagsAction, updateTagAction } from "./actions";
import { TagForm } from "./tag-form";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ replaced?: string; titles?: string; error?: string; translation?: string; translated?: string; failed?: string; q?: string; updated?: string }> }) {
  const query = await searchParams;
  const tags = await getAdminTagList();
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();
  const translationFilter = query.translation === "pending" || query.translation === "complete" ? query.translation : "all";
  const search = (query.q ?? "").trim().toLowerCase();
  const visibleTags = tags.filter((tag) => (translationFilter === "all" || (translationFilter === "complete" ? tag.translationsGeneratedAt : !tag.translationsGeneratedAt)) && (!search || [tag.slug, tag.name, tag.nameEs, tag.nameFr, tag.nameDe, tag.namePt, tag.category].some((value) => value?.toLowerCase().includes(search))));
  const pendingCount = tags.filter((tag) => !tag.translationsGeneratedAt).length;
  const completeCount = tags.length - pendingCount;

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
      {query.translated ? <p className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">Translated {query.translated} tag(s){Number(query.failed) > 0 ? `; ${query.failed} failed and remain in Translation needed` : ""}.</p> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <TagStatusCard href="/manga1004/tags" label="All tags" count={tags.length} active={translationFilter === "all"} />
        <TagStatusCard href="/manga1004/tags?translation=pending" label="Translation needed" count={pendingCount} active={translationFilter === "pending"} />
        <TagStatusCard href="/manga1004/tags?translation=complete" label="Translation complete" count={completeCount} active={translationFilter === "complete"} />
      </section>

      <form method="get" className="flex gap-2"><input type="search" name="q" defaultValue={query.q} placeholder="Search slug, name, translation, or category" className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /><button className="rounded-xl bg-[var(--foreground)] px-5 font-black text-[var(--background)]">Search</button></form>

      <section className="rounded-2xl border border-blue-300 bg-blue-50 p-5 shadow-sm">
        <h2 className="text-xl font-black text-blue-950">DeepSeek tag translation</h2>
        <p className="mt-1 text-sm font-bold text-blue-900">Translates only unfinished tags into Spanish, French, German, and Portuguese. Completed tags are never sent again.</p>
        <form action={translatePendingTagsAction} className="mt-4">
          <button disabled={!writesEnabled || pendingCount === 0} className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white disabled:opacity-40">Translate next pending tags ({Math.min(pendingCount, 40)})</button>
        </form>
      </section>

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
        {visibleTags.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No tags are available yet.</div>
        ) : (
          visibleTags.map((tag) => (
            <div
              key={tag.id}
              className="grid gap-2 border-b border-[var(--border)] px-4 py-3 last:border-b-0 lg:grid-cols-[1fr_1fr_2fr_auto]"
            >
              <span className="text-sm font-black">{tag.slug}</span>
              <form action={updateTagAction.bind(null, tag.slug)} className="grid gap-2 lg:col-span-2 lg:grid-cols-[1fr_1fr_auto]"><input name="name" required maxLength={120} defaultValue={tag.name} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold" /><input name="category" required maxLength={80} defaultValue={tag.category} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold" /><button className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-xs font-black text-[var(--background)]">Save &amp; translate</button><span className="text-xs font-bold text-[var(--muted)] lg:col-span-3">ES: {tag.nameEs} · FR: {tag.nameFr ?? "—"} · DE: {tag.nameDe ?? "—"} · PT: {tag.namePt ?? "—"}</span></form>
              <span className="grid content-center gap-1 text-right"><span className={`rounded-full px-3 py-1 text-xs font-black ${tag.translationsGeneratedAt ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{tag.translationsGeneratedAt ? "Complete" : "Translation needed"}</span><span className="text-xs font-bold uppercase text-[var(--muted)]">{tag.category}</span></span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-medium";

function TagStatusCard({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return <a href={href} className={`rounded-xl border p-5 ${active ? "border-[var(--accent)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"}`}><span className="block font-black">{label}</span><span className="mt-1 block text-sm font-bold text-[var(--muted)]">{count} tags</span></a>;
}

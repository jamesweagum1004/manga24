import Link from "next/link";
import { localeFlags, localeLabels, locales, type Locale } from "@/lib/i18n";
import {
  databaseNotConfiguredMessage,
  getActiveDataSource,
  getAdminTitleList,
  isDatabaseConfigured
} from "@/lib/data/source";

export const dynamic = "force-dynamic";

type Folder = "all" | "manga" | "manhwa";

type Query = { folder?: string; q?: string; locale?: string; visibility?: string; status?: string; updated?: string; sort?: string };

export default async function AdminTitlesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const titles = await getAdminTitleList();
  const query = await searchParams;
  const activeFolder: Folder = query.folder === "manga" || query.folder === "manhwa" ? query.folder : "all";
  const selectedLocale = locales.includes(query.locale as Locale) ? query.locale as Locale : "";
  const q = query.q?.trim().toLocaleLowerCase() ?? "";
  const ageDays = query.updated === "1" ? 1 : query.updated === "7" ? 7 : query.updated === "30" ? 30 : 0;
  const cutoff = ageDays ? Date.now() - ageDays * 86400000 : 0;
  const visibleTitles = titles.filter((title) => {
    if (activeFolder !== "all" && title.format !== activeFolder) return false;
    if (selectedLocale && !title.displayLocales.includes(selectedLocale)) return false;
    if (query.visibility === "live" && !title.isPublished) return false;
    if (query.visibility === "draft" && title.isPublished) return false;
    if (query.status && title.publicationStatusValue !== query.status) return false;
    if (cutoff && title.updatedAtValue < cutoff) return false;
    if (q && ![title.originalTitle, title.canonicalSlug, title.enTitle, title.esTitle, title.frTitle, title.deTitle, title.ptTitle].some((value) => value.toLocaleLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => query.sort === "title" ? a.originalTitle.localeCompare(b.originalTitle) : b.updatedAtValue - a.updatedAtValue);
  const source = getActiveDataSource();
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Titles</h1>
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">Source: {source}</p>
        </div>
        <Link href="/manga1004/titles/new" className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
          New Title
        </Link>
      </div>
      {!writesEnabled ? (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {databaseNotConfiguredMessage}
        </div>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <FolderLink href="/manga1004/titles" label="All Titles" count={titles.length} active={activeFolder === "all"} />
        <FolderLink href="/manga1004/titles?folder=manga" label="Manga" count={titles.filter((title) => title.format === "manga").length} active={activeFolder === "manga"} />
        <FolderLink href="/manga1004/titles?folder=manhwa" label="Manhwa" count={titles.filter((title) => title.format === "manhwa").length} active={activeFolder === "manhwa"} />
      </div>
      <h2 className="mt-7 text-xl font-black">{activeFolder === "all" ? "All Titles" : activeFolder === "manga" ? "Manga" : "Manhwa"}</h2>
      <form className="mt-4 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3 lg:grid-cols-6">
        {activeFolder !== "all" ? <input type="hidden" name="folder" value={activeFolder} /> : null}
        <input name="q" defaultValue={query.q} placeholder="Title, slug or translation" className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-bold md:col-span-2" />
        <FilterSelect name="locale" value={selectedLocale} options={[["", "All display languages"], ...locales.map((locale) => [locale, `${localeFlags[locale]} ${localeLabels[locale]}`])]} />
        <FilterSelect name="visibility" value={query.visibility} options={[["", "All visibility"], ["live", "Live"], ["draft", "Unpublished"]]} />
        <FilterSelect name="status" value={query.status} options={[["", "All statuses"], ["ongoing", "Ongoing"], ["completed", "Completed"], ["hiatus", "Hiatus"], ["cancelled", "Cancelled"]]} />
        <FilterSelect name="updated" value={query.updated} options={[["", "Any update date"], ["1", "Updated today"], ["7", "Last 7 days"], ["30", "Last 30 days"]]} />
        <FilterSelect name="sort" value={query.sort} options={[["updated", "Newest updated"], ["title", "Title A–Z"]]} />
        <button className="rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-black text-[var(--background)]">Search</button>
        <Link href={activeFolder === "all" ? "/manga1004/titles" : `/manga1004/titles?folder=${activeFolder}`} className="self-center text-center text-sm font-black text-[var(--muted)]">Reset</Link>
      </form>
      <p className="mt-3 text-sm font-bold text-[var(--muted)]">{visibleTitles.length} results</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {visibleTitles.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No titles are available in this folder.</div>
        ) : (
          visibleTitles.map((title) => (
            <Link
              key={title.id}
              href={`/manga1004/titles/${title.id}`}
              className="grid gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)] md:grid-cols-[1.2fr_1fr_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{title.originalTitle}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">{title.canonicalSlug}</span>
              </span>
              <span className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                <span>
                  {title.format === "manga" ? "Manga" : "Manhwa"} · {title.isPublished ? "Live" : "Unpublished"} · {title.publicationStatus} · {title.contentRating} · Updated {title.updatedAt}
                </span>
                <span>{title.displayLocales.map((locale) => localeFlags[locale]).join(" ")} · Original: {title.originalLanguage.toUpperCase()}</span>
                <span className="truncate">EN: {title.enTitle}</span>
                <span className="truncate">ES: {title.esTitle}</span>
              </span>
              <span className="self-center text-xs font-bold text-[var(--accent)]">Edit</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

function FilterSelect({ name, value, options }: { name: string; value?: string; options: string[][] }) {
  return <select name={name} defaultValue={value ?? ""} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-bold">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select>;
}

function FolderLink({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative rounded-xl border p-5 pt-7 transition-colors before:absolute before:-top-2 before:left-4 before:h-3 before:w-20 before:rounded-t-lg before:border before:border-b-0 ${
        active
          ? "border-[var(--accent)] bg-[var(--surface)] before:border-[var(--accent)] before:bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)] before:border-[var(--border)] before:bg-[var(--surface-strong)] hover:border-[var(--accent)]"
      }`}
    >
      <span className="block font-black">{label}</span>
      <span className="mt-1 block text-sm font-bold text-[var(--muted)]">{count} titles</span>
    </Link>
  );
}

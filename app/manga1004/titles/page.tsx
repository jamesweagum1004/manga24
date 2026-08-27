import Link from "next/link";
import { localeFlags, localeLabels, locales, type Locale } from "@/lib/i18n";
import {
  databaseNotConfiguredMessage,
  getActiveDataSource,
  getAdminTitleList,
  isDatabaseConfigured
} from "@/lib/data/source";
import { BulkActionToolbar } from "@/components/admin/bulk-action-toolbar";
import { bulkTitleAction } from "./actions";

export const dynamic = "force-dynamic";

type Folder = "all" | "manga" | "manhwa" | "unpublished-manga" | "unpublished-manhwa" | "ai-pending" | "ai-complete";

type Query = { folder?: string; q?: string; locale?: string; visibility?: string; status?: string; updated?: string; sort?: string; page?: string; pageSize?: string; deleted?: string; bulk?: string; bulkError?: string; changed?: string; skipped?: string };

export default async function AdminTitlesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const titles = await getAdminTitleList();
  const query = await searchParams;
  const activeFolder: Folder = ["manga", "manhwa", "unpublished-manga", "unpublished-manhwa", "ai-pending", "ai-complete"].includes(query.folder ?? "") ? query.folder as Folder : "all";
  const selectedLocale = locales.includes(query.locale as Locale) ? query.locale as Locale : "";
  const q = query.q?.trim().toLocaleLowerCase() ?? "";
  const ageDays = query.updated === "1" ? 1 : query.updated === "7" ? 7 : query.updated === "30" ? 30 : 0;
  const cutoff = ageDays ? Date.now() - ageDays * 86400000 : 0;
  const visibleTitles = titles.filter((title) => {
    if ((activeFolder === "manga" || activeFolder === "manhwa") && title.format !== activeFolder) return false;
    if (activeFolder === "unpublished-manga" && (title.format !== "manga" || title.isPublished)) return false;
    if (activeFolder === "unpublished-manhwa" && (title.format !== "manhwa" || title.isPublished)) return false;
    if (activeFolder === "ai-pending" && title.aiContentGeneratedAt) return false;
    if (activeFolder === "ai-complete" && !title.aiContentGeneratedAt) return false;
    if (selectedLocale && !title.displayLocales.includes(selectedLocale)) return false;
    if (query.visibility === "live" && !title.isPublished) return false;
    if (query.visibility === "draft" && title.isPublished) return false;
    if (query.status && title.publicationStatusValue !== query.status) return false;
    if (cutoff && title.updatedAtValue < cutoff) return false;
    if (q && ![title.originalTitle, title.canonicalSlug, title.enTitle, title.esTitle, title.frTitle, title.deTitle, title.ptTitle].some((value) => value.toLocaleLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => query.sort === "title" ? a.originalTitle.localeCompare(b.originalTitle) : b.updatedAtValue - a.updatedAtValue);
  const pageSize = [10, 25, 50, 100].includes(Number(query.pageSize)) ? Number(query.pageSize) : 25;
  const totalPages = Math.max(1, Math.ceil(visibleTitles.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedTitles = visibleTitles.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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
      {query.deleted === "title" ? <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">Title and all connected chapters were deleted.</p> : null}
      {query.bulk ? <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">Bulk action complete: {query.changed ?? "0"} title(s) updated{Number(query.skipped) > 0 ? `, ${query.skipped} skipped or failed` : ""}.</p> : null}
      {query.bulkError ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{query.bulkError === "locales" ? "Choose at least one display language." : "Select at least one title and choose an action."}</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <FolderLink href="/manga1004/titles" label="All Titles" count={titles.length} active={activeFolder === "all"} />
        <FolderLink href="/manga1004/titles?folder=manga" label="Manga" count={titles.filter((title) => title.format === "manga").length} active={activeFolder === "manga"} />
        <FolderLink href="/manga1004/titles?folder=manhwa" label="Manhwa" count={titles.filter((title) => title.format === "manhwa").length} active={activeFolder === "manhwa"} />
        <FolderLink href="/manga1004/titles?folder=unpublished-manga" label="Unpublished Manga" count={titles.filter((title) => title.format === "manga" && !title.isPublished).length} active={activeFolder === "unpublished-manga"} />
        <FolderLink href="/manga1004/titles?folder=unpublished-manhwa" label="Unpublished Manhwa" count={titles.filter((title) => title.format === "manhwa" && !title.isPublished).length} active={activeFolder === "unpublished-manhwa"} />
        <FolderLink href="/manga1004/titles?folder=ai-pending" label="DeepSeek needed" count={titles.filter((title) => !title.aiContentGeneratedAt).length} active={activeFolder === "ai-pending"} />
        <FolderLink href="/manga1004/titles?folder=ai-complete" label="DeepSeek complete" count={titles.filter((title) => Boolean(title.aiContentGeneratedAt)).length} active={activeFolder === "ai-complete"} />
      </div>
      <h2 className="mt-7 text-xl font-black">{{ all: "All Titles", manga: "Manga", manhwa: "Manhwa", "unpublished-manga": "Unpublished Manga", "unpublished-manhwa": "Unpublished Manhwa", "ai-pending": "DeepSeek needed", "ai-complete": "DeepSeek complete" }[activeFolder]}</h2>
      <form className="mt-4 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3 lg:grid-cols-6">
        {activeFolder !== "all" ? <input type="hidden" name="folder" value={activeFolder} /> : null}
        <input name="q" defaultValue={query.q} placeholder="Title, slug or translation" className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-bold md:col-span-2" />
        <FilterSelect name="locale" value={selectedLocale} options={[["", "All display languages"], ...locales.map((locale) => [locale, `${localeFlags[locale]} ${localeLabels[locale]}`])]} />
        <FilterSelect name="visibility" value={query.visibility} options={[["", "All visibility"], ["live", "Live"], ["draft", "Unpublished"]]} />
        <FilterSelect name="status" value={query.status} options={[["", "All statuses"], ["ongoing", "Ongoing"], ["completed", "Completed"], ["hiatus", "Hiatus"], ["cancelled", "Cancelled"]]} />
        <FilterSelect name="updated" value={query.updated} options={[["", "Any update date"], ["1", "Updated today"], ["7", "Last 7 days"], ["30", "Last 30 days"]]} />
        <FilterSelect name="sort" value={query.sort} options={[["updated", "Newest updated"], ["title", "Title A–Z"]]} />
        <FilterSelect name="pageSize" value={String(pageSize)} options={[["10", "10 per page"], ["25", "25 per page"], ["50", "50 per page"], ["100", "100 per page"]]} />
        <button className="rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-black text-[var(--background)]">Search</button>
        <Link href={activeFolder === "all" ? "/manga1004/titles" : `/manga1004/titles?folder=${activeFolder}`} className="self-center text-center text-sm font-black text-[var(--muted)]">Reset</Link>
      </form>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--muted)]">{visibleTitles.length} results · Page {currentPage} of {totalPages}</p>
      </div>
      {visibleTitles.length > 0 && writesEnabled ? <div className="mt-3">
        <form id="bulk-title-form" action={bulkTitleAction} />
        <BulkActionToolbar
          formId="bulk-title-form"
          checkboxName="titleIds"
          options={[
            { value: "publish-with-chapters", label: "Publish chapters with pages + publish titles" },
            { value: "publish", label: "Publish ready titles" },
            { value: "set-locales", label: "Replace display languages" },
            { value: "unpublish", label: "Unpublish / move to draft" },
            { value: "ongoing", label: "Set status: Ongoing" },
            { value: "completed", label: "Set status: Completed" },
            { value: "hiatus", label: "Set status: Hiatus" },
            { value: "cancelled", label: "Set status: Cancelled" },
            { value: "deepseek-content", label: "DeepSeek: rewrite descriptions + SEO (up to 200)" },
            { value: "delete", label: "Delete selected titles", destructive: true }
          ]}
          localeOptions={locales.map((locale) => ({ value: locale, label: `${localeFlags[locale]} ${localeLabels[locale]}` }))}
        />
      </div> : null}
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {visibleTitles.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--muted)]">No titles are available in this folder.</div>
        ) : (
          paginatedTitles.map((title) => (
            <div key={title.id} className="grid gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-strong)] md:grid-cols-[auto_1.2fr_1fr_auto]">
              <input type="checkbox" name="titleIds" value={title.id} form="bulk-title-form" aria-label={`Select ${title.originalTitle}`} className="h-5 w-5 self-center accent-[var(--accent)]" />
              <Link href={`/manga1004/titles/${title.id}`} className="min-w-0">
                <span className="block truncate text-sm font-black">{title.originalTitle}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">{title.canonicalSlug}</span>
              </Link>
              <span className="grid gap-1 text-xs font-bold text-[var(--muted)]">
                <span>
                  {title.format === "manga" ? "Manga" : "Manhwa"} · {title.isPublished ? "Live" : "Unpublished"} · {title.publicationStatus} · {title.contentRating} · Updated {title.updatedAt}
                </span>
                <span>{title.displayLocales.map((locale) => localeFlags[locale]).join(" ")} · Original: {title.originalLanguage.toUpperCase()}</span>
                <span className={title.aiContentGeneratedAt ? "text-green-700" : "text-amber-700"}>{title.aiContentGeneratedAt ? "DeepSeek description complete" : "DeepSeek description needed"}</span>
                <span className="truncate">EN: {title.enTitle}</span>
                <span className="truncate">ES: {title.esTitle}</span>
              </span>
              <Link href={`/manga1004/titles/${title.id}`} className="self-center text-xs font-bold text-[var(--accent)]">Edit</Link>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 ? (
        <nav aria-label="Title list pagination" className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <PaginationLink query={query} page={currentPage - 1} disabled={currentPage === 1}>Previous</PaginationLink>
          {paginationWindow(currentPage, totalPages).map((page) => (
            <PaginationLink key={page} query={query} page={page} active={page === currentPage}>{page}</PaginationLink>
          ))}
          <PaginationLink query={query} page={currentPage + 1} disabled={currentPage === totalPages}>Next</PaginationLink>
        </nav>
      ) : null}
    </main>
  );
}

function PaginationLink({ query, page, active = false, disabled = false, children }: { query: Query; page: number; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  const params = new URLSearchParams();
  for (const key of ["folder", "q", "locale", "visibility", "status", "updated", "sort", "pageSize"] as const) {
    if (query[key]) params.set(key, query[key]);
  }
  params.set("page", String(page));
  const className = `rounded-lg border px-3 py-2 text-sm font-black ${active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"} ${disabled ? "pointer-events-none opacity-40" : "hover:border-[var(--accent)]"}`;
  return disabled ? <span className={className}>{children}</span> : <Link href={`/manga1004/titles?${params.toString()}`} className={className} aria-current={active ? "page" : undefined}>{children}</Link>;
}

function paginationWindow(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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

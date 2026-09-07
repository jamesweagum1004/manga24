import Link from "next/link";

export function CatalogPagination({ currentPage, totalPages, href }: { currentPage: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = paginationItems(currentPage, totalPages);
  const target = new URL(href(1), "http://manga24.local");
  target.searchParams.delete("page");
  return <div className="mt-7 grid justify-items-center gap-3">
    <nav aria-label="Catalog pagination" className="flex flex-wrap items-center justify-center gap-2">
      <PageLink href={href(currentPage - 1)} disabled={currentPage === 1}>← Previous</PageLink>
      {pages.map((page, index) => page === "ellipsis"
        ? <span key={`ellipsis-${index}`} className="px-1 text-sm font-black text-[var(--muted)]">…</span>
        : <NumberLink key={page} href={href(page)} active={page === currentPage}>{page}</NumberLink>)}
      <PageLink href={href(currentPage + 1)} disabled={currentPage === totalPages}>Next →</PageLink>
    </nav>
    <form action={target.pathname} className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
      {[...target.searchParams.entries()].map(([name, value]) => <input key={`${name}-${value}`} type="hidden" name={name} value={value} />)}
      <label htmlFor={`page-jump-${target.pathname.replaceAll("/", "-")}`}>Go to page</label>
      <input id={`page-jump-${target.pathname.replaceAll("/", "-")}`} name="page" type="number" min={1} max={totalPages} defaultValue={currentPage} className="h-10 w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-center font-black" />
      <button className="h-10 rounded-xl bg-[var(--foreground)] px-4 font-black text-[var(--background)]">Go</button>
    </form>
  </div>;
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const className = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-black";
  return disabled ? <span className={`${className} opacity-35`}>{children}</span> : <Link href={href} className={className}>{children}</Link>;
}

function NumberLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  const className = `flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-black ${active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`;
  return active ? <span className={className} aria-current="page">{children}</span> : <Link href={href} className={className}>{children}</Link>;
}

function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const visible = new Set([1, totalPages, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2].filter((page) => page >= 1 && page <= totalPages));
  const sorted = [...visible].sort((left, right) => left - right);
  const items: Array<number | "ellipsis"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

export function paginate<T>(items: T[], requestedPage: string | undefined, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number.parseInt(requestedPage ?? "1", 10) || 1));
  return { currentPage, totalPages, items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize) };
}

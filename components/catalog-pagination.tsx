import Link from "next/link";

export function CatalogPagination({ currentPage, totalPages, href }: { currentPage: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return <nav aria-label="Catalog pagination" className="mt-7 flex items-center justify-center gap-3">
    <PageLink href={href(currentPage - 1)} disabled={currentPage === 1}>← Previous</PageLink>
    <span className="text-sm font-black">{currentPage} / {totalPages}</span>
    <PageLink href={href(currentPage + 1)} disabled={currentPage === totalPages}>Next →</PageLink>
  </nav>;
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const className = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-black";
  return disabled ? <span className={`${className} opacity-35`}>{children}</span> : <Link href={href} className={className}>{children}</Link>;
}

export function paginate<T>(items: T[], requestedPage: string | undefined, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number.parseInt(requestedPage ?? "1", 10) || 1));
  return { currentPage, totalPages, items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize) };
}

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminAuthStatus } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | Manga24",
  robots: {
    index: false,
    follow: false
  }
};

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/titles", label: "Titles" },
  { href: "/admin/titles/new", label: "New Title" },
  { href: "/admin/chapters", label: "Chapters" },
  { href: "/admin/tags", label: "Tags" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authStatus = getAdminAuthStatus();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Link href="/admin" className="text-lg font-black">
            Manga24 Admin
          </Link>
          <nav className="ml-auto hidden gap-2 sm:flex">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[var(--surface-strong)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {authStatus.developmentBypass ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          Admin auth is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD to enable Basic Auth.
        </div>
      ) : null}
      {children}
    </div>
  );
}

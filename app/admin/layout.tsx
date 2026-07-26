import type { Metadata } from "next";
import Link from "next/link";

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
  { href: "/admin/titles/new", label: "New Title" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  );
}

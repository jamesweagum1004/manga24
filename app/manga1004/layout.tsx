import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import { logoutAdminAction } from "./security/actions";

export const metadata: Metadata = {
  title: "Admin | Manga24",
  robots: {
    index: false,
    follow: false
  }
};

const adminLinks = [
  { href: "/manga1004/dashboard", label: "Dashboard" },
  { href: "/manga1004/titles", label: "Titles" },
  { href: "/manga1004/titles/new", label: "New Title" },
  { href: "/manga1004/chapters", label: "Chapters" },
  { href: "/manga1004/tags", label: "Tags" },
  { href: "/manga1004/security", label: "Security" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Link href="/manga1004/dashboard" className="text-lg font-black">
            Manga24 Admin
          </Link>
          <nav className="ml-auto hidden gap-2 sm:flex">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[var(--surface-strong)]">
                {link.label}
              </Link>
            ))}
            <form action={logoutAdminAction}>
              <button className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[var(--surface-strong)]">
                Sign out{session ? ` (${session.username})` : ""}
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

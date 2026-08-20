import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import { logoutAdminAction } from "./security/actions";

export const metadata: Metadata = { title: "Admin | Manga24", robots: { index: false, follow: false } };

const sections = [
  { label: "Overview", links: [{ href: "/manga1004/dashboard", label: "Dashboard", icon: "D" }] },
  { label: "Content", links: [
    { href: "/manga1004/titles", label: "Titles", icon: "T" },
    { href: "/manga1004/titles/new", label: "New Title", icon: "+" },
    { href: "/manga1004/tags", label: "Tags", icon: "#" },
    { href: "/manga1004/home-sections", label: "Homepage", icon: "H" }
  ] },
  { label: "Operations", links: [{ href: "/manga1004/reports", label: "Reports", icon: "!" }, { href: "/manga1004/ads", label: "Advertisements", icon: "A" }] },
  { label: "System", links: [
    { href: "/manga1004/settings", label: "Settings", icon: "S" },
    { href: "/manga1004/security", label: "Security", icon: "K" }
  ] }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return children;
  const links = sections.flatMap((section) => section.links);
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden min-h-screen border-r border-[var(--border)] bg-[#171a1f] text-white lg:flex lg:flex-col">
        <Link href="/manga1004/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-xs font-black">M24</span><span><strong className="block text-lg">Manga24</strong><small className="text-white/50">Administration</small></span></Link>
        <nav className="flex-1 space-y-6 p-4">{sections.map((section) => <div key={section.label}><p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{section.label}</p><div className="grid gap-1">{section.links.map((link) => <AdminLink key={link.href} {...link} />)}</div></div>)}</nav>
        <div className="border-t border-white/10 p-4"><p className="truncate px-3 text-sm font-bold">{session.username}</p><p className="px-3 text-xs text-white/40">Administrator</p><form action={logoutAdminAction} className="mt-3"><button className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm font-bold hover:bg-white/10">Sign out</button></form></div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur lg:hidden"><div className="flex items-center justify-between px-4 py-3"><Link href="/manga1004/dashboard" className="font-black">Manga24 Admin</Link><form action={logoutAdminAction}><button className="text-xs font-black text-[var(--accent)]">Sign out</button></form></div><nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3">{links.map((link) => <Link key={link.href} href={link.href} className="shrink-0 rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-black">{link.label}</Link>)}</nav></header>
        {children}
      </div>
    </div>
  );
}

function AdminLink({ href, label, icon }: { href: string; label: string; icon: string }) { return <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs">{icon}</span>{label}</Link>; }

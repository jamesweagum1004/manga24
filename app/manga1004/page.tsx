import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { loginAdminAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Restricted Access",
  robots: { index: false, follow: false }
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, query] = await Promise.all([getAdminSession(), searchParams]);
  if (session) {
    redirect("/manga1004/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4">
      <section className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="text-2xl font-black">Restricted Access</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Authorized administrators only.</p>
        {query.error ? (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800">
            The username or password is incorrect.
          </p>
        ) : null}
        <form action={loginAdminAction} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-bold">
            Username
            <input name="username" autoComplete="username" required maxLength={80} className="rounded-lg border p-3" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              className="rounded-lg border p-3"
            />
          </label>
          <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-3 font-black text-white">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

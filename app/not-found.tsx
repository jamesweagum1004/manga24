import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        The requested page is not available in this demo scaffold.
      </p>
      <Link
        href="/en"
        className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      >
        Return home
      </Link>
    </main>
  );
}

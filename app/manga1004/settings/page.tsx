import { getSiteSettings } from "@/lib/db/queries/settings";
import { updateAiSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [settings, query] = await Promise.all([getSiteSettings(), searchParams]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">Settings</h1>
      <p className="mt-1 text-sm font-bold text-[var(--muted)]">Configure administrator-only integrations.</p>
      {query.saved ? <p className="mt-5 rounded-lg border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">Settings saved.</p> : null}
      {query.error ? <p className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">Choose a supported model.</p> : null}
      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-xl font-black">DeepSeek SEO model</h2>
        <form action={updateAiSettingsAction} className="mt-4 grid max-w-xl gap-4">
          <select name="deepseekModel" defaultValue={settings.deepseekModel} className="rounded-lg border p-3 font-bold">
            <option value="deepseek-v4-flash">DeepSeek V4 Flash — faster, lower cost</option>
            <option value="deepseek-v4-pro">DeepSeek V4 Pro — higher quality</option>
          </select>
          <button className="w-fit rounded-lg bg-[var(--accent)] px-4 py-2 font-black text-white">Save AI settings</button>
        </form>
      </section>
    </main>
  );
}

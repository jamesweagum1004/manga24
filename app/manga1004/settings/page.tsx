import { getSiteSettings } from "@/lib/db/queries/settings";
import { listStorageConfigsForAdmin } from "@/lib/db/queries/storage-configs";
import { isStorageEncryptionConfigured } from "@/lib/storage-crypto";
import { updateAiSettingsAction, updateStorageSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [settings, storageConfigs, query] = await Promise.all([getSiteSettings(), listStorageConfigsForAdmin(), searchParams]);
  const encryptionReady = isStorageEncryptionConfigured();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">System</p>
      <h1 className="mt-1 text-3xl font-black">Settings</h1>
      <p className="mt-1 text-sm font-bold text-[var(--muted)]">Configure private integrations and media delivery.</p>
      {query.saved ? <Notice tone="success">Settings saved successfully.</Notice> : null}
      {query.error ? <Notice tone="error">Unable to save. Check every field and confirm the server encryption key is configured.</Notice> : null}

      <section id="storage" className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Backblaze B2 + Bunny CDN</h2><p className="mt-1 text-sm text-[var(--muted)]">Manga and Manhwa use isolated buckets, credentials, and delivery domains.</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${encryptionReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{encryptionReady ? "Encryption ready" : "Encryption key missing"}</span></div>
        {!encryptionReady ? <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">Set STORAGE_CONFIG_ENCRYPTION_KEY on the server before saving credentials. Application Keys are never stored as plain text.</p> : null}
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {storageConfigs.map((config) => <StorageCard key={config.format} config={config} disabled={!encryptionReady} />)}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">DeepSeek SEO model</h2>
        <form action={updateAiSettingsAction} className="mt-4 grid max-w-xl gap-4">
          <select name="deepseekModel" defaultValue={settings.deepseekModel} className={inputClass}><option value="deepseek-v4-flash">DeepSeek V4 Flash — faster, lower cost</option><option value="deepseek-v4-pro">DeepSeek V4 Pro — higher quality</option></select>
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save AI settings</button>
        </form>
      </section>
    </main>
  );
}

type Config = Awaited<ReturnType<typeof listStorageConfigsForAdmin>>[number];
function StorageCard({ config, disabled }: { config: Config; disabled: boolean }) {
  const isManga = config.format === "manga";
  return (
    <form action={updateStorageSettingsAction.bind(null, config.format)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-center gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl font-black text-white ${isManga ? "bg-slate-800" : "bg-[var(--accent)]"}`}>{isManga ? "M" : "W"}</span><div><h3 className="text-lg font-black">{isManga ? "Manga storage" : "Manhwa storage"}</h3><p className="text-xs font-bold text-[var(--muted)]">{config.isReady ? "Configured and ready" : "Configuration required"}</p></div><span className={`ml-auto h-3 w-3 rounded-full ${config.isReady ? "bg-green-500" : "bg-amber-400"}`} /></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="B2 bucket name"><input name="bucketName" required defaultValue={config.bucketName} placeholder={isManga ? "manga24-manga" : "manga24-manhwa"} className={inputClass} /></Field>
        <Field label="B2 region"><input name="region" required defaultValue={config.region} placeholder="us-west-004" className={inputClass} /></Field>
        <Field label="B2 S3 endpoint" wide><input name="endpoint" type="url" required defaultValue={config.endpoint} placeholder="https://s3.us-west-004.backblazeb2.com" className={inputClass} /></Field>
        <Field label="Application Key ID"><input name="keyId" required defaultValue={config.keyId} autoComplete="off" className={inputClass} /></Field>
        <Field label={config.hasApplicationKey ? "Application Key (leave blank to keep current)" : "Application Key"}><input name="applicationKey" type="password" required={!config.hasApplicationKey} autoComplete="new-password" placeholder={config.hasApplicationKey ? "••••••••••••••••" : "Required for first save"} className={inputClass} /></Field>
        <Field label="Bunny CDN public URL" wide><input name="bunnyPublicUrl" type="url" required defaultValue={config.bunnyPublicUrl} placeholder={isManga ? "https://img.manga24.net" : "https://img.manhwa.manga24.net"} className={inputClass} /></Field>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">The secret is encrypted before database storage and is never displayed again. Leaving the field blank preserves the existing key.</p>
      <button disabled={disabled} className="mt-4 rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40">Save {isManga ? "Manga" : "Manhwa"} storage</button>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`grid gap-1.5 text-sm font-black ${wide ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>; }
function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) { return <p className={`mt-5 rounded-xl border p-4 text-sm font-bold ${tone === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>{children}</p>; }
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

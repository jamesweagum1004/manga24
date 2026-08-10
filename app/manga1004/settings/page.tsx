import { getSiteSettings } from "@/lib/db/queries/settings";
/* eslint-disable @next/next/no-img-element */
import { listStorageConfigsForAdmin } from "@/lib/db/queries/storage-configs";
import { isStorageEncryptionConfigured } from "@/lib/storage-crypto";
import { localeLabels, locales } from "@/lib/i18n";
import { deleteBrandingAction, updateAiSettingsAction, updateLanguageSettingsAction, updateStorageSettingsAction, uploadBrandingAction } from "./actions";

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

      <section id="branding" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Logo &amp; favicon</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Upload branding to the selected media storage. Replacing or removing it takes effect site-wide.</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <BrandingCard kind="logo" title="Site logo" image={settings.logo} />
          <BrandingCard kind="favicon" title="Browser favicon" image={settings.favicon} />
        </div>
      </section>

      <section id="languages" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Site languages</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">English is always enabled. Disabled locale URLs permanently redirect to English and are removed from hreflang and sitemap output.</p>
        <form action={updateLanguageSettingsAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {locales.map((locale) => <label key={locale} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-black"><input type="checkbox" name={`locale_${locale}`} defaultChecked={settings.enabledLocales.includes(locale)} disabled={locale === "en"} className="h-5 w-5 accent-[var(--accent)]" /><span>{localeLabels[locale]}</span>{locale === "en" ? <input type="hidden" name="locale_en" value="on" /> : null}</label>)}
          <button className="rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white sm:col-span-2 lg:col-span-5 lg:w-fit">Save languages</button>
        </form>
      </section>

      <section id="storage" className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Media storage</h2><p className="mt-1 text-sm text-[var(--muted)]">Choose Backblaze B2 or Bunny Storage independently for Manga and Manhwa.</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${encryptionReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{encryptionReady ? "Encryption ready" : "Encryption key missing"}</span></div>
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
        <Field label="Active provider" wide><select name="provider" defaultValue={config.provider} className={inputClass}><option value="backblaze-b2">Backblaze B2</option><option value="bunny-storage">Bunny Storage</option></select></Field>
        <Field label="Bunny CDN delivery URL" wide><input name="bunnyPublicUrl" type="url" required defaultValue={config.bunnyPublicUrl} placeholder={isManga ? "https://manga.images.example" : "https://manhwa.images.example"} className={inputClass} /></Field>
        <div className="sm:col-span-2 rounded-xl border border-[var(--border)] p-4"><h4 className="font-black">Backblaze B2</h4><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="B2 bucket name"><input name="bucketName" defaultValue={config.bucketName} placeholder={isManga ? "manga24-manga" : "manga24-manhwa"} className={inputClass} /></Field>
        <Field label="B2 region"><input name="region" defaultValue={config.region} placeholder="us-west-004" className={inputClass} /></Field>
        <Field label="B2 S3 endpoint" wide><input name="endpoint" type="url" defaultValue={config.endpoint} placeholder="https://s3.us-west-004.backblazeb2.com" className={inputClass} /></Field>
        <Field label="Application Key ID"><input name="keyId" defaultValue={config.keyId} autoComplete="off" className={inputClass} /></Field>
        <Field label={config.hasApplicationKey ? "Application Key (leave blank to keep current)" : "Application Key"}><input name="applicationKey" type="password" required={config.provider === "backblaze-b2" && !config.hasApplicationKey} autoComplete="new-password" placeholder={config.hasApplicationKey ? "••••••••••••••••" : "Required when B2 is active"} className={inputClass} /></Field>
        </div></div>
        <div className="sm:col-span-2 rounded-xl border border-[var(--border)] p-4"><h4 className="font-black">Bunny Storage fallback</h4><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Storage Zone name"><input name="bunnyStorageZone" defaultValue={config.bunnyStorageZone} placeholder="manga24-media" className={inputClass} /></Field>
        <Field label="API endpoint"><input name="bunnyEndpoint" type="url" defaultValue={config.bunnyEndpoint} placeholder="https://storage.bunnycdn.com" className={inputClass} /></Field>
        <Field label={config.hasBunnyAccessKey ? "Storage password (leave blank to keep current)" : "Storage password / AccessKey"} wide><input name="bunnyAccessKey" type="password" required={config.provider === "bunny-storage" && !config.hasBunnyAccessKey} autoComplete="new-password" placeholder={config.hasBunnyAccessKey ? "••••••••••••••••" : "Storage Zone password"} className={inputClass} /></Field>
        </div></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">The secret is encrypted before database storage and is never displayed again. Existing and new images use this format-specific Bunny hostname; B2 origin URLs are never sent to browsers.</p>
      <button disabled={disabled} className="mt-4 rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40">Save {isManga ? "Manga" : "Manhwa"} storage</button>
    </form>
  );
}

type BrandingImage = Awaited<ReturnType<typeof getSiteSettings>>["logo"];
function BrandingCard({ kind, title, image }: { kind: "logo" | "favicon"; title: string; image: BrandingImage }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"><div className="flex min-h-20 items-center gap-4">{image ? <img src={image.publicUrl} alt={`${title} preview`} className="max-h-16 max-w-40 object-contain" /> : <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed text-xs font-bold text-[var(--muted)]">Not set</div>}<div><h3 className="font-black">{title}</h3><p className="text-xs text-[var(--muted)]">PNG, JPEG, WebP or AVIF</p></div></div><form action={uploadBrandingAction.bind(null, kind)} className="mt-4 grid gap-3"><select name="format" className={inputClass}><option value="manga">Use Manga storage</option><option value="manhwa">Use Manhwa storage</option></select><input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/avif" required className={inputClass} /><button className="rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-black text-[var(--background)]">{image ? "Replace" : "Upload"} {title}</button></form>{image ? <form action={deleteBrandingAction.bind(null, kind)} className="mt-2"><button className="w-full rounded-xl border border-red-300 px-4 py-2 text-sm font-black text-red-700">Remove from site</button></form> : null}</div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`grid gap-1.5 text-sm font-black ${wide ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>; }
function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) { return <p className={`mt-5 rounded-xl border p-4 text-sm font-bold ${tone === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>{children}</p>; }
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

import { getSiteSettings } from "@/lib/db/queries/settings";
/* eslint-disable @next/next/no-img-element */
import { listStorageConfigsForAdmin } from "@/lib/db/queries/storage-configs";
import { isStorageEncryptionConfigured } from "@/lib/storage-crypto";
import { localeFlags, localeLabels, locales } from "@/lib/i18n";
import { createHomeSectionAction, deleteBrandingAction, deleteHomeSectionAction, updateAiSettingsAction, updateGoogleAnalyticsSettingsAction, updateHomeContentSettingsAction, updateHomeSectionAction, updateLanguageSettingsAction, updateMaintenanceSettingsAction, updatePublicMetadataSettingsAction, updatePwaSettingsAction, updateStorageSettingsAction, updateViewCountSettingsAction, uploadBrandingAction } from "./actions";

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

      <section id="maintenance" className="mt-7 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-xl font-black text-amber-950">Maintenance mode</h2>
        <p className="mt-1 text-sm font-bold text-amber-900">Temporarily replace every public language page with a maintenance notice. Signed-in administrators bypass it automatically.</p>
        <form action={updateMaintenanceSettingsAction} className="mt-5 grid gap-4">
          <Toggle name="maintenanceEnabled" defaultChecked={settings.maintenanceEnabled} title="Enable maintenance page" description="Public catalog and reader pages are hidden. Admin pages and internal APIs remain available." />
          <button className="w-fit rounded-xl bg-amber-700 px-5 py-3 font-black text-white">Save maintenance mode</button>
        </form>
      </section>

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
          {locales.map((locale) => <label key={locale} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-black"><input type="checkbox" name={`locale_${locale}`} defaultChecked={settings.enabledLocales.includes(locale)} disabled={locale === "en"} className="h-5 w-5 accent-[var(--accent)]" /><span aria-hidden="true" className={locale === "pt" ? "text-sm tracking-[-0.35em] pr-1" : "text-lg"}>{localeFlags[locale]}</span><span>{localeLabels[locale]}</span>{locale === "en" ? <input type="hidden" name="locale_en" value="on" /> : null}</label>)}
          <button className="rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white sm:col-span-2 lg:col-span-5 lg:w-fit">Save languages</button>
        </form>
      </section>

      <section id="home-content" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Homepage content</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Control optional sections on the main public homepage without unpublishing their titles.</p>
        <form action={updateHomeContentSettingsAction} className="mt-5 grid gap-4">
          <Toggle name="homeManhwaEnabled" defaultChecked={settings.homeManhwaEnabled} title="Show Manhwa on the main homepage" description="When disabled, the Manhwa Spotlight section is hidden from every language homepage. Manhwa title URLs and other catalog pages remain available." />
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save homepage settings</button>
        </form>
      </section>

      <section id="public-metadata" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Title page information</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Choose which catalog details visitors can see. The stored data is not deleted.</p>
        <form action={updatePublicMetadataSettingsAction} className="mt-5 grid gap-3">
          <Toggle name="showPublishedDate" defaultChecked={settings.showPublishedDate} title="Show publish date" description="Displays the title publication date and chapter publication dates." />
          <Toggle name="showAuthor" defaultChecked={settings.showAuthor} title="Show author" description="Displays the author or creator name on title pages." />
          <Toggle name="showChapters" defaultChecked={settings.showChapters} title="Show chapter information" description="Displays chapter count, chapter buttons, and the chapter list. Existing reader URLs remain active." />
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save title information</button>
        </form>
      </section>

      <section id="home-sections" className="mt-7">
        <div><h2 className="text-xl font-black">Homepage categories</h2><p className="mt-1 text-sm text-[var(--muted)]">Add, edit, hide, or delete homepage rails. Item count controls how many titles each category exposes.</p></div>
        <div className="mt-4 grid gap-4">
          {settings.homeSections.map((section) => <HomeSectionCard key={section.id} section={section} />)}
          <form action={createHomeSectionAction} className="rounded-2xl border border-dashed border-[var(--accent)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="font-black">Add homepage category</h3>
            <HomeSectionFields />
            <button className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white">Add category</button>
          </form>
        </div>
      </section>

      <section id="view-counts" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">View count visibility</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Hide or show view totals across the public site without deleting or resetting collected view data.</p>
        <form action={updateViewCountSettingsAction} className="mt-5 grid gap-4">
          <Toggle name="viewCountsEnabled" defaultChecked={settings.viewCountsEnabled} title="Show view counts to visitors" description="Controls view totals on the homepage ranking, popular page, and title detail pages. Ranking order is not changed." />
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save view count setting</button>
        </form>
      </section>

      <section id="pwa" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Progressive Web App</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Enable native browser installation without caching pages, images, API calls, or advertisements. Normal exposure stays inside the browser address bar and menu.</p>
        <form action={updatePwaSettingsAction} className="mt-5 grid gap-4">
          <Toggle name="pwaEnabled" defaultChecked={settings.pwaEnabled} title="Enable PWA installation" description="Publishes the install manifest and registers a pass-through service worker." />
          <Toggle name="pwaPromptEnabled" defaultChecked={settings.pwaPromptEnabled} title="Enable gentle reader reminder" description="Shows one small bottom notice only after the configured number of different chapters have been read." />
          <label className="grid max-w-sm gap-1.5 text-sm font-black"><span>Show after consecutive chapters</span><select name="pwaPromptThreshold" defaultValue={settings.pwaPromptThreshold} className={inputClass}><option value="3">3 chapters</option><option value="4">4 chapters</option><option value="5">5 chapters</option></select></label>
          <p className="text-xs leading-5 text-[var(--muted)]">The reminder has no backdrop, does not reserve an ad slot, and never intercepts ad requests or impression scripts.</p>
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save PWA settings</button>
        </form>
      </section>

      <section id="analytics" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Google Analytics 4</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Track public language pages and the installed PWA. Administrator pages and internal APIs are never tracked.</p>
        <form action={updateGoogleAnalyticsSettingsAction} className="mt-5 grid max-w-2xl gap-4">
          <Toggle name="googleAnalyticsEnabled" defaultChecked={settings.googleAnalyticsEnabled} title="Enable Google Analytics" description="Loads GA4 only on public /en, /es, /fr, /de and /pt routes." />
          <label className="grid gap-1.5 text-sm font-black"><span>GA4 Measurement ID</span><input name="googleAnalyticsMeasurementId" defaultValue={settings.googleAnalyticsMeasurementId} placeholder="G-XXXXXXXXXX" autoComplete="off" className={inputClass} /><span className="text-xs font-medium text-[var(--muted)]">Google Analytics → Admin → Data streams → Web stream → Measurement ID</span></label>
          <button className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white">Save analytics settings</button>
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
function Toggle({ name, defaultChecked, title, description }: { name: string; defaultChecked: boolean; title: string; description: string }) { return <label className="flex max-w-2xl items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-5 w-5 accent-[var(--accent)]" /><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span></span></label>; }
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

type HomeSectionValue = Awaited<ReturnType<typeof getSiteSettings>>["homeSections"][number];
function HomeSectionCard({ section }: { section: HomeSectionValue }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"><form action={updateHomeSectionAction.bind(null, section.id)}><div className="flex items-center justify-between gap-3"><h3 className="font-black">{section.title}</h3><span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-black">{section.itemCount} items</span></div><HomeSectionFields section={section} /><button className="mt-4 rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)]">Save category</button></form><form action={deleteHomeSectionAction.bind(null, section.id)} className="mt-2"><button className="rounded-xl border border-red-300 px-4 py-2 text-sm font-black text-red-700">Delete category</button></form></div>;
}

function HomeSectionFields({ section }: { section?: HomeSectionValue }) {
  return <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Field label="Category title"><input name="title" required maxLength={80} defaultValue={section?.title} placeholder="Romance" className={inputClass} /></Field><Field label="Small label"><input name="subtitle" maxLength={80} defaultValue={section?.subtitle} placeholder="Updated" className={inputClass} /></Field><Field label="Content source"><select name="source" defaultValue={section?.source ?? "latest"} className={inputClass}><option value="popular">Popular manga</option><option value="latest">Latest manga</option><option value="adult">Adult manga</option><option value="tag">Tag category</option><option value="manhwa">Manhwa</option></select></Field><Field label="Tag slug"><input name="tag" defaultValue={section?.tag} placeholder="romance" className={inputClass} /></Field><Field label="Number shown"><input name="itemCount" type="number" min={1} max={30} defaultValue={section?.itemCount ?? 12} className={inputClass} /></Field><label className="flex items-center gap-2 text-sm font-black sm:col-span-2"><input type="checkbox" name="enabled" defaultChecked={section?.enabled ?? true} className="h-5 w-5 accent-[var(--accent)]" />Show this category</label></div>;
}

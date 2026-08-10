import { listAds } from "@/lib/db/queries/ads";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { localeFlags, localeLabels, locales } from "@/lib/i18n";
import { createAdAction, deleteAdAction, updateAdAction, updateAdDeliverySettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [ads, settings, query] = await Promise.all([listAds(), getSiteSettings(), searchParams]);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-black">Advertisements</h1>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">Manage uploaded static banners and trusted ExoClick embed code.</p>
      </div>
      {query.saved ? <Notice tone="success">Advertisement saved.</Notice> : null}
      {query.error ? <Notice tone="error">Unable to save. Check the required content, URL, image format, and 10 MB limit.</Notice> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-xl font-black">Delivery rules</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">PWA uses the same ads as the web by default. Disable all PWA ads here, or target individual ads to Web/PWA below.</p>
        <form action={updateAdDeliverySettingsAction} className="mt-5 grid gap-4">
          <label className="flex max-w-xl items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"><input type="checkbox" name="pwaAdsEnabled" defaultChecked={settings.pwaAdsEnabled} className="mt-0.5 h-5 w-5 accent-[var(--accent)]" /><span><strong className="block text-sm">Show advertisements in installed PWA</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">ON keeps web and PWA revenue behavior identical. OFF suppresses every ad only in standalone PWA mode.</span></span></label>
          <div><h3 className="text-sm font-black">Language advertising sets</h3><p className="mt-1 text-xs text-[var(--muted)]">“Use main ads” serves advertisements whose language target is Main/default. “Separate ads” serves only advertisements specifically assigned to that language.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {locales.map((locale) => <label key={locale} className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm font-black"><span>{localeFlags[locale]} {localeLabels[locale]}</span><select name={`mode_${locale}`} defaultValue={settings.adLocaleModes[locale]} className={inputClass}><option value="inherit">Use main ads</option><option value="separate">Separate ads</option></select></label>)}
          </div>
          <button className="w-fit rounded-lg bg-[var(--foreground)] px-5 py-3 font-black text-[var(--background)]">Save delivery rules</button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Create advertisement</h2><AdForm action={createAdAction} submitLabel="Create advertisement" /></section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Current advertisements</h2>
        {ads.length === 0 ? <p className="rounded-xl border bg-[var(--surface)] p-5 text-sm font-bold text-[var(--muted)]">No advertisements yet.</p> : null}
        {ads.map((ad) => (
          <div key={ad.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <AdForm action={updateAdAction} submitLabel="Save changes" ad={ad} />
            <form action={deleteAdAction} className="mt-3 border-t border-[var(--border)] pt-3">
              <input type="hidden" name="id" value={ad.id} />
              <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-black text-red-700">Delete advertisement</button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}

type AdRow = Awaited<ReturnType<typeof listAds>>[number];

function AdForm({ action, submitLabel, ad }: { action: (data: FormData) => void | Promise<void>; submitLabel: string; ad?: AdRow }) {
  return (
    <form action={action} className="grid gap-4" encType="multipart/form-data">
      {ad ? <input type="hidden" name="id" value={ad.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Internal name"><input name="name" required maxLength={120} defaultValue={ad?.name} className={inputClass} /></Field>
        <Field label="Type"><select name="kind" defaultValue={ad?.kind ?? "static"} className={inputClass}><option value="static">Static banner</option><option value="exoclick">ExoClick code</option></select></Field>
        <Field label="Placement"><select name="position" defaultValue={ad?.position ?? "header"} className={inputClass}><option value="header">Top, below header</option><option value="content">Between home sections</option></select></Field>
        <Field label="Web / PWA target"><select name="surface" defaultValue={ad?.surface ?? "both"} className={inputClass}><option value="both">Web + PWA</option><option value="web">Web only</option><option value="pwa">PWA only</option></select></Field>
        <Field label="Language advertising set"><select name="locale" defaultValue={ad?.locale ?? ""} className={inputClass}><option value="">Main / default ads</option>{locales.map((locale) => <option key={locale} value={locale}>{localeFlags[locale]} {localeLabels[locale]}</option>)}</select></Field>
        <Field label="Enabled"><label className="flex h-11 items-center gap-2 rounded-lg border p-3 font-bold"><input name="isActive" type="checkbox" defaultChecked={ad?.isActive ?? true} /> Active</label></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Static image (PNG, JPEG, GIF, WebP, AVIF; max 10 MB)"><input name="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" className={inputClass} /></Field>
        <Field label="Click URL"><input name="clickUrl" type="url" placeholder="https://..." defaultValue={ad?.clickUrl ?? ""} className={inputClass} /></Field>
        <Field label="Image alt text"><input name="altText" maxLength={240} defaultValue={ad?.altText ?? ""} className={inputClass} /></Field>
        <Field label="ExoClick embed code"><textarea name="embedCode" rows={5} maxLength={20000} defaultValue={ad?.embedCode ?? ""} placeholder="Paste the complete ExoClick zone code" className={inputClass} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField label="Width" name="width" value={ad?.width ?? 728} min={1} max={4000} />
        <NumberField label="Height" name="height" value={ad?.height ?? 90} min={1} max={2000} />
        <NumberField label="Insert after section" name="insertAfter" value={ad?.insertAfter ?? 1} min={1} max={20} />
        <NumberField label="Sort order" name="sortOrder" value={ad?.sortOrder ?? 0} min={0} max={1000} />
      </div>
      {ad?.imageUrl ? <p className="text-xs font-bold text-[var(--muted)]">Current image: {ad.imageUrl}</p> : null}
      <button className="w-fit rounded-lg bg-[var(--accent)] px-5 py-3 font-black text-white">{submitLabel}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-black"><span>{label}</span>{children}</label>; }
function NumberField({ label, name, value, min, max }: { label: string; name: string; value: number; min: number; max: number }) { return <Field label={label}><input name={name} type="number" required min={min} max={max} defaultValue={value} className={inputClass} /></Field>; }
function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) { return <p className={`rounded-lg border p-4 text-sm font-bold ${tone === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>{children}</p>; }
const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-medium";

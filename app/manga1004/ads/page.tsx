import { listAds } from "@/lib/db/queries/ads";
import { createAdAction, deleteAdAction, updateAdAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [ads, query] = await Promise.all([listAds(), searchParams]);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-black">Advertisements</h1>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">Manage uploaded static banners and trusted ExoClick embed code.</p>
      </div>
      {query.saved ? <Notice tone="success">Advertisement saved.</Notice> : null}
      {query.error ? <Notice tone="error">Unable to save. Check the required content, URL, image format, and 10 MB limit.</Notice> : null}

      <AdForm action={createAdAction} submitLabel="Create advertisement" />

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Internal name"><input name="name" required maxLength={120} defaultValue={ad?.name} className={inputClass} /></Field>
        <Field label="Type"><select name="kind" defaultValue={ad?.kind ?? "static"} className={inputClass}><option value="static">Static banner</option><option value="exoclick">ExoClick code</option></select></Field>
        <Field label="Placement"><select name="position" defaultValue={ad?.position ?? "header"} className={inputClass}><option value="header">Top, below header</option><option value="content">Between home sections</option></select></Field>
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

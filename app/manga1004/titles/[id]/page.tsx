import { notFound } from "next/navigation";
import { getAdminTitleById, isDatabaseConfigured } from "@/lib/data/source";
import { updateTitleAction } from "../actions";
import { TitleForm } from "../title-form";
import { generateSeoAction } from "./seo-actions";
import { getTitlePublishingState } from "@/lib/db/queries/media";
import { publishTitleAction, uploadCoverAction } from "../../media-actions";
import { TitleSetupSteps } from "@/components/admin/title-setup-steps";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTitleEditPage({ params, searchParams }: PageProps & { searchParams: Promise<{ seoGenerated?: string; seoError?: string; mediaSaved?: string; mediaError?: string; setup?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const title = await getAdminTitleById(id);
  if (!title) {
    notFound();
  }
  const updateAction = updateTitleAction.bind(null, title.id);
  const writesEnabled = isDatabaseConfigured();
  const generateAction = generateSeoAction.bind(null, title.id);
  const publishing = await getTitlePublishingState(title.id);
  const setupStep = query.setup === "cover" ? 2 : query.setup === "chapter" ? 3 : query.setup === "seo" || query.setup === "complete" ? 5 : null;
  const regularEdit = !query.setup;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">{title.values.originalTitle}</h1>
      {setupStep ? <TitleSetupSteps current={setupStep} /> : null}
      {query.setup === "chapter" ? (
        <section className="mt-5 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Cover complete</p>
          <h2 className="mt-2 text-xl font-black">Now add the first chapter</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Create the chapter record first, then upload a ZIP or multiple page images.</p>
          <Link href={`/manga1004/chapters/new?title=${title.id}&setup=1`} className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white">Continue to chapter</Link>
        </section>
      ) : null}
      {query.setup === "complete" ? <p className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">Setup complete. This title is now live on the public site.</p> : null}
      {regularEdit || query.setup === "seo" || query.setup === "complete" ? <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div><p className="text-xs font-black uppercase text-[var(--accent)]">Site visibility</p><p className="mt-1 text-sm font-bold">{publishing?.publishedAt ? "Published on the public catalog" : publishing?.reason ?? "Draft"}</p></div>
        {!publishing?.publishedAt ? <form action={publishTitleAction.bind(null, title.id)}>{query.setup ? <input type="hidden" name="setup" value="1" /> : null}<button disabled={!publishing?.ready} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Publish to site</button></form> : <span className="rounded-full bg-green-100 px-3 py-2 text-xs font-black text-green-800">LIVE</span>}
      </section> : null}
      {regularEdit || query.setup === "seo" ? <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">DeepSeek SEO</h2>
            <p className="text-sm text-[var(--muted)]">Generate English and Spanish metadata, then review it in the form below.</p>
          </div>
          <form action={generateAction}>
            {query.setup ? <input type="hidden" name="setup" value="1" /> : null}
            <button disabled={!writesEnabled} className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-black text-[var(--background)] disabled:opacity-50">
              Generate SEO
            </button>
          </form>
        </div>
        {query.seoGenerated ? <p className="mt-3 text-sm font-bold text-green-700">SEO metadata generated and saved. Review it below.</p> : null}
        {query.seoError ? <p className="mt-3 text-sm font-bold text-red-700">{query.seoError}</p> : null}
      </div> : null}
      {regularEdit || query.setup === "cover" ? <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div><h2 className="text-lg font-black">Cover image</h2><p className="mt-1 text-sm text-[var(--muted)]">Uploaded to the configured {title.values.format === "manhwa" ? "Manhwa" : "Manga"} B2 bucket and delivered through Bunny CDN.</p></div>
        {query.mediaSaved === "cover" ? <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">Cover uploaded and connected.</p> : null}
        {query.mediaError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{query.mediaError}</p> : null}
        <form action={uploadCoverAction.bind(null, title.id)} className="mt-4 flex flex-wrap items-end gap-3">
          {query.setup ? <input type="hidden" name="setup" value="1" /> : null}
          <label className="grid flex-1 gap-1.5 text-sm font-black"><span>JPG, PNG, WebP or AVIF · max 25 MB</span><input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/avif" required className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" /></label>
          <button className="rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)]">{query.setup === "cover" ? "Upload and continue" : "Upload cover"}</button>
        </form>
      </section> : null}
      {query.setup ? (
        <details className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <summary className="cursor-pointer font-black">Advanced title and localization settings</summary>
          <p className="mt-2 text-sm text-[var(--muted)]">Optional: edit slugs, translations and detailed metadata.</p>
          <TitleForm action={updateAction} initialState={{ values: title.values }} submitLabel="Save advanced settings" writesEnabled={writesEnabled} />
        </details>
      ) : <TitleForm action={updateAction} initialState={{ values: title.values }} submitLabel="Save Title" writesEnabled={writesEnabled} />}
    </main>
  );
}

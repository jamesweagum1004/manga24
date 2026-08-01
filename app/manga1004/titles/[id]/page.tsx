import { notFound } from "next/navigation";
import { getAdminTitleById, isDatabaseConfigured } from "@/lib/data/source";
import { updateTitleAction } from "../actions";
import { TitleForm } from "../title-form";
import { generateSeoAction } from "./seo-actions";
import { getTitlePublishingState } from "@/lib/db/queries/media";
import { publishTitleAction, uploadCoverAction } from "../../media-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTitleEditPage({ params, searchParams }: PageProps & { searchParams: Promise<{ seoGenerated?: string; seoError?: string; mediaSaved?: string; mediaError?: string }> }) {
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">{title.values.originalTitle}</h1>
      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div><p className="text-xs font-black uppercase text-[var(--accent)]">Site visibility</p><p className="mt-1 text-sm font-bold">{publishing?.publishedAt ? "Published on the public catalog" : publishing?.reason ?? "Draft"}</p></div>
        {!publishing?.publishedAt ? <form action={publishTitleAction.bind(null, title.id)}><button disabled={!publishing?.ready} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Publish to site</button></form> : <span className="rounded-full bg-green-100 px-3 py-2 text-xs font-black text-green-800">LIVE</span>}
      </section>
      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">DeepSeek SEO</h2>
            <p className="text-sm text-[var(--muted)]">Generate English and Spanish metadata, then review it in the form below.</p>
          </div>
          <form action={generateAction}>
            <button disabled={!writesEnabled} className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-black text-[var(--background)] disabled:opacity-50">
              Generate SEO
            </button>
          </form>
        </div>
        {query.seoGenerated ? <p className="mt-3 text-sm font-bold text-green-700">SEO metadata generated and saved. Review it below.</p> : null}
        {query.seoError ? <p className="mt-3 text-sm font-bold text-red-700">{query.seoError}</p> : null}
      </div>
      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div><h2 className="text-lg font-black">Cover image</h2><p className="mt-1 text-sm text-[var(--muted)]">Uploaded to the configured {title.values.format === "manhwa" ? "Manhwa" : "Manga"} B2 bucket and delivered through Bunny CDN.</p></div>
        {query.mediaSaved === "cover" ? <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">Cover uploaded and connected.</p> : null}
        {query.mediaError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{query.mediaError}</p> : null}
        <form action={uploadCoverAction.bind(null, title.id)} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid flex-1 gap-1.5 text-sm font-black"><span>JPG, PNG, WebP or AVIF · max 25 MB</span><input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/avif" required className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" /></label>
          <button className="rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-black text-[var(--background)]">Upload cover</button>
        </form>
      </section>
      <TitleForm
        action={updateAction}
        initialState={{ values: title.values }}
        submitLabel="Save Title"
        writesEnabled={writesEnabled}
      />
    </main>
  );
}

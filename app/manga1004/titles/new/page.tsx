import { isDatabaseConfigured } from "@/lib/data/source";
import { TitleSetupSteps } from "@/components/admin/title-setup-steps";
import { QuickTitleForm } from "./quick-title-form";

export const dynamic = "force-dynamic";

export default function AdminNewTitlePage() {
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Manual upload</p>
      <h1 className="mt-2 text-3xl font-black">Add a new title</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Start with only the essentials. You can add the cover, chapter pages and SEO in the next steps.</p>
      <TitleSetupSteps current={1} />
      <QuickTitleForm writesEnabled={writesEnabled} />
    </main>
  );
}

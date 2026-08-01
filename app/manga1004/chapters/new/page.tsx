import Link from "next/link";
import { getAdminTitleList } from "@/lib/data/source";
import { emptyChapterFormValues } from "@/lib/db/queries/chapters";
import { createChapterAction } from "../actions";
import { ChapterForm } from "../chapter-form";
import { TitleSetupSteps } from "@/components/admin/title-setup-steps";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({ searchParams }: { searchParams: Promise<{ title?: string; setup?: string }> }) {
  const [titles, query] = await Promise.all([getAdminTitleList(), searchParams]);
  const selected = titles.some((title) => title.id === query.title) ? query.title! : "";
  const setup = query.setup === "1";
  return <main className="mx-auto max-w-4xl px-4 py-8"><Link href="/manga1004/chapters" className="text-sm font-bold text-[var(--accent)]">← Back to chapters</Link><h1 className="mt-3 text-3xl font-black">{setup ? "Add the first chapter" : "New Chapter"}</h1><p className="mt-2 text-sm text-[var(--muted)]">Enter the chapter number. The next screen lets you upload one ZIP or multiple images.</p>{setup ? <TitleSetupSteps current={3} /> : null}<ChapterForm action={createChapterAction} initialState={{ values: { ...emptyChapterFormValues, titleId: selected } }} titles={titles} submitLabel={setup ? "Continue to page upload" : "Create chapter"} setup={setup} /></main>;
}

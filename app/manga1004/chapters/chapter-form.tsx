"use client";

import { useActionState } from "react";
import type { AdminTitleListItem } from "@/lib/db/queries/titles";
import type { ChapterFormState } from "./actions";

export function ChapterForm({ action, initialState, titles, submitLabel, setup = false }: {
  action: (state: ChapterFormState, data: FormData) => Promise<ChapterFormState>;
  initialState: ChapterFormState;
  titles: AdminTitleListItem[];
  submitLabel: string;
  setup?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      {setup ? <input type="hidden" name="setup" value="1" /> : null}
      {state.formError ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{state.formError}</p> : null}
      <section>
        <h2 className="text-lg font-black">Chapter details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={state.errors?.titleId}><select name="titleId" required defaultValue={state.values.titleId} className={inputClass}><option value="">Choose a title</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.format === "manhwa" ? "Manhwa" : "Manga"} · {title.originalTitle}</option>)}</select></Field>
          <Field label="Chapter number" error={state.errors?.chapterNumber}><input name="chapterNumber" required defaultValue={state.values.chapterNumber} className={inputClass} /></Field>
          <Field label="Canonical slug" error={state.errors?.canonicalSlug}><input name="canonicalSlug" required defaultValue={state.values.canonicalSlug} className={inputClass} /></Field>
          <Field label="Publication status" error={state.errors?.publicationStatus}><select name="publicationStatus" defaultValue={state.values.publicationStatus} className={inputClass}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-black">Localized titles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="English title" error={state.errors?.enTitle}><input name="enTitle" required defaultValue={state.values.enTitle} className={inputClass} /></Field>
          <Field label="Spanish title" error={state.errors?.esTitle}><input name="esTitle" required defaultValue={state.values.esTitle} className={inputClass} /></Field>
        </div>
      </section>
      <button disabled={pending} className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white shadow-sm disabled:opacity-50">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-black"><span>{label}</span>{children}{error?.map((message) => <span key={message} className="text-xs text-red-600">{message}</span>)}</label>;
}
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

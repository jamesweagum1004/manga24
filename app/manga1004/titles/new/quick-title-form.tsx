"use client";

import { useActionState } from "react";
import { createTitleWizardAction, type QuickTitleState } from "../wizard-actions";

const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

export function QuickTitleForm({ writesEnabled }: { writesEnabled: boolean }) {
  const [state, action, pending] = useActionState(createTitleWizardAction, {} as QuickTitleState);
  return <form action={action} className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
    {state.error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{state.error}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Original title"><input name="originalTitle" required maxLength={240} className={inputClass} /></Field><Field label="Author"><input name="authorName" required maxLength={160} className={inputClass} /></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Content type"><select name="format" className={inputClass}><option value="manga">Manga</option><option value="manhwa">Manhwa</option></select></Field><Field label="Rating"><select name="contentRating" className={inputClass}><option value="mature_18">18+</option><option value="safe">Safe</option></select></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Original language"><input name="originalLanguage" defaultValue="ja" required maxLength={16} className={inputClass} /></Field><Field label="Series status"><select name="publicationStatus" className={inputClass}><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="hiatus">Hiatus</option><option value="cancelled">Cancelled</option></select></Field></div>
    <Field label="Short description"><textarea name="description" required minLength={10} maxLength={4000} rows={5} className={inputClass} placeholder="Enter the source synopsis. You can refine translations and SEO later." /></Field>
    <Field label="Tags (optional)"><input name="tags" className={inputClass} placeholder="romance, fantasy, drama" /></Field>
    <p className="text-xs leading-5 text-[var(--muted)]">The slug and initial English/Spanish records are created automatically. Advanced metadata remains editable after setup.</p>
    <button disabled={!writesEnabled || pending} className="w-fit rounded-xl bg-[var(--accent)] px-6 py-3 font-black text-white disabled:opacity-40">{pending ? "Creating…" : "Save and upload cover →"}</button>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-black"><span>{label}</span>{children}</label>; }

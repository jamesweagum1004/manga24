"use client";

import { useActionState } from "react";
import { submitReportAction, type PublicReportState } from "./actions";

export function ReportForm({ targetType, targetKey, targetUrl }: { targetType: string; targetKey: string; targetUrl: string }) {
  const [state, action, pending] = useActionState(submitReportAction, {} as PublicReportState);
  if (state.success) return <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-6"><h2 className="text-xl font-black text-green-900">Report received</h2><p className="mt-2 text-sm text-green-800">Reference: {state.reference}. The report will be reviewed; submission does not automatically remove content.</p></div>;
  return (
    <form action={action} className="mt-6 grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetKey" value={targetKey} /><input type="hidden" name="targetUrl" value={targetUrl} />
      <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {state.error ? <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{state.error}</p> : null}
      <Field label="Reason"><select name="reason" required className={inputClass}><option value="">Choose a reason</option><option value="child_safety">Suspected sexual content involving a minor</option><option value="copyright">Copyright infringement / legal notice</option><option value="privacy">Privacy or non-consensual content</option><option value="wrong_rating">Incorrect age rating or tags</option><option value="broken">Broken or incorrect chapter</option><option value="spam">Spam or malicious link</option><option value="other">Other</option></select></Field>
      <Field label="Details"><textarea name="details" required minLength={10} maxLength={5000} rows={6} className={inputClass} placeholder="Identify the exact issue and location. Do not upload or reproduce suspected illegal material." /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Your name (required for copyright)"><input name="reporterName" maxLength={160} className={inputClass} /></Field><Field label="Email (required for copyright)"><input name="reporterEmail" type="email" maxLength={320} className={inputClass} /></Field></div>
      <details className="rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer font-black">Copyright notice details</summary><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Complete all fields when submitting a copyright claim. A valid legal notice may require additional jurisdiction-specific information.</p><div className="mt-4 grid gap-4"><Field label="Rights holder or authorized representative"><input name="rightsHolder" maxLength={240} className={inputClass} /></Field><Field label="Original copyrighted work"><textarea name="originalWork" rows={3} maxLength={3000} className={inputClass} /></Field><Field label="Electronic signature (full legal name)"><input name="signature" maxLength={240} className={inputClass} /></Field></div></details>
      <label className="flex gap-3 text-xs leading-5 text-[var(--muted)]"><input type="checkbox" required className="mt-1" /><span>I confirm this report is submitted in good faith and the information is accurate to the best of my knowledge.</span></label>
      <button disabled={pending} className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 font-black text-white disabled:opacity-50">{pending ? "Submitting…" : "Submit report"}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-black"><span>{label}</span>{children}</label>; }
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-medium";

"use client";

import { useActionState } from "react";
import type { TitleFormState } from "./actions";

type TitleFormProps = {
  action: (state: TitleFormState, formData: FormData) => Promise<TitleFormState>;
  initialState: TitleFormState;
  submitLabel: string;
  writesEnabled: boolean;
};

const publicationStatusOptions = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" }
];

const contentRatingOptions = [
  { value: "safe", label: "Safe" },
  { value: "mature_18", label: "18+" }
];

export function TitleForm({ action, initialState, submitLabel, writesEnabled }: TitleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = pending || !writesEnabled;

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {!writesEnabled || state.formError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {state.formError ?? "Database is not configured. Set DATABASE_URL to enable writes."}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black">Canonical Metadata</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Canonical slug" name="canonicalSlug" value={state.values.canonicalSlug} errors={state.errors?.canonicalSlug} disabled={disabled} />
          <TextField label="Original title" name="originalTitle" value={state.values.originalTitle} errors={state.errors?.originalTitle} disabled={disabled} />
          <TextField label="Author name" name="authorName" value={state.values.authorName} errors={state.errors?.authorName} disabled={disabled} />
          <TextField label="Original language" name="originalLanguage" value={state.values.originalLanguage} errors={state.errors?.originalLanguage} disabled={disabled} />
          <SelectField
            label="Content rating"
            name="contentRating"
            value={state.values.contentRating}
            options={contentRatingOptions}
            errors={state.errors?.contentRating}
            disabled={disabled}
          />
          <SelectField
            label="Publication status"
            name="publicationStatus"
            value={state.values.publicationStatus}
            options={publicationStatusOptions}
            errors={state.errors?.publicationStatus}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black">English Localization</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="English title" name="enTitle" value={state.values.enTitle} errors={state.errors?.enTitle} disabled={disabled} />
          <TextField label="English slug" name="enSlug" value={state.values.enSlug} errors={state.errors?.enSlug} disabled={disabled} />
        </div>
        <TextAreaField label="English description" name="enDescription" value={state.values.enDescription} errors={state.errors?.enDescription} disabled={disabled} />
      </section>

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black">Spanish Localization</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Spanish title" name="esTitle" value={state.values.esTitle} errors={state.errors?.esTitle} disabled={disabled} />
          <TextField label="Spanish slug" name="esSlug" value={state.values.esSlug} errors={state.errors?.esSlug} disabled={disabled} />
        </div>
        <TextAreaField label="Spanish description" name="esDescription" value={state.values.esDescription} errors={state.errors?.esDescription} disabled={disabled} />
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  value,
  errors,
  disabled
}: {
  label: string;
  name: string;
  value: string;
  errors?: string[];
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <input
        name={name}
        defaultValue={value}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold outline-none focus:border-[var(--accent)] disabled:opacity-70"
      />
      <FieldErrors errors={errors} />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  errors,
  disabled
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  errors?: string[];
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <select
        name={name}
        defaultValue={value}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold outline-none focus:border-[var(--accent)] disabled:opacity-70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldErrors errors={errors} />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  errors,
  disabled
}: {
  label: string;
  name: string;
  value: string;
  errors?: string[];
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <textarea
        name={name}
        defaultValue={value}
        disabled={disabled}
        rows={5}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[var(--accent)] disabled:opacity-70"
      />
      <FieldErrors errors={errors} />
    </label>
  );
}

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <span className="text-xs font-bold text-red-600">{errors[0]}</span>;
}

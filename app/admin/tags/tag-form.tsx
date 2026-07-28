"use client";

import { useActionState } from "react";
import type { TagFormState } from "./actions";

type TagFormProps = {
  action: (state: TagFormState, formData: FormData) => Promise<TagFormState>;
  initialState: TagFormState;
  writesEnabled: boolean;
};

export function TagForm({ action, initialState, writesEnabled }: TagFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = pending || !writesEnabled;

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-lg font-black">New Tag</h2>
      {!writesEnabled || state.formError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {state.formError ?? "Database is not configured. Set DATABASE_URL to enable writes."}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Slug" name="slug" value={state.values.slug} errors={state.errors?.slug} disabled={disabled} />
        <TextField label="Name" name="name" value={state.values.name} errors={state.errors?.name} disabled={disabled} />
        <TextField
          label="Category"
          name="category"
          value={state.values.category}
          errors={state.errors?.category}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create Tag"}
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
      {errors?.length ? <span className="text-xs font-bold text-red-600">{errors[0]}</span> : null}
    </label>
  );
}

"use client";

import { useActionState } from "react";
import type { TitleFormState } from "./actions";
import { displayLocalesForOriginalLanguage, getDisplayLocaleForOriginalLanguage, localeFlags, localeLabels, locales } from "@/lib/i18n";

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

const formatOptions = [
  { value: "manga", label: "Manga (Japanese comics)" },
  { value: "manhwa", label: "Manhwa (Korean comics)" }
];

export function TitleForm({ action, initialState, submitLabel, writesEnabled }: TitleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = pending || !writesEnabled;
  const displayLocales = displayLocalesForOriginalLanguage(state.values.originalLanguage, state.values.displayLocales);
  const handleOriginalLanguageChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const selected = getDisplayLocaleForOriginalLanguage(event.currentTarget.value);
    if (!selected) return;
    for (const locale of locales) {
      const checkbox = event.currentTarget.form?.elements.namedItem(`displayLocale_${locale}`);
      if (checkbox instanceof HTMLInputElement) checkbox.checked = locale === selected;
    }
  };

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
          <TextField label="Original language" name="originalLanguage" value={state.values.originalLanguage} errors={state.errors?.originalLanguage} disabled={disabled} onChange={handleOriginalLanguageChange} />
          <SelectField
            label="Content folder"
            name="format"
            value={state.values.format}
            options={formatOptions}
            errors={state.errors?.format}
            disabled={disabled}
          />
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
        <fieldset className="rounded-xl border border-[var(--border)] p-4">
          <legend className="px-2 text-sm font-black">Display languages</legend>
          <p className="mb-3 text-xs font-bold text-[var(--muted)]">The title only appears on the selected language sites. This is separate from the original language.</p>
          <div className="flex flex-wrap gap-3">
            {locales.map((locale) => (
              <label key={locale} className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-bold">
                <input type="checkbox" name={`displayLocale_${locale}`} defaultChecked={displayLocales.includes(locale)} disabled={disabled} />
                <span>{localeFlags[locale]} {localeLabels[locale]}</span>
              </label>
            ))}
          </div>
          {state.errors?.displayLocales?.map((error) => <p key={error} className="mt-2 text-xs font-bold text-red-700">{error}</p>)}
        </fieldset>
        <TextField
          label="Tags"
          name="tags"
          value={state.values.tags}
          errors={state.errors?.tags}
          disabled={disabled}
          hint="Comma-separated slugs, optional"
        />
      </section>

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div>
          <h2 className="text-lg font-black">SEO Metadata</h2>
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">Generate with DeepSeek from the edit page, then review and save here.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="English SEO title" name="enSeoTitle" value={state.values.enSeoTitle} errors={state.errors?.enSeoTitle} disabled={disabled} hint="Recommended: 50–60 characters" />
          <TextField label="Spanish SEO title" name="esSeoTitle" value={state.values.esSeoTitle} errors={state.errors?.esSeoTitle} disabled={disabled} hint="Recommended: 50–60 characters" />
        </div>
        <TextAreaField label="English SEO description" name="enSeoDescription" value={state.values.enSeoDescription} errors={state.errors?.enSeoDescription} disabled={disabled} />
        <TextField label="English keywords" name="enSeoKeywords" value={state.values.enSeoKeywords} errors={state.errors?.enSeoKeywords} disabled={disabled} hint="Comma-separated" />
        <TextAreaField label="Spanish SEO description" name="esSeoDescription" value={state.values.esSeoDescription} errors={state.errors?.esSeoDescription} disabled={disabled} />
        <TextField label="Spanish keywords" name="esSeoKeywords" value={state.values.esSeoKeywords} errors={state.errors?.esSeoKeywords} disabled={disabled} hint="Comma-separated" />
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="French SEO title" name="frSeoTitle" value={state.values.frSeoTitle} errors={state.errors?.frSeoTitle} disabled={disabled} /><TextField label="French keywords" name="frSeoKeywords" value={state.values.frSeoKeywords} errors={state.errors?.frSeoKeywords} disabled={disabled} /></div>
        <TextAreaField label="French SEO description" name="frSeoDescription" value={state.values.frSeoDescription} errors={state.errors?.frSeoDescription} disabled={disabled} />
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="German SEO title" name="deSeoTitle" value={state.values.deSeoTitle} errors={state.errors?.deSeoTitle} disabled={disabled} /><TextField label="German keywords" name="deSeoKeywords" value={state.values.deSeoKeywords} errors={state.errors?.deSeoKeywords} disabled={disabled} /></div>
        <TextAreaField label="German SEO description" name="deSeoDescription" value={state.values.deSeoDescription} errors={state.errors?.deSeoDescription} disabled={disabled} />
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="Portuguese SEO title" name="ptSeoTitle" value={state.values.ptSeoTitle} errors={state.errors?.ptSeoTitle} disabled={disabled} /><TextField label="Portuguese keywords" name="ptSeoKeywords" value={state.values.ptSeoKeywords} errors={state.errors?.ptSeoKeywords} disabled={disabled} /></div>
        <TextAreaField label="Portuguese SEO description" name="ptSeoDescription" value={state.values.ptSeoDescription} errors={state.errors?.ptSeoDescription} disabled={disabled} />
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

      <LocalizationSection language="French" prefix="fr" values={state.values} errors={state.errors} disabled={disabled} />
      <LocalizationSection language="German" prefix="de" values={state.values} errors={state.errors} disabled={disabled} />
      <LocalizationSection language="Portuguese" prefix="pt" values={state.values} errors={state.errors} disabled={disabled} />

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

function LocalizationSection({ language, prefix, values, errors, disabled }: { language: string; prefix: "fr" | "de" | "pt"; values: TitleFormState["values"]; errors: TitleFormState["errors"]; disabled: boolean }) {
  const titleKey = `${prefix}Title` as const;
  const slugKey = `${prefix}Slug` as const;
  const descriptionKey = `${prefix}Description` as const;
  return <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-black">{language} Localization</h2><div className="grid gap-4 sm:grid-cols-2"><TextField label={`${language} title`} name={titleKey} value={values[titleKey]} errors={errors?.[titleKey]} disabled={disabled} /><TextField label={`${language} slug`} name={slugKey} value={values[slugKey]} errors={errors?.[slugKey]} disabled={disabled} /></div><TextAreaField label={`${language} description`} name={descriptionKey} value={values[descriptionKey]} errors={errors?.[descriptionKey]} disabled={disabled} /></section>;
}

function TextField({
  label,
  name,
  value,
  errors,
  disabled,
  hint,
  onChange
}: {
  label: string;
  name: string;
  value: string;
  errors?: string[];
  disabled: boolean;
  hint?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <input
        name={name}
        defaultValue={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-bold outline-none focus:border-[var(--accent)] disabled:opacity-70"
      />
      {hint ? <span className="text-xs font-bold text-[var(--muted)]">{hint}</span> : null}
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

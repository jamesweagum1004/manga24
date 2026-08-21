"use client";

import { useEffect, useState } from "react";

type BulkOption = {
  value: string;
  label: string;
  destructive?: boolean;
};

export function BulkActionToolbar({
  formId,
  checkboxName,
  options,
  localeOptions
}: {
  formId: string;
  checkboxName: string;
  options: BulkOption[];
  localeOptions?: { value: string; label: string }[];
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [action, setAction] = useState("");
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);

  useEffect(() => {
    const selector = `input[name="${checkboxName}"][form="${formId}"]`;
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
    const update = () => setSelectedCount(inputs.filter((input) => input.checked).length);
    inputs.forEach((input) => input.addEventListener("change", update));
    update();
    return () => inputs.forEach((input) => input.removeEventListener("change", update));
  }, [checkboxName, formId]);

  const toggleAll = (checked: boolean) => {
    document
      .querySelectorAll<HTMLInputElement>(`input[name="${checkboxName}"][form="${formId}"]`)
      .forEach((input) => {
        input.checked = checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
  };

  const selectedOption = options.find((option) => option.value === action);
  const localeSelectionRequired = action === "set-locales";
  const submitDisabled = selectedCount === 0 || !action || (localeSelectionRequired && selectedLocales.length === 0);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-black">
        <input
          type="checkbox"
          checked={selectedCount > 0 && selectedCount === documentSelectionCount(formId, checkboxName)}
          onChange={(event) => toggleAll(event.target.checked)}
          className="h-5 w-5 accent-[var(--accent)]"
        />
        Select all
      </label>
      <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-black text-[var(--muted)]">
        {selectedCount} selected
      </span>
      <select
        name="bulkAction"
        form={formId}
        value={action}
        onChange={(event) => setAction(event.target.value)}
        className="min-w-56 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-black"
      >
        <option value="">Choose a bulk action</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {localeSelectionRequired && localeOptions ? (
        <fieldset className="order-last flex w-full flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <legend className="px-1 text-xs font-black">Replace display languages with</legend>
          {localeOptions.map((locale) => (
            <label key={locale.value} className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm font-black">
              <input
                type="checkbox"
                name="displayLocales"
                value={locale.value}
                form={formId}
                checked={selectedLocales.includes(locale.value)}
                onChange={(event) => setSelectedLocales((current) => event.target.checked ? [...current, locale.value] : current.filter((value) => value !== locale.value))}
                className="h-5 w-5 accent-[var(--accent)]"
              />
              {locale.label}
            </label>
          ))}
          {selectedLocales.length === 0 ? <p className="w-full text-xs font-bold text-amber-700">Choose at least one language.</p> : null}
        </fieldset>
      ) : null}
      <button
        type="submit"
        form={formId}
        disabled={submitDisabled}
        onClick={(event) => {
          if (submitDisabled || !selectedOption) {
            event.preventDefault();
            return;
          }
          const message = selectedOption.destructive
            ? `Permanently delete ${selectedCount} selected item(s)? This cannot be undone.`
            : `Apply “${selectedOption.label}” to ${selectedCount} selected item(s)?`;
          if (!window.confirm(message)) event.preventDefault();
        }}
        className={`rounded-xl px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40 ${selectedOption?.destructive ? "bg-red-700" : "bg-[var(--foreground)]"}`}
      >
        Apply
      </button>
    </div>
  );
}

function documentSelectionCount(formId: string, checkboxName: string) {
  if (typeof document === "undefined") return 0;
  return document.querySelectorAll(`input[name="${checkboxName}"][form="${formId}"]`).length;
}

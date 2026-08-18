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
  options
}: {
  formId: string;
  checkboxName: string;
  options: BulkOption[];
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [action, setAction] = useState("");

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
      <button
        type="submit"
        form={formId}
        disabled={selectedCount === 0 || !action}
        onClick={(event) => {
          if (selectedCount === 0 || !selectedOption) {
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

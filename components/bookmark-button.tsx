"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { LIBRARY_CHANGED_EVENT, readStoredItems, removeStoredItem, SAVED_TITLES_KEY, upsertStoredItem, type LibraryTitle } from "@/lib/library";

const labels: Record<Locale, { save: string; saved: string }> = {
  en: { save: "Save", saved: "Saved" }, es: { save: "Guardar", saved: "Guardado" }, fr: { save: "Enregistrer", saved: "Enregistré" }, de: { save: "Merken", saved: "Gespeichert" }, pt: { save: "Salvar", saved: "Salvo" }
};

export function BookmarkButton({ item }: { item: Omit<LibraryTitle, "updatedAt"> }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const update = () => setSaved(readStoredItems<LibraryTitle>(SAVED_TITLES_KEY).some((entry) => entry.locale === item.locale && entry.titleSlug === item.titleSlug));
    update();
    window.addEventListener(LIBRARY_CHANGED_EVENT, update);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, update);
  }, [item.locale, item.titleSlug]);

  function toggle() {
    if (saved) removeStoredItem(SAVED_TITLES_KEY, item.locale, item.titleSlug);
    else upsertStoredItem(SAVED_TITLES_KEY, { ...item, updatedAt: Date.now() });
  }

  return <button type="button" aria-pressed={saved} onClick={toggle} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition active:scale-95 ${saved ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)]" : "border-[var(--border)] bg-[var(--surface)]"}`}><BookmarkIcon filled={saved} />{saved ? labels[item.locale].saved : labels[item.locale].save}</button>;
}

function BookmarkIcon({ filled }: { filled: boolean }) { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4Z" /></svg>; }

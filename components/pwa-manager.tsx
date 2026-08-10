"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const streakKey = "manga24:pwa-read-streak:v1";
const dismissedKey = "manga24:pwa-prompt-dismissed:v1";
const dismissedForMs = 14 * 24 * 60 * 60 * 1000;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const copy: Record<Locale, { message: string; install: string; later: string; ios: string }> = {
  en: { message: "Add Manga24 to your home screen and resume in one second without the address bar.", install: "Install", later: "Later", ios: "Use your browser menu to add Manga24 to the home screen." },
  es: { message: "Añade Manga24 a tu pantalla de inicio y continúa en un segundo, sin barra de direcciones.", install: "Instalar", later: "Más tarde", ios: "Usa el menú del navegador para añadir Manga24 a la pantalla de inicio." },
  fr: { message: "Ajoutez Manga24 à l’écran d’accueil et reprenez en une seconde, sans barre d’adresse.", install: "Installer", later: "Plus tard", ios: "Utilisez le menu du navigateur pour ajouter Manga24 à l’écran d’accueil." },
  de: { message: "Füge Manga24 zum Startbildschirm hinzu und lies in einer Sekunde ohne Adressleiste weiter.", install: "Installieren", later: "Später", ios: "Füge Manga24 über das Browsermenü zum Startbildschirm hinzu." },
  pt: { message: "Adicione o Manga24 à tela inicial e continue em um segundo, sem a barra de endereço.", install: "Instalar", later: "Mais tarde", ios: "Use o menu do navegador para adicionar o Manga24 à tela inicial." }
};

export function PwaManager({ locale, enabled, promptEnabled, threshold }: { locale: Locale; enabled: boolean; promptEnabled: boolean; threshold: 3 | 4 | 5 }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (enabled) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    else navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!enabled || !promptEnabled || !pathname.includes("/chapter/") || window.matchMedia("(display-mode: standalone)").matches) return;
    function maybeShow(event?: Event) {
      const eventCount = event instanceof CustomEvent && typeof event.detail?.count === "number" ? event.detail.count : 0;
      let storedCount = 0;
      try { storedCount = JSON.parse(window.localStorage.getItem(streakKey) ?? "{}").count ?? 0; } catch { storedCount = 0; }
      const dismissedAt = Number(window.localStorage.getItem(dismissedKey) ?? 0);
      if (Math.max(eventCount, storedCount) >= threshold && Date.now() - dismissedAt > dismissedForMs) setVisible(true);
    }
    maybeShow();
    window.addEventListener("manga24:pwa-read", maybeShow);
    return () => window.removeEventListener("manga24:pwa-read", maybeShow);
  }, [enabled, pathname, promptEnabled, threshold]);

  if (!enabled || !promptEnabled || !visible) return null;
  const text = copy[locale];
  return (
    <aside role="status" className="fixed inset-x-3 bottom-20 z-[55] mx-auto max-w-md rounded-2xl border border-white/15 bg-[#17191d]/95 p-4 text-white shadow-2xl backdrop-blur-xl md:bottom-5">
      <p className="text-sm font-black leading-5">{text.message}</p>
      {!installPrompt ? <p className="mt-1 text-xs leading-5 text-white/60">{text.ios}</p> : null}
      <div className="mt-3 flex gap-2">
        {installPrompt ? <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black" onClick={async () => { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === "accepted") setVisible(false); setInstallPrompt(null); }}>{text.install}</button> : null}
        <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black" onClick={() => { window.localStorage.setItem(dismissedKey, String(Date.now())); setVisible(false); }}>{text.later}</button>
      </div>
    </aside>
  );
}

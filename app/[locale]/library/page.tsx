import type { Metadata } from "next";
import { LibraryView } from "@/components/library-view";
import { SiteShell } from "@/components/site-shell";
import { getLocaleOrDefault, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };
const copy: Record<Locale, { title: string; description: string }> = {
  en: { title: "My Library", description: "Saved titles and reading progress on this device." }, es: { title: "Mi biblioteca", description: "Títulos guardados y progreso de lectura en este dispositivo." }, fr: { title: "Ma bibliothèque", description: "Titres enregistrés et progression sur cet appareil." }, de: { title: "Meine Bibliothek", description: "Gespeicherte Titel und Lesefortschritt auf diesem Gerät." }, pt: { title: "Minha biblioteca", description: "Títulos salvos e progresso de leitura neste dispositivo." }
};
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { locale: rawLocale } = await params; const locale = getLocaleOrDefault(rawLocale); return buildMetadata({ locale, path: "/library", title: copy[locale].title, description: copy[locale].description, noIndex: true }); }
export default async function LibraryPage({ params }: PageProps) { const { locale: rawLocale } = await params; const locale = getLocaleOrDefault(rawLocale); const text = copy[locale]; return <SiteShell locale={locale}><main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-10"><div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">Manga24</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{text.title}</h1><p className="mt-2 text-sm font-semibold text-[var(--muted)]">{text.description}</p></div><LibraryView locale={locale} /></main></SiteShell>; }

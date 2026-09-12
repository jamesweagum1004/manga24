import type { Metadata } from "next";
import { DiscoverView } from "@/components/discover-view";
import { SiteShell } from "@/components/site-shell";
import { getPopularCatalogTitles } from "@/lib/data/source";
import { getLocaleOrDefault, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
type PageProps = { params: Promise<{ locale: string }> };
const titles: Record<Locale, string> = { en: "Discover", es: "Descubrir", fr: "Découvrir", de: "Entdecken", pt: "Descobrir" };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { locale: rawLocale } = await params; const locale = getLocaleOrDefault(rawLocale); return buildMetadata({ locale, path: "/discover", title: titles[locale], description: "Discover Manga24 titles selected for this device.", noIndex: true }); }
export default async function DiscoverPage({ params }: PageProps) { const { locale: rawLocale } = await params; const locale = getLocaleOrDefault(rawLocale); const catalog = (await getPopularCatalogTitles(locale)).slice(0, 120).map((title) => ({ slug: title.slug, title: title.titles[locale], author: title.author, tags: title.tags, coverUrl: title.cover.src, coverAlt: title.cover.alt, viewCount: title.viewCount })); return <SiteShell locale={locale}><main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-10"><DiscoverView locale={locale} titles={catalog} /></main></SiteShell>; }

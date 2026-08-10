import type { Locale } from "@/lib/i18n";
import { listActiveAds } from "@/lib/db/queries/ads";
import { AdStrip } from "./ad-unit";
import { CompactSiteHeader } from "./compact-site-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { getSiteSettings } from "@/lib/db/queries/settings";

export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [headerAds, settings] = await Promise.all([listActiveAds("header"), getSiteSettings()]);
  return (
    <>
      <CompactSiteHeader locale={locale} enabledLocales={settings.enabledLocales} logoUrl={settings.logo?.publicUrl ?? null} />
      <AdStrip ads={headerAds} label="Top advertisements" />
      {children}
      <MobileBottomNav locale={locale} />
    </>
  );
}

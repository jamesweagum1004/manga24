import type { Locale } from "@/lib/i18n";
import { listActiveAds } from "@/lib/db/queries/ads";
import { AdStrip } from "./ad-unit";
import { CompactSiteHeader } from "./compact-site-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { headers } from "next/headers";
import { getCountryCode } from "@/lib/analytics/country";

export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const requestHeaders = await headers();
  const [headerAds, settings] = await Promise.all([listActiveAds("header", locale, getCountryCode(requestHeaders)), getSiteSettings()]);
  return (
    <>
      <CompactSiteHeader locale={locale} enabledLocales={settings.enabledLocales} logo={settings.logo} />
      <AdStrip ads={headerAds} label="Top advertisements" pwaAdsEnabled={settings.pwaAdsEnabled} />
      {children}
      <MobileBottomNav locale={locale} />
    </>
  );
}

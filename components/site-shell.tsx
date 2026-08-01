import type { Locale } from "@/lib/i18n";
import { listActiveAds } from "@/lib/db/queries/ads";
import { AdStrip } from "./ad-unit";
import { CompactSiteHeader } from "./compact-site-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const headerAds = await listActiveAds("header");
  return (
    <>
      <CompactSiteHeader locale={locale} />
      <AdStrip ads={headerAds} label="Top advertisements" />
      {children}
      <MobileBottomNav locale={locale} />
    </>
  );
}

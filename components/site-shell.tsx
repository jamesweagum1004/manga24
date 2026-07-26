import type { Locale } from "@/lib/i18n";
import { CompactSiteHeader } from "./compact-site-header";

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <>
      <CompactSiteHeader locale={locale} />
      {children}
    </>
  );
}

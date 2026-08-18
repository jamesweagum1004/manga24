import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getAdminSession } from "@/lib/admin/auth";
import { MaintenancePage } from "@/components/maintenance-page";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const [settings, adminSession] = await Promise.all([getSiteSettings(), getAdminSession()]);
  if (!settings.enabledLocales.includes(rawLocale)) {
    permanentRedirect("/en");
  }
  if (settings.maintenanceEnabled && !adminSession) {
    return <MaintenancePage locale={rawLocale} />;
  }

  return <>{children}{settings.googleAnalyticsEnabled && settings.googleAnalyticsMeasurementId ? <GoogleAnalytics measurementId={settings.googleAnalyticsMeasurementId} /> : null}</>;
}

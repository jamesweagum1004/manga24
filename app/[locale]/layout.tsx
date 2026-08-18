import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { GoogleAnalytics } from "@/components/google-analytics";

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
  const settings = await getSiteSettings();
  if (!settings.enabledLocales.includes(rawLocale)) {
    permanentRedirect("/en");
  }

  return <>{children}{settings.googleAnalyticsEnabled && settings.googleAnalyticsMeasurementId ? <GoogleAnalytics measurementId={settings.googleAnalyticsMeasurementId} /> : null}</>;
}

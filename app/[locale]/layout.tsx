import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

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

  return children;
}

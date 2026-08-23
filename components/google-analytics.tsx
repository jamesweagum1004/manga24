"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const initialPageViewSent = useRef(false);

  useEffect(() => {
    if (!initialPageViewSent.current) {
      initialPageViewSent.current = true;
      return;
    }
    if (!window.gtag) return;
    window.gtag("config", measurementId, {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title
    });
  }, [measurementId, pathname]);

  return (
    <>
      <Script
        id="manga24-google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="manga24-google-analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(measurementId)});`}
      </Script>
    </>
  );
}

"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SiteVisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    let visitorId = "";
    try {
      visitorId = localStorage.getItem("m24-visitor-id") ?? crypto.randomUUID();
      localStorage.setItem("m24-visitor-id", visitorId);
    } catch { return; }
    void fetch("/api/analytics/visit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visitorId, pathname }), keepalive: true });
  }, [pathname]);
  return null;
}

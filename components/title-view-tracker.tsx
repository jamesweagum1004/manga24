"use client";

import { useEffect } from "react";

const deduplicationMilliseconds = 30 * 60 * 1000;

export function TitleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `manga24:title-view:${slug}`;
    const now = Date.now();
    try {
      const previous = Number(window.localStorage.getItem(key));
      if (Number.isFinite(previous) && now - previous < deduplicationMilliseconds) return;
      window.localStorage.setItem(key, String(now));
    } catch {
      // Tracking remains best-effort when storage is unavailable.
    }

    void fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      credentials: "same-origin",
      keepalive: true
    });
  }, [slug]);

  return null;
}

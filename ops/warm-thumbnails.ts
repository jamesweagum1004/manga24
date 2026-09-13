import { locales } from "../lib/i18n";

// Run after deployment; only reads published homepages and fills derived-image cache.
const base = new URL(process.env.THUMBNAIL_WARM_BASE ?? "http://127.0.0.1:3001");
const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://manga24.net").host;
const urls = new Set<string>();
for (const locale of locales) {
  const response = await fetch(new URL(`/${locale}`, base), { headers: { Host: host }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Homepage ${locale}: HTTP ${response.status}`);
  const html = (await response.text()).replaceAll("&amp;", "&");
  for (const match of html.matchAll(/\/media\/thumbnail\?src=[^"\s<>\\]+?&w=(?:160|320|640|920|1280)/g)) {
    const url = new URL(match[0], base);
    // Mobile cards use 320px on common DPRs. Cache other sizes on demand.
    url.searchParams.set("w", "320");
    urls.add(url.href);
  }
}
let done = 0;
let failed = 0;
for (const url of urls) {
  try {
    const response = await fetch(url, { headers: { Host: host }, redirect: "manual", signal: AbortSignal.timeout(60_000) });
    await response.arrayBuffer();
    if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("image/webp")) failed++;
  } catch { failed++; }
  done++;
  if (done % 10 === 0 || done === urls.size) console.log(`Thumbnails: ${done}/${urls.size}, failures: ${failed}`);
}
if (!urls.size) throw new Error("No thumbnail URLs found. Check that the new build is running.");
if (failed) process.exitCode = 1;

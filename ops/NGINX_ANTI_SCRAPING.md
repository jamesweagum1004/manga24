# Manga24 origin-side request limiting

This Nginx layer slows or temporarily rejects high-rate requests reaching the
Manga24 VPS. It does not change page HTML, robots.txt, sitemap contents, canonical
URLs, locale routes, admin authentication, or the n8n import handler.

## What is limited

The rule applies to requests reaching Nginx at an average of 3 requests/second
per effective client IP, with a burst of 60 requests. More than 30 concurrent
requests from one IP are also counted. Enforcement returns HTTP 429. Static
Next.js assets, thumbnails, uploads, SEO discovery routes, admin routes, and
`/api/internal/*` are excluded. This keeps n8n imports and Google discovery
endpoints out of the limiter.

## Safe rollout

Install monitor mode first. It records requests that would exceed the thresholds
but does not block them:

```bash
cd /srv/manga24/app
sudo ./ops/install-nginx-antibot.sh monitor
```

Review Nginx error logs over a normal traffic window and confirm what address
Nginx is using as the client IP. When Manga24 is behind Bunny, `$binary_remote_addr`
may be a Bunny edge address unless trusted-proxy real-IP handling is configured.
Do not switch to enforcement until the effective address is the visitor IP; do not
trust a client-supplied `X-Forwarded-For` value. Nginx's real-IP module only trusts
forwarded addresses from explicitly configured proxy networks.

Once the address is verified and monitor logs show no normal visitor or crawler
bursts would be rejected, enable enforcement:

```bash
cd /srv/manga24/app
sudo env MANGA24_CLIENT_IP_VERIFIED=1 ./ops/install-nginx-antibot.sh enforce
```

To return to monitor mode, run the first install command again. The installer
validates with `nginx -t`, reloads instead of restarting Nginx, and restores the
previous file if validation or reload fails.

## SEO and known limits

The policy does not use User-Agent blocking or modify indexing directives. Google
can still crawl all public URLs; only unusually high request rates from a single
effective IP can receive a temporary 429. If real Googlebot appears in monitor
logs, verify it using Google's published IP ranges or reverse/forward DNS before
adjusting thresholds; a Googlebot User-Agent alone is not proof.

This controls HTML/API requests that reach the VPS. Manga24 cover and chapter
images are delivered directly by Bunny CDN, so image requests served at the CDN
edge never reach this Nginx rule. CDN-side controls are required for those image
requests.

Nginx rate limits raise the cost of aggressive scraping; they cannot reliably
identify a scraper that distributes requests across many IPs and behaves like a
normal visitor. Review logs and adjust thresholds based on actual traffic rather
than adding browser fingerprint blocks or hidden trap links that could harm users
or search crawling.

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

Monitor mode does not block requests. Because the site is behind Bunny,
`$binary_remote_addr` can represent a CDN edge instead of the visitor. The
enforcement configuration below uses a Bunny-injected visitor-IP header and a
private origin key; it does not trust a browser-supplied `X-Forwarded-For` value.

For the public hostnames served through Bunny, enforcement also installs an
origin gate. This prevents bypassing Bunny by connecting directly to the VPS and
sending `Host: manga24.net`. Before enabling it, add two Bunny Edge Rules on the
Pull Zone that serves the site, both using **Set Request Header / overwrite**:

| Header | Value |
| --- | --- |
| `X-Manga24-Client-IP` | `%{User.IP}` |
| `X-Manga24-Origin-Key` | A private random value of 43–128 URL-safe characters |

Use the same private key when the installer prompts. Do not use the site API
token. The installer stores the rendered key only in `/etc/nginx/conf.d/` with
root-only permissions, and strips both headers before proxying to Next.js.
Requests to `direct.manga24.net` are handled by a separate virtual host and are
not changed, so n8n imports continue to use their existing authentication.

After the Bunny rules are active, enable enforcement interactively:

```bash
cd /srv/manga24/app
sudo ./ops/install-nginx-antibot.sh enforce
```

This enables the per-visitor limiter and returns 403 for public-host requests
that do not carry Bunny's injected origin key. Requests using an unrecognized
Host header or direct IP on port 80 are closed, while the exact `direct.manga24.net`
host remains on its existing vhost. It does not block by country or User-Agent.
Keep a separate terminal ready to revert immediately by reinstalling monitor
mode if Bunny reports an origin error or browser pages fail.

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

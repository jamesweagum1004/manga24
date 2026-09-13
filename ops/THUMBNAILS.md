# Cover thumbnails (no Bunny Optimizer)

`/media/thumbnail` resizes existing published cover assets into real WebP files.
Both existing and future uploads work without rewriting the original objects,
changing the import API, or migrating the database. Reader page images are not
changed. Unpublished/admin covers fall back to their original URL.

The server verifies the cover object key, published title, and currently configured
storage CDN URL before requesting an image. Only HTTPS, public IPv4 connections
are accepted; redirects are not followed. Source download limit: 12 MiB / 12 seconds;
decode limit: 40 megapixels. Two conversions run at once, with at most 32 pending keys.
On failure the verified original is returned via an uncached redirect.

Cache: `.cache/thumbnails` under the app directory, requiring write access for the
service user. Files are derived copies, never original uploads. During generation,
cleanup runs at most once per minute, removing expired (7-day) copies and oldest
copies above the 512 MiB target. Browser cache is one hour, shared cache one day.
Source asset `updated_at` participates in the disk cache key. Homepage `sizes`
matches the cards and the first three covers in each of the first two sections
load eagerly. Other covers remain lazy loaded.

Deploy with `npm ci`, `npm run build`, then restart the existing service. After it
is ready, prewarm mobile homepage covers (all configured locales):

```sh
cd /srv/manga24/app
./node_modules/.bin/tsx ops/warm-thumbnails.ts
```

Run as the service user, so cache files have the correct ownership. No secrets are
needed by this script. `THUMBNAIL_WARM_BASE` defaults to `http://127.0.0.1:3001`;
`NEXT_PUBLIC_SITE_URL` supplies the Host header if not using manga24.net.
The script reports failures rather than counting original-image redirects as success.
First uncached requests can be slower due to conversion. Compare the same homepage
content/device and multiple warm PageSpeed runs; no LCP score is guaranteed.

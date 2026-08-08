# manga24

A multilingual, mobile-first adult manga reader scaffold built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, and Zod.

This milestone uses synthetic demo metadata and non-explicit local placeholder images only.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000/en`.

The app can run without PostgreSQL. When `DATABASE_URL` is empty or missing, public pages and admin title lists use the
synthetic demo data fallback. Admin create/edit forms render, but writes are disabled with the message:
`Database is not configured. Set DATABASE_URL to enable writes.`

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run start` starts the built Next.js production server.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run build` creates a production build.
- `npm run db:generate` generates Drizzle migrations from `db/schema.ts`.
- `npm run db:migrate` applies migrations to local PostgreSQL.
- `npm run db:seed` inserts realistic synthetic demo content.

## HestiaCP Deployment

Current dev deployment details:

- Local Codex working path: `C:\Users\alex0\Downloads\manga24\manga24-integration`
- Server app path: `/home/user/apps/manga24`
- HestiaCP user: `user`
- Dev domain: `dev.manga24.net`
- Internal app address: `127.0.0.1:3001`
- Hestia proxy template: `manga24-node`
- systemd service file: `/etc/systemd/system/manga24.service`

The systemd service starts the app with Next.js production mode, equivalent to:

```bash
npm run start -- -H 127.0.0.1 -p 3001
```

Service commands:

```bash
systemctl restart manga24
systemctl status manga24
journalctl -u manga24 -f
```

Health checks:

```bash
curl -I http://127.0.0.1:3001/en
curl -I https://dev.manga24.net/en
```

Deployment note: the dev domain may be blocked from Korea because the domain is already warning-blocked domestically. The deployment can still be healthy and reachable through VPN or non-Korean networks.

Server ownership should stay with the HestiaCP user:

```bash
chown -R user:user /home/user/apps/manga24
```

Install and build commands should run as the HestiaCP user:

```bash
sudo -H -u user npm ci
sudo -H -u user npm run build
```

Start the deployed production build on the internal app address:

```bash
sudo -H -u user npm run start -- -H 127.0.0.1 -p 3001
```

## Admin Backend V1

`DATABASE_URL` controls the active data source:

- When `DATABASE_URL` is empty or missing, public pages and admin list pages use the synthetic demo fallback.
- When `DATABASE_URL` is set, public pages and admin pages read from PostgreSQL through Drizzle.
- Admin writes require `DATABASE_URL`; without it, forms show `Database is not configured. Set DATABASE_URL to enable writes.`

The legacy environment credentials bootstrap the first database-backed administrator:

```bash
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
DEEPSEEK_API_KEY=
```

The private login page is `/manga1004` and is never linked from the public site. After login, administration routes live
under `/manga1004/*`. The former `/admin` path always returns `404`.

After the first successful login, **Admin → Security** supports:

- changing the signed-in administrator's password;
- adding and updating administrator accounts;
- enabling or disabling other administrator accounts.

Use a long, random `ADMIN_SESSION_SECRET` in production. The application temporarily falls back to `ADMIN_PASSWORD` as
the signing key for upgrade compatibility, but a dedicated secret is recommended.

### DeepSeek SEO

Set `DEEPSEEK_API_KEY` to enable the **Generate SEO** button on title edit pages. The integration calls DeepSeek only from
the protected administrator action; public requests never call the API. Generated English and Spanish SEO titles,
descriptions, and keywords are validated and stored in PostgreSQL, where they can be reviewed and edited before use.

Choose the active model from **Admin → Settings**. Keep the API key in an untracked server environment file and never
expose it through a `NEXT_PUBLIC_` variable.

### Public URL and development indexing

Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin (for example `https://manga24.net`). Canonical, Open Graph,
Twitter, and `hreflang` URLs are generated from this value. Every hostname except `manga24.net` and `www.manga24.net`
returns a `robots.txt` policy and `X-Robots-Tag` header that block indexing. Set `GOOGLE_SITE_VERIFICATION` to the token
from Search Console to publish Google's ownership meta tag without exposing it through a public environment variable.

Set `NEXT_PUBLIC_IMAGE_CDN_URL` once as the initial/fallback independent Bunny CDN hostname (not `manga24.net` and not one
of its subdomains). After migration, **Admin → Settings → Image CDN domain** can switch the active origin without a rebuild.
Content images bypass the Next.js image proxy and are optimized directly by Bunny. Database asset rows keep B2 object keys, and public
cover, reader, Open Graph, and Twitter URLs are rebuilt from this base URL so the B2 `/file/{bucket}/...` origin pattern
is never exposed. New uploads use stable title folders based on the title creation month, such as
`{format}/YYYY/MM/{title}/cover/cover.webp` and `{format}/YYYY/MM/{title}/chapters/{chapter}/0001.webp`.
Later chapter uploads keep using the title's original year/month folder. Upload `branding/og.webp` to the origin for pages without a cover.

The application intentionally provides no image proxy route on the main domain. There is currently no RSS endpoint.
The dynamic `/sitemap.xml` contains every published locale, title, chapter, and tag URL from the active catalog.

#### Bunny Pull Zone checklist

1. Attach the independent image hostname to the Pull Zone and set B2 only as its private origin. If Manga and Manhwa
   remain in separate buckets, route `/manga/*` to the Manga origin and `/manhwa/*` to the corresponding
   `/manhwa/` paths to the Manhwa origin with Bunny Origin URL edge rules. Do not publish B2 file URLs in application data.
2. Under **Security → Hotlink Protection**, allow `manga24.net` and `dev.manga24.net`. Keep **Block Direct URL File
   Access** disabled: image crawlers and social preview bots commonly send no Referer. Requests carrying a foreign
   Referer are still rejected. Add known social referrers only if previews fail.
3. Under **Edge Rules**, override origin-specific response headers with neutral values or remove them with Middleware
   when removal is required. Verify the public response does not expose bucket names or B2 `/file/` URLs.
4. Keep Token Authentication off for indexable covers and Open Graph images. If private chapter pages later require it,
   use Advanced HMAC-SHA256 tokens generated server-side and exempt public SEO image paths.
5. Leave the image hostname root unconfigured; a `404` at `/` is expected.

### Advertisements

**Admin → Ads** manages top-of-page and between-section advertising. Static banner uploads accept PNG, JPEG, GIF, WebP,
and AVIF files up to 10 MB. ExoClick zone code runs inside a sandboxed iframe. Advertising assets stay under the isolated
`public/uploads/ads` path and never use the Manga/Manhwa B2 buckets or `NEXT_PUBLIC_IMAGE_CDN_URL`. Production deployments
must preserve this directory between releases.

### B2 and Bunny media storage

Set `STORAGE_CONFIG_ENCRYPTION_KEY` to a long random server-only value before saving media credentials. **Admin → Settings**
stores separate Backblaze B2 bucket, S3 endpoint, region, and Application Key settings for Manga and
Manhwa. Application Keys are encrypted with AES-256-GCM before database storage and are never returned to the browser.
Do not rotate or remove the encryption key until the stored Application Keys have been re-entered under the new key.

Title edit pages accept a cover image. Chapter edit pages accept either one ZIP archive or multiple JPG, PNG, WebP, or
AVIF images. ZIP files are transport containers only: supported images are safely extracted, naturally sorted by filename,
uploaded as individual B2 objects, and connected to `assets` and `chapter_pages`. New titles remain outside the public
catalog until a cover and at least one published chapter with pages exist and **Publish to site** is selected.

### n8n media imports

Set a separate random `N8N_IMPORT_API_KEY` and send authenticated multipart requests to `POST /api/internal/import`:

```text
Authorization: Bearer <N8N_IMPORT_API_KEY>
manifest: JSON text
cover: optional image
chapterZip: optional ZIP
pages: optional repeated image field
```

The manifest contains `title`, an optional `chapter`, and `publish`. Canonical title and chapter slugs are idempotency
keys: a repeated import updates the existing records instead of creating duplicates. SEO can be supplied in the manifest
or generated by DeepSeek with `title.generateSeo: true`. Publishing still requires a cover plus pages on a published
chapter. n8n never receives the database password, administrator credentials, or stored B2 Application Keys.

### Reporting and moderation

Title and chapter pages link to a public report form. Copyright reports require claimant, rights-holder, original-work,
contact, and signature details. Child-safety reports enter the administrator queue with urgent priority. Anonymous reports
are rate-limited by a one-way network fingerprint and protected by a honeypot. **Admin → Reports** records manual review
decisions in the audit log; report counts never remove content automatically. Report data is not sent to DeepSeek.

Run migrations:

```bash
npm run db:migrate
```

Seed abstract, non-explicit demo content:

```bash
npm run db:seed
```

## Database

Local PostgreSQL is provided by Docker Compose:

```bash
docker compose up -d
```

Use this local connection string in `.env`:

```text
postgres://manga24:manga24@localhost:5432/manga24
```

Example `.env` values for local database-backed development:

```bash
DATABASE_URL=postgres://manga24:manga24@localhost:5432/manga24
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-locally
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Apply Drizzle migrations:

```bash
npm run db:migrate
```

If you want synthetic records in the database, run the existing seed script after migrations:

```bash
npm run db:seed
```

`DATABASE_URL` is validated only when database access is required. Database commands and admin writes require it. Public
routes keep working with demo data when it is missing.

## Admin

`/manga1004` is the unlinked administrator login page. Nested routes require a signed administrator session, and `/admin`
always returns `404`.

## Storage

Demo content uses files under `public/placeholders`. Production cover and chapter uploads use the configured Manga or
Manhwa Backblaze B2 bucket through the B2 Native API and store Bunny CDN delivery URLs in the `assets` table. Reader
components consume those database URLs and do not receive storage credentials.

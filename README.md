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
DEEPSEEK_MODEL=deepseek-v4-flash
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

`DEEPSEEK_MODEL` defaults to `deepseek-v4-flash`. Keep the API key in an untracked server environment file and never expose
it through a `NEXT_PUBLIC_` variable.

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

The app uses a storage adapter boundary in `lib/storage.ts`. Local development points at files under `public/placeholders`. Production storage can later be connected to Backblaze B2 through its S3-compatible API and BunnyCDN delivery URLs without changing reader components.

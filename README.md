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

`/admin` and nested admin routes are protected by HTTP Basic Auth when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are
configured.

In production, admin access is blocked if either credential is missing. In development, admin routes are allowed without
credentials and show a warning banner so local demo fallback can still be inspected.

## Storage

The app uses a storage adapter boundary in `lib/storage.ts`. Local development points at files under `public/placeholders`. Production storage can later be connected to Backblaze B2 through its S3-compatible API and BunnyCDN delivery URLs without changing reader components.

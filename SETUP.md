# Setup — Best Texas Display

Next.js 16 (App Router) + Postgres + Cloudflare R2 storage. Deployed on Vercel.

## Get running on a new machine

```bash
git clone https://github.com/Texrock100/best-texas-display.git
cd best-texas-display
npm install

# Configure environment (see .env.example for every variable)
cp .env.example .env.local
# then edit .env.local with real values — copy them from your Vercel project:
#   Vercel → Project → Settings → Environment Variables

npm run dev          # http://localhost:3000
```

A fresh clone includes all branches. Check one out with e.g.
`git checkout pwa/installable-mobile-camera`.

## Environment variables

All required vars are documented in [.env.example](.env.example):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs JWT session tokens |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cloudflare R2 photo storage |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Interactive map (browser-exposed; restrict by referrer) |

`.env.local` is gitignored — never commit it. If R2 vars are unset, photo
uploads fall back to a placeholder (the rest of the app still works).

## Database

The schema + seed data live in [scripts/init-db.sql](scripts/init-db.sql). Apply
it to the database referenced by `DATABASE_URL`, e.g.:

```bash
psql "$DATABASE_URL" -f scripts/init-db.sql
```

## Common commands

```bash
npm run dev      # local dev server
npm run build    # production build (needs DATABASE_URL set)
npm run start    # serve the production build
npm run lint     # eslint
npx tsc --noEmit # typecheck only
```

> Note: `npm run build` connects to the database during static generation
> (sitemap, city/region pages), so `DATABASE_URL` must be set even for a build.

## PWA icons

App icons are generated from the brand mark, not hand-edited. To regenerate
(`public/icon-*.png`, `apple-touch-icon.png`):

```bash
node scripts/generate-icons.mjs
```

## Deploy

Pushing to GitHub triggers Vercel. Production env vars are managed in the Vercel
project settings (not in this repo).

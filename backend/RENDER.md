# Deploy MurGo API on Render

Your Render service must match these settings (Dashboard → **Settings**).  
`render.yaml` in the repo root only applies if the service is linked to the Blueprint, or you copy these values manually.

## Required settings

| Field | Value |
|-------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Node version** | `20.14.0` (Environment → `NODE_VERSION`) — avoid Node 26 |
| **Build Command** | `chmod +x render-build.sh && ./render-build.sh` |
| **Start Command** | `npm run start:prod` |

Do **not** use:

- `yarn` / `yarn install` only (skips `nest build`)
- `node dist/src/main` (missing `.js`; use `npm run start:prod` instead)

## Environment variables

Copy from `backend/.env.example` into Render → **Environment**:

- `DATABASE_URL` (Neon)
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CORS_ORIGIN`
- `OSRM_BASE_URL` (optional)

## After first successful deploy

Render Shell:

```bash
npx prisma db push
npm run db:seed
```

## Verify

`https://YOUR-SERVICE.onrender.com/api/geofence/cities` should return JSON.

Build logs must show `nest build` and `render-shim: wrote dist/src/main.js`, not only `yarn install`.

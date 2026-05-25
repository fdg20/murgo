# Deploy MurGo Admin Panel (Vercel)

The admin app is a **Vite React** site in `admin/`. On your phone it shows `http://localhost:5173` until you deploy it and set `EXPO_PUBLIC_ADMIN_URL`.

## 1. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `fdg20/murgo`.
2. **Root Directory:** `admin`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment variables** (Production):

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same `pk_...` as mobile/Render |

7. Deploy. You get a URL like `https://murgo-admin.vercel.app`.

## 2. Allow admin in Render CORS

Render → your API service → **Environment** → edit `CORS_ORIGIN`:

```text
https://murgo-admin.vercel.app,exp://localhost:8081
```

(Add your real Vercel URL; comma-separated, no spaces.)

Redeploy Render after saving.

## 3. Clerk dashboard

[Clerk](https://dashboard.clerk.com) → your app → **Domains** / allowed origins:

- Add your Vercel admin URL (e.g. `https://murgo-admin.vercel.app`).

## 4. Mobile app (Admin role screen)

In `mobile/.env` on your PC:

```env
EXPO_PUBLIC_ADMIN_URL=https://murgo-admin.vercel.app
```

Restart Expo: `npm run start:clear`

The **Open admin panel** button on the phone will open your live URL, not localhost.

## 5. Use admin

1. Open the Vercel URL in a **desktop or mobile browser**.
2. Sign in with your admin Clerk account (`npm run promote-admin` in backend if needed).
3. Approve merchants, view orders, fees, etc.

---

**Local dev only:** keep `VITE_API_URL=/api` in `admin/.env` and run `cd admin && npm run dev` (proxies API to localhost:3000).

# MurGo

Production-ready multi-vendor food delivery platform (**MurGo**) operating within **Murcia** and **Bacolod City**, Negros Occidental, Philippines.

Similar to Grab, Uber Eats, and Foodpanda — with geofencing enforced at every layer: addresses, merchant registration, rider deliveries, and customer orders.

## Architecture

```
negros-delivery/
├── backend/          # NestJS API + Prisma + PostgreSQL + Socket.io
├── mobile/           # React Native (Expo) — Customer, Merchant, Rider apps
├── admin/            # React (Vite) admin panel
└── shared/           # Shared geofencing utilities
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo, TypeScript, NativeWind, React Navigation, Zustand, TanStack Query |
| Backend | NestJS, TypeScript, Prisma ORM, PostgreSQL |
| Auth | Clerk (free tier), role-based access |
| Database | Neon PostgreSQL |
| Cache | Upstash Redis |
| Media | Cloudinary |
| Maps | OpenStreetMap + OSRM routing |
| Real-time | Socket.io |

### Roles

- **Customer** — Browse, order, track deliveries
- **Merchant** — Register store, manage products/orders
- **Rider** — Accept deliveries, live location updates
- **Admin** — Approve merchants, manage fees, analytics

## Service Area Restriction

All location operations are validated against **Murcia** and **Bacolod City** boundary polygons stored in the database. Users outside these areas see:

> Sorry, MurGo is currently available only within Murcia and Bacolod City, Negros Occidental.

Supported areas include Murcia barangays (Poblacion, Blumentritt, Minoyan, etc.) and Bacolod areas (Downtown, Lacson, Mandalagan, Burgos, Villamonte, and more).

## Prerequisites

- Node.js 20+
- npm
- [Neon](https://neon.tech) PostgreSQL account (free)
- [Clerk](https://clerk.com) account (free tier)
- [Cloudinary](https://cloudinary.com) account (optional, for image uploads)
- [Upstash Redis](https://upstash.com) (optional, for caching)

## Setup

### 1. Clone and install

```bash
cd backend && npm install
cd ../mobile && npm install --legacy-peer-deps
cd ../admin && npm install
```

### 2. Backend environment

Copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/negros_delivery?sslmode=require"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
REDIS_URL="redis://default:xxx@xxx.upstash.io:6379"
PORT=3000
CORS_ORIGIN="http://localhost:8081,http://localhost:5173,exp://localhost:8081"
OSRM_BASE_URL="https://router.project-osrm.org"
```

### 3. Database setup

```bash
cd backend
npx prisma db push
npm run db:seed
```

### 4. Clerk configuration

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Enable **Email + Password** and **Google** OAuth sign-in. **Disable Phone** (or set it optional) under User & authentication — MurGo does not use Clerk SMS, and the Philippines is not supported for phone verification.
3. Enable **Native applications** under Configure (required for Expo Go).
4. Copy publishable and secret keys to `.env` files
5. **Admin account** — sign up with `kramdano@gmail.com` (app or admin panel), then run:

```bash
cd backend
npm run promote-admin
```

This sets Clerk `publicMetadata.role = ADMIN` and links your Clerk user in the database.

### 5. Mobile environment

Copy `mobile/.env.example` to `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:3000
```

> Use your machine's local IP (not `localhost`) when testing on a physical device.

### 6. Admin environment

Copy `admin/.env.example` to `admin/.env`:

```env
VITE_API_URL=/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Running Locally

```bash
# Terminal 1 — API
cd backend && npm run start:dev

# Terminal 2 — Mobile
cd mobile && npm start

# Terminal 3 — Admin panel
cd admin && npm run dev
```

- API: http://localhost:3000/api
- Admin: http://localhost:5173
- Mobile: Scan QR with Expo Go

### Phone testing: live API (Render) vs local dev

| What | Needs same Wi‑Fi as PC? | Needs PC running? |
|------|-------------------------|-------------------|
| **API on Render** (`https://…onrender.com`) | No — phone can use mobile data | No — API is in the cloud |
| **Expo Go app UI** (Metro bundler) | Only if using `npm start` (LAN). Use `npm run start:tunnel` to avoid same Wi‑Fi | **Yes** — Expo Go loads JS from your PC |
| **Installed app (EAS build)** | No | **No** — real install, no Expo Go |

**Using live Render from your phone (Expo Go):**

1. Set `mobile/.env` to your Render URLs (see `mobile/.env.example`).
2. On PC: `cd mobile && npm run start:tunnel` (tunnel works even if phone is on mobile data).
3. Scan QR in Expo Go. You do **not** need local backend or same Wi‑Fi for API calls.
4. Be in **Murcia or Bacolod** (or geofence will block ordering).

**No PC at all:** build with [Expo EAS](https://expo.dev/eas) (`eas build`) and install the APK/IPA — see Mobile (Expo EAS) below.

### Expo Go on a physical phone (local backend only)

1. **Same Wi‑Fi** as your PC (not mobile data only), unless using tunnel.
2. Set `mobile/.env` to your PC **LAN IP** (from `ipconfig`), not `localhost`.
3. **Backend must be running** (`npm run start:dev` in `backend/`).
4. If the QR bundle never finishes loading: `cd mobile && npm run start:tunnel`
5. Clear cache if stuck: `npm run start:clear`

## Free hosting (production)

| Part | Free option | Notes |
|------|-------------|--------|
| Database | [Neon](https://neon.tech) | Already used |
| Auth | [Clerk](https://clerk.com) | Free tier |
| API (backend) | [Render](https://render.com) or [Railway](https://railway.app) | Free web service; set env vars, `npm run build` + `npm run start:prod` |
| Admin web | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Deploy `admin/`; set `VITE_API_URL` to your Render API URL |
| Mobile app | [Expo EAS](https://expo.dev/eas) | Free tier: cloud builds + **EAS Update** for OTA JS updates; share via internal distribution link |
| Expo Go (dev only) | Not for public users | Real users need an EAS build or store listing |

**Typical free stack:** Neon + Clerk + Render (API) + Vercel (admin) + EAS (mobile builds/updates).

**Clerk:** add your production URLs (Render API, Vercel admin, Expo scheme) in the Clerk dashboard.

**CORS:** set `CORS_ORIGIN` on Render to your Vercel admin URL and Expo origins.

## API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Geofence | `/api/geofence` | Validate locations, list cities |
| Users | `/api/users` | Profile, role selection |
| Addresses | `/api/addresses` | Customer address CRUD |
| Merchants | `/api/merchants` | Browse, register, manage |
| Products | `/api/products` | Product & category management |
| Orders | `/api/orders` | Checkout, place, track orders |
| Riders | `/api/riders` | Online status, accept deliveries |
| Promo | `/api/promo` | Promo code validation |
| Admin | `/api/admin` | Dashboard, management |
| Routes | `/api/routes` | OSRM route & ETA |
| Upload | `/api/upload` | Cloudinary image upload |

WebSocket namespace: `/live` — order status updates, rider location tracking.

## Delivery Fee Logic

Admin-configurable via `/api/admin/delivery-fees`:

```
If distance <= 2km:
  Flat fee (default ₱49)
Else:
  Base fee + (distance × per km rate)
```

Checkout breakdown: **Subtotal → Discount → Delivery Fee → Total**

## Seed Data

The seed script creates:

- Murcia and Bacolod service area boundaries
- Supported cities in both areas (including Bacolod Downtown, Lacson, Mandalagan)
- Default delivery fee & commission config
- Promo codes: `MURGO50`, `MURCIA20`
- Demo merchant: **Chicken House Bacolod** (Bacolod City)
- Demo merchant: **Silay Pastries & Cafe** (Silay City)
- Sample merchants in Murcia and Bacolod with sample products (₱)

## Deployment

### Backend (Railway / Render / Fly.io)

See **[backend/RENDER.md](backend/RENDER.md)** for exact Render dashboard settings.

1. Connect GitHub repo, set root to `backend/`
2. Build command: `chmod +x render-build.sh && ./render-build.sh` (npm only — not `yarn install` alone)
3. Start command: `npm run start:prod` (not `node dist/src/main`)
4. Set `NODE_VERSION=20.14.0` and all env vars (`DATABASE_URL`, `CLERK_SECRET_KEY`, etc.)
5. Run migrations once in Render Shell: `npx prisma db push && npm run db:seed`

### Database (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string to `DATABASE_URL`
3. Enable connection pooling for production

### Mobile (Expo EAS)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas submit
```

Set `EXPO_PUBLIC_*` variables in EAS secrets.

### Test orders and rider tracking on a phone

See **[mobile/TESTING-ORDERS.md](mobile/TESTING-ORDERS.md)** for the full Customer → Merchant → Rider flow and live map tracking.

### Admin (Vercel / Netlify)

See **[admin/DEPLOY.md](admin/DEPLOY.md)** for step-by-step Vercel setup.

1. Root directory: `admin/`
2. Build: `npm run build`
3. Output: `dist/`
4. Set `VITE_API_URL=https://YOUR-SERVICE.onrender.com/api` and `VITE_CLERK_PUBLISHABLE_KEY`
5. Add the Vercel URL to Render `CORS_ORIGIN` and Clerk allowed domains
6. Set `EXPO_PUBLIC_ADMIN_URL=https://your-admin.vercel.app` in `mobile/.env` so the app does not show `localhost:5173`

## Project Structure

### Backend (feature-based)

```
backend/src/
├── common/           # Guards, decorators, filters, geofence utils
├── prisma/           # Prisma service & module
└── modules/
    ├── geofence/     # Service area validation
    ├── users/        # User profiles
    ├── addresses/    # Customer addresses
    ├── merchants/    # Merchant CRUD & orders
    ├── products/     # Product & categories
    ├── orders/       # Checkout & order flow
    ├── riders/       # Rider operations
    ├── promo/        # Promo codes
    ├── admin/        # Admin APIs
    ├── notifications/
    ├── upload/       # Cloudinary
    ├── routes/       # OSRM routing
    ├── redis/        # Upstash Redis
    └── websocket/    # Socket.io gateway
```

### Mobile

```
mobile/src/
├── api/              # Axios client, services, socket
├── components/       # Reusable UI
├── constants/        # Config, cities
├── navigation/       # Role-based navigators
├── screens/
│   ├── auth/         # Login, role selection
│   ├── customer/     # Home, checkout, orders, profile
│   ├── merchant/     # Registration, dashboard
│   └── rider/        # Deliveries, earnings
├── store/            # Zustand (cart, location)
├── types/
└── utils/            # Location & geofence helpers
```

## License

Private — MurGo Delivery Platform (Murcia)

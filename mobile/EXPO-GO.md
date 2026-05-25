# Expo Go — fix “404 when scanning QR”

Your screenshot shows **LAN mode**:

```text
Metro waiting on exp://10.20.38.12:8081
```

Expo Go often returns **404** with LAN URLs when the phone cannot reach your PC reliably (firewall, router AP isolation, or stale cache). Use **tunnel mode** instead.

## Fix (do these in order)

### 1. Stop the old dev server

In the terminal where Expo is running, press **Ctrl+C**.

If port 8081 is stuck:

```powershell
netstat -ano | findstr ":8081"
taskkill /PID <number_from_last_column> /F
```

### 2. Force-close Expo Go on your phone

Swipe Expo Go away completely (don’t just go back).

### 3. Start with tunnel + clear cache

```powershell
cd mobile
npm run start:clear
```

Wait until the terminal shows something like:

```text
Metro waiting on exp://xxxx.exp.direct:443
```

**Not** `10.20.38.12` — that is LAN and causes 404 on many phones.

Scan the **new** QR code.

### 4. If tunnel fails (“failed to start tunnel”)

Log in to Expo once (free account):

```powershell
npx expo login
npm run start:clear
```

**Fallback — same Wi‑Fi only:**

```powershell
npm run start:lan
```

- Phone and PC must be on the **same Wi‑Fi** (not mobile data).
- Windows: allow **Node.js** through the firewall for **Private networks**.
- In Expo Go, long-press the old MurGo project → remove it, then scan again.

### 5. Update Expo Go

MurGo uses **Expo SDK 54**. Install the latest **Expo Go** from the Play Store / App Store.

## Your API settings (already correct)

```env
EXPO_PUBLIC_API_URL=https://murgo-api.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://murgo-api.onrender.com
```

These are for the MurGo API after the app loads — they are **not** the QR / Metro URL. The QR only starts the JavaScript bundle from your PC (or tunnel).

## Clerk redirect (after app loads)

In [Clerk Dashboard](https://dashboard.clerk.com) → your app → **Native applications**:

- Enable Native API
- Add redirect URL: `murgo://`

# Test orders and live tracking (MurGo)

You need **three Clerk accounts** (or three phones) for the full flow: **Customer**, **Merchant**, and **Rider**. One account can only have one role.

Use **live Render API** in `mobile/.env` and be in **Murcia or Bacolod** (real GPS or a location inside the service area).

---

## 1. Customer — place an order

1. Sign in → choose **Customer**.
2. **Profile** → **+ Add** address:
   - Tap **Use current location** (must be inside Murcia/Bacolod), or set coordinates in Bacolod (~10.676, 122.951).
   - City: e.g. `Bacolod (Downtown)`.
3. **Home** → pick a store (e.g. Bacolod Chicken Inasal) → add items to cart → **Checkout**.
4. Select address → wait for price preview → **Place Order**.
5. You land on **Track Order** (map + status).

---

## 2. Merchant — prepare for pickup

Sign in with a **merchant** account (seed: `merchant@negrosdelivery.ph` or your own approved store).

1. Choose **Merchant** role (or register a store and wait for admin approval).
2. **Merchant Dashboard** → **Incoming Orders**.
3. Tap in order:
   - **Confirm** (PENDING → CONFIRMED)
   - **Preparing** (CONFIRMED → PREPARING)
   - **Ready** (PREPARING → READY_FOR_PICKUP)

Riders only see orders at **READY_FOR_PICKUP**.

---

## 3. Rider — deliver and enable tracking

Sign in with a **rider** account (seed: `rider@negrosdelivery.ph` or your own rider profile).

1. Choose **Rider** role.
2. Tap **Go Online** (allow location).
3. Under **Available Deliveries** → **Accept** the order.
4. On the active delivery card, tap in sequence:
   - **Picked Up**
   - **Start Delivery** (status **IN_TRANSIT** — customer map should show rider movement)
   - **Delivered**

Location updates are sent every few seconds while online with an active order.

---

## 4. Customer — watch tracking

1. **Orders** tab → tap your order (or open **Track Order** after checkout).
2. Map shows:
   - Red pin — delivery address
   - Dark pin — rider (when **IN_TRANSIT** and rider is online with GPS)
3. Status updates via live socket (and refreshes every 10s).

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| No stores | Run `npm run db:seed` on Render; filter by Bacolod on Home |
| Cannot place order | Address must be inside geofence; merchant must be **APPROVED** and **Open** |
| Rider sees no jobs | Merchant must tap **Ready**; rider must be **Online** |
| No rider on map | Rider must tap **Start Delivery**; allow location on rider phone; socket URL must be `https://YOUR-SERVICE.onrender.com` |
| Overlapping UI | Pull latest app; restart Expo with `npm run start:clear` |

---

## Quick test with seed accounts

After `db:seed`, merchants exist but Clerk users must be created by you. Easiest path:

1. Your phone — **Customer** (your Clerk email).
2. Second device or emulator — **Merchant** (register store in app, approve via admin, or use admin panel).
3. Third — **Rider** (separate Clerk sign-up, select Rider role).

For a solo dev test, use the **admin panel** to approve merchants, change order status, **assign a test rider**, and tap **GPS @ store / en route / @ customer** to simulate live tracking on one phone.

### Admin test rider flow (one phone)

1. Create a second Clerk account (or use an existing user) and choose **Rider** in the app once.
2. In admin → **Orders**, pick that rider from the dropdown and click **Assign**.
3. Set status to **IN_TRANSIT** (or use **GPS en route** — it auto-sets IN_TRANSIT).
4. On your customer phone, open the order → map should show the rider pin moving when you tap the GPS buttons in admin.

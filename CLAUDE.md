# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Self-Order Kiosk for **Ayam Kalintang** (Bakti BCA) — touch-screen POS where customers self-order, pay via BCA QRIS or cash, with admin/KDS dashboards for staff. Indonesian-language UI (`lang="id"`).

## Commands

Package manager: **pnpm** (lockfile present).

```bash
pnpm dev          # next dev (Turbopack)
pnpm build        # next build (PWA via Serwist generates public/sw.js)
pnpm start        # next start
pnpm lint         # eslint (eslint-config-next)
```

No test runner configured. No single-test command exists.

## Architecture

### Stack
- **Next.js 16.2** App Router + React 19 + TypeScript strict mode
- **Supabase** (`@supabase/ssr`) — Auth, Postgres, Realtime
- **Zustand** with `persist` (localStorage key `sok-cart`) for cart state
- **Tailwind v4** + **shadcn/ui** + **lucide-react**
- **Serwist** PWA (service worker at `src/app/sw.ts`, output `public/sw.js`)
- **BCA SNAP API** (custom client) for QRIS — Midtrans webhook present as legacy/fallback

### Routing layout
- `src/app/(kiosk)/` — public customer flow: `page.tsx` (Attract) → `order-type` → `menu` → `success`. Wrapped by `(kiosk)/layout.tsx` which arms a 3-min `useIdleTimer` to clear cart and route to `/`.
- `src/app/admin/` — protected (Dashboard, KDS at `orders`, `menus`, `inventory`, `login`).
- `src/app/api/webhook/midtrans/route.ts` — webhook endpoint (HMAC SHA-512 signature verify, idempotent paid-flag update via service-role client).

### Auth gate — IMPORTANT
File is **`src/proxy.ts`**, NOT `middleware.ts`. It exports a `proxy()` function and matcher config but is not wired to Next's middleware system as-named. Any auth gating you assume is happening via middleware needs verification — admin protection currently relies on this `proxy.ts` being invoked. Do not rename without confirming how it is registered.

### Payment flow
Two payment infrastructures coexist:
1. **BCA SNAP QRIS** (`src/lib/bca/index.ts`) — primary. Asymmetric SHA256 sign with PKCS#8 private key for B2B token; symmetric HMAC-SHA512 sign per request. Auto-falls-back to **simulation mode** if `BCA_CLIENT_ID` / `BCA_PRIVATE_KEY` missing or `BCA_SIMULATION=true`. Returns dummy EMVCo string in sim.
2. **Midtrans webhook** still wired (`api/webhook/midtrans`) — legacy. The `orders.midtrans_order_id` column is reused by BCA flow (noted in code as "should be renamed eventually").

`createOrder` in `src/actions/order.ts` writes orders/order_items/order_item_options then calls `bcaClient.generateQR()` for QRIS path. **Cash** path returns immediately and is settled via `confirmCashPayment(orderId, pin)` in `src/actions/payment.ts`.

### Anti-Gagal security pattern
- PINs/recovery codes live in `store_configs` table (`config_key` rows: `cashier_pin`, `recovery_code`), validated server-side in `src/actions/payment.ts`. Hardcoded `'1234'` / `'4321'` exist only as fallback if the table read fails — do not rely on these.
- Failed-attempt lockouts use `localStorage` to persist across reload (per `src/components/admin/CashAuthModal.tsx`).
- Webhook update uses `.eq('payment_status', 'unpaid')` for idempotency.

### Supabase clients
- `src/lib/supabase/server.ts` — RSC/Server Action client via `@supabase/ssr` cookie adapter.
- `src/lib/supabase/client.ts` — browser client.
- Webhook uses `createClient` from `@supabase/supabase-js` with **service-role key** to bypass RLS — only do this in API routes that have verified the caller (e.g. signature check).

### Cart state (`src/store/cart.ts`)
Items with the same `menuId` but different option selections are kept as **separate cart entries** via an options-hash (sorted joined `valueId`s). When updating qty, recompute subtotal as `unitPrice * newQty` from existing `subtotal/quantity` — preserve this pattern; it accounts for option extras already baked into subtotal.

### Type contract
`src/types/database.ts` only defines `Category`, `Menu`, `MenuOption`, `MenuOptionValue`. **No generated Supabase types** — DB shape for `orders`, `order_items`, `order_item_options`, `inventory_movements`, `store_configs`, `menus.current_stock` is implicit and lives only in Server Action call sites. Adding a column means updating those call sites by hand.

## Conventions

- Server Actions go in `src/actions/*.ts` with `'use server'` at top. Do not put them in components.
- Path alias `@/*` → `./src/*`.
- Brand colors: `bg-brand-primary` (`#0667AC` BCA Blue), `bg-brand-secondary` (`#FEB914` Kalintang Yellow). Do not introduce new brand colors.
- Kiosk UI = "High-Impact & Frictionless": large touch targets, no default-selected options in customization, scroll-safe modals.
- Admin/KDS UI = "High-Density & Chef-Friendly": minimal padding, solid backgrounds, no scroll for primary data.
- Conventional Commits required (`feat:`, `fix:`, `refactor:`, `chore(deps):`, etc.).
- Never `git push` without explicit user request.

## Environment variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `BCA_CLIENT_ID`, `BCA_CLIENT_SECRET`, `BCA_PRIVATE_KEY` (PKCS#8, `\n` literals are unescaped at runtime), `BCA_PARTNER_ID`, `BCA_MERCHANT_ID`, `BCA_TERMINAL_ID`, `BCA_BASE_URL`
- `BCA_SIMULATION=true` to force simulated QRIS responses
- `MIDTRANS_SERVER_KEY` if midtrans webhook still in use

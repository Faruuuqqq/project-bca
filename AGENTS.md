# Agent Instructions - SOK Ayam Kalintang

This repository contains a Self-Order Kiosk (SOK) and Admin Management System for **Ayam Kalintang**.

## 🚀 Critical Tech Stack & Conventions
- **Next.js 16 (Turbopack):** 
  - DO NOT use `middleware.ts`. Use `src/proxy.ts` and export a function named `proxy`.
  - Client components using `useSearchParams()` MUST be wrapped in `<Suspense />`.
- **PWA (Serwist):** Configuration is in `next.config.ts`. It is **disabled in development** to avoid Turbopack conflicts.
- **Supabase:** Uses `@supabase/ssr`. RLS is active on all tables. Realtime is enabled for `orders` and `menus`.
- **Commits:** Strictly follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.).

## 🎨 UI/UX Standards (Ayam Kalintang Brand)
- **Colors:** Primary `#0667AC` (Blue), Secondary `#FEB914` (Yellow).
- **Admin Modals:** 
  - **NO "X" close buttons** in the top-right. Users must use the "BATALKAN" button in the footer.
  - Dialogs MUST have an explicit `bg-white` class to prevent transparency issues.
- **Responsiveness:** Optimized for Tablet (768px+). Use `md:flex-row` for split screens (e.g., Cash Wait Screen).

## 🔐 Auth & Business Logic
- **Cashier PIN:** The hardcoded PIN for confirmation is `1234` (see `src/actions/payment.ts`).
- **Inventory:** Stock is automatically deducted on payment. Critical stock (≤ 5) should pulse red in the admin UI.
- **KDS (Kitchen Display):** Active orders display a live elapsed timer since payment.

## 🛠 Developer Commands
- **Dev:** `pnpm dev`
- **Build:** `pnpm build`
- **Seed Data:** SQL scripts `seed-v2.1.sql` or `seed-v3.sql` (for customizations) should be run in the Supabase SQL Editor.

## 📂 Folder Structure
- `src/actions/`: Server Actions (Order, Payment, Menu).
- `src/app/(kiosk)/`: Customer-facing routes (Welcome, Menu, Success).
- `src/app/admin/`: Staff-facing routes (Analytics, KDS, Inventory, Menu Editor).
- `src/proxy.ts`: Next.js 16 Middleware replacement.

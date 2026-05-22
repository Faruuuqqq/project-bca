# CLAUDE.md - Developer Guidelines for SOK Ayam Kalintang

This document provides quick reference points for AI assistants (like Claude or Gemini) working on this project.

## 🏗️ Architecture & Core Stack
- **Next.js 16 (App Router):** All routing uses the `app/` directory. Server Actions are strictly placed in `src/actions/`.
- **Supabase:** Used for Auth, PostgreSQL Database, and Realtime subscriptions.
  - *Rule:* Do not write direct SQL queries in components. Use the Supabase JS client.
- **Zustand:** Used for client-side state management (specifically the shopping cart in `src/store/cart.ts`).
- **Tailwind CSS v4 & shadcn/ui:** All styling is utility-first. Avoid writing custom CSS in `globals.css` unless absolutely necessary (e.g., custom scrollbars).
- **TypeScript:** Strict typing is enforced. Avoid `any` where possible, especially for database responses.

## 🎨 Design System (Ayam Kalintang v2.5)
- **Primary Brand Color:** BCA Blue (`#0667AC` / `bg-brand-primary`).
- **Secondary Brand Color:** Kalintang Yellow (`#FEB914` / `bg-brand-secondary`).
- **UI Philosophy:**
  - *Customer Kiosk:* "High-Impact & Frictionless". Large touch targets, no default selections in customization, and scroll-safe modals.
  - *Admin/KDS:* "High-Density & Chef-Friendly". Minimal padding, solid backgrounds, and maximum data visibility without scrolling.
- **Icons:** Use `lucide-react`.

## 🛡️ Security & "Anti-Gagal" Principles
- **No Hardcoded Secrets:** PINs and recovery codes MUST NOT be hardcoded in frontend components. They are validated via Server Actions against the `store_configs` table.
- **Persistent Lockouts:** Failed authentication attempts (e.g., Cashier PIN) use `localStorage` to survive page reloads.
- **Offline Handling:** Always provide visual feedback if `navigator.onLine` is false.
- **Idempotency:** Payment webhooks and stock adjustments must be idempotent to handle network retries safely.

## 📝 Git Workflow
- Strict adherence to **Conventional Commits** is required (`feat:`, `fix:`, `refactor:`, etc.).
- Never execute `git push` without explicit user permission or unless finalizing a major phase requested by the user.

## 🗂️ Key Directories
- `src/app/(kiosk)/`: Public-facing screens (Attract Screen, Menu, Checkout, Success).
- `src/app/admin/`: Protected routes for staff and owners (Dashboard, KDS, Menus, Inventory).
- `src/components/kiosk/`: Components specific to the customer flow.
- `src/components/admin/`: Components specific to the management hub.
- `src/actions/`: Backend logic (Server Actions).

*Refer to `PRD.txt` in the root folder for the complete business logic and feature specifications.*
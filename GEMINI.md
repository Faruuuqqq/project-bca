# GEMINI.md - Project Context & Instructions

## Project Overview
**SOK Ayam Kalintang** is a Self-Order Kiosk application designed for a restaurant. The goal is to provide a seamless ordering experience for customers (Dine-In/Take-Away) and an efficient, data-rich management board for owners and cashiers. The project has reached **v2.5 (Enterprise-Grade)**.

### Core Technology Stack
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend/Database:** Supabase (Auth, DB, Realtime, RLS)
- **State Management:** Zustand
- **Payment Gateway:** Simulated BCA Dynamic QRIS (BI-SNAP standard) & Cash flow
- **Charts:** Recharts

## Current Project Status
**Phase 4 Completed (Production Ready v2.5)**
The project has successfully implemented all core functionality, polished the UI/UX to a premium standard, and hardened the system against numerous edge cases.

### Key Achievements (v2.5)
- **Customer UI:** Cinematic Attract Screen, Clean Start Logic (abandoned cart prevention), High-Density Cart Sheet (scroll-safe), and unified BCA-aligned branding.
- **Admin UI:** Business Intelligence Dashboard (Revenue, AOV, Peak Hours, Stock Asset Value), Chef-Friendly KDS (compact 4-column layout with delay alerts), and cohesive management tables.
- **"Anti-Gagal" Security:** 
  - Cashier PIN and Recovery Codes are validated **Server-Side** against the `store_configs` Supabase table.
  - 10-attempt persistent lockout using `localStorage` (survives refreshes).
  - Real-time offline indicators to prevent network-related transaction failures.

## Building and Running
- **Install Dependencies:** `pnpm install`
- **Run Development Server:** `pnpm dev`
- **Build Project:** `pnpm build`
- **Linting:** `pnpm lint`

## Development Conventions
- **Strict adherence to PRD:** Always refer to `C:\College\BCA\PRD.txt` for the finalized blueprint.
- **Surgical Updates:** Use `replace` for precise code modifications.
- **Realtime focus:** Leverage Supabase Realtime for order updates, menu availability, and payment status.
- **Visuals:** Follow the "Ayam Kalintang" branding. Use deep blue (`#0667AC`) and yellow (`#FEB914`) prominently. Ensure touch targets are large and layouts do not force unnecessary scrolling.
- **Conventional Commits:** All git commits MUST follow the [Conventional Commits specification](https://www.conventionalcommits.org/).
  - `feat:` for new features.
  - `fix:` for bug fixes.
  - `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` are also used.

## Instructions for Gemini CLI
- **Phase-based progress:** We are in the final polish and documentation phase. 
- **Security Rule:** Any further authentication or authorization logic MUST be handled server-side. Never hardcode secrets in client components.
- **UI Rule:** Maintain the "High-Density" and "Chef-Friendly" principles. Do not introduce large, empty padding blocks in admin interfaces.
---
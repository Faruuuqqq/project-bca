# GEMINI.md - Project Context & Instructions

## Project Overview
**SOK Ayam Kalintang** is a Self-Order Kiosk application designed for a restaurant. The goal is to provide a seamless ordering experience for customers (Dine-In/Take-Away) and an efficient management board for cashiers.

### Core Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Database:** Supabase (Auth, DB, Realtime)
- **State Management:** Zustand
- **Payment Gateway:** Midtrans (QRIS & Cash flow)
- **PWA:** Serwist

## Current Project Status
The project has been initialized with a basic Next.js structure. However, it currently deviates from the PRD's recommended folder structure and is missing core dependencies.

### Planned Structure (as per PRD)
The project should follow a `src/` directory structure:
- `src/actions/`: Server Actions for orders, payment, and menu.
- `src/app/(kiosk)/`: Customer-facing routes (Welcome, Menu, Success).
- `src/app/admin/`: Cashier-facing routes (Login, Kanban Board, Menu Toggle).
- `src/components/`: Reusable UI components (kiosk, admin, ui).
- `src/lib/`: Utilities and Supabase clients.
- `src/store/`: Zustand stores (e.g., cart store).

## Building and Running
- **Install Dependencies:** `pnpm install`
- **Run Development Server:** `pnpm dev`
- **Build Project:** `pnpm build`
- **Linting:** `pnpm lint`

## Implementation Phases (Source: PRD.txt)
1. **Phase 0:** Infrastructure setup (Supabase, Env, Dependencies, Folder structure).
2. **Phase 1:** Kiosk UI, Menu Catalog, and Cart (Zustand).
3. **Phase 2:** Checkout flow and Midtrans Payment integration.
4. **Phase 3:** Cashier Dashboard (Realtime Kanban, PIN confirmation, Printing).
5. **Phase 4:** Polish, PWA, and Production deployment.

## Development Conventions
- **Strict adherence to PRD:** Always refer to `C:\College\BCA\PRD.txt` for implementation details.
- **Surgical Updates:** Use `replace` for precise code modifications.
- **Realtime focus:** Leverage Supabase Realtime for order updates and menu availability.
- **Visuals:** Follow the "Ayam Kalintang" branding (Brand colors, touch-friendly UI).

## Instructions for Gemini CLI
- **Phase-based progress:** Always check which phase we are in. Currently: **Phase 0**.
- **Supabase Integration:** Ensure RLS policies are implemented as defined in the SQL schema.
- **Environment Variables:** Never commit `.env.local`. Ensure all required keys are documented in `PRD.txt`.

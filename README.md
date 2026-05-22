# SOK Ayam Kalintang - Bakti BCA 2026

Self-Order Kiosk (SOK) application built for Ayam Kalintang, a local culinary business, as part of the Bakti BCA scholarship project. This project has been upgraded to **v2.5 (Enterprise-Grade)**, focusing on robust security, high operational efficiency, and a premium user experience.

## ✨ Key Features (v2.5 Updates)

### For Customers (Kiosk)
- **Cinematic Attract Screen:** A visually stunning, full-screen slideshow showcasing the menu to attract walk-in customers.
- **Clean Start Logic:** Automatically clears the cart upon selecting "Dine-in" or "Take-away" to prevent abandoned cart overlaps.
- **High-Density Cart:** A redesigned cart sheet that fits 5-7 items on screen without scrolling, featuring a locked header and footer to prevent UI clipping.
- **Frictionless Checkout:** Simulated BCA Dynamic QRIS (BI-SNAP) integration and a Cash Wait Screen with massive queue numbers.
- **Offline Fallback:** Real-time internet connectivity monitoring that visibly alerts customers if the connection drops.

### For Owners & Staff (Admin Hub)
- **Business Intelligence Dashboard:** Real-time metrics including Estimated Gross Profit, Average Order Value (AOV), Inventory Asset Value, and Peak Hour Analysis graphs.
- **Chef-Friendly KDS (Kitchen Display System):** An ultra-compact, 4-column layout that minimizes scrolling for chefs. Includes a live elapsed timer that pulses red if an order is delayed (>15 mins).
- **Unhackable Cashier Security:** Cashier PINs and Recovery Codes are validated strictly on the server-side via Supabase.
- **Persistent Lockout Mechanism:** If a PIN is entered incorrectly 10 times, the system locks out and persists this state in `localStorage`—even surviving page refreshes—until a supervisor enters the Recovery Code (4321).
- **Critical Stock Alerts:** Automated warnings for ingredients that drop below 10 portions.

## 🛠️ Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, Realtime, RLS)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Charts:** Recharts

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Environment Variables:**
   Create a `.env.local` file (refer to `PRD.txt` for required keys including Supabase URL and Anon Key).

3. **Run the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🛡️ "Anti-Gagal" Edge Cases Handled
- **Race Condition Protection:** Real-time stock syncing prevents users from buying out-of-stock items.
- **Double Payment Prevention:** Submit buttons are disabled immediately upon click during checkout.
- **Forced Customization:** No default selections in the customization sheet forces users to consciously pick their options (e.g., Breast vs. Thigh).
- **Category Deletion Safety:** Prevents admins from deleting a category if it still contains active menus.

---
*Built with passion by Tim Excellence UNPAD for Bakti BCA 2026.*
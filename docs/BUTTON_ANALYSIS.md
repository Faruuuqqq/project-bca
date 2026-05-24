# Button/Interactive Elements Under 40px - Complete Analysis

## Tailwind Size Reference
- `h-6` / `w-6` = 24px (0.375rem)
- `h-7` / `w-7` = 28px (0.4375rem)
- `h-8` / `w-8` = 32px (0.5rem)
- `h-9` / `w-9` = 36px (0.5625rem)
- `h-10` / `w-10` = 40px (0.625rem) ⚠️ AT THRESHOLD
- `h-12` / `w-12` = 48px (0.75rem)
- `h-14` / `w-14` = 56px (0.875rem)

## UI Component Base Sizes
From `src/components/ui/button.tsx`:
- `size="icon"` = `size-8` (32px × 32px)
- `size="icon-xs"` = `size-6` (24px × 24px)
- `size="icon-sm"` = `size-7` (28px × 28px)
- `size="icon-lg"` = `size-9` (36px × 36px)

---

## 1. BACK/NAVIGATION BUTTONS (All under 40px ✓)

### CartSheet.tsx - Close Button
- **Component:** CartSheet
- **File Path:** `src/components/kiosk/CartSheet.tsx` (Line 61)
- **Size:** `h-12 w-12` (mobile) → 48px | `lg:h-14 lg:w-14` (desktop) → 56px
- **Current Size:** 48px (mobile) **⚠️ EXCEEDS 40px**
- **Icon:** X (Close)
- **Purpose:** Close cart sheet
- **Interactive:** Yes - `onClick={() => onOpenChange(false)}`
- **Classes:** `rounded-full border-2 border-zinc-50 shadow-sm`
- **Status:** **OVER THRESHOLD** (48px mobile)

### MenuHeader.tsx - Back Button
- **Component:** MenuHeader
- **File Path:** `src/components/kiosk/MenuHeader.tsx` (Line 48)
- **Size:** `h-12 w-12` (mobile) → 48px | (desktop same)
- **Current Size:** 48px **⚠️ EXCEEDS 40px**
- **Icon:** ChevronLeft (with `stroke-[3]`)
- **Purpose:** Navigate back to home
- **Interactive:** Yes - wrapped in `<Link href="/">`
- **Classes:** `rounded-xl bg-white/20 border border-white/20 hover:bg-white/30`
- **Status:** **OVER THRESHOLD** (48px)

### QRISScreen.tsx - Back Button
- **Component:** QRISScreen
- **File Path:** `src/components/kiosk/QRISScreen.tsx` (Line 95)
- **Size:** `h-12 w-12` (mobile) → 48px | (desktop same)
- **Current Size:** 48px **⚠️ EXCEEDS 40px**
- **Icon:** ChevronLeft
- **Purpose:** Cancel QRIS payment
- **Interactive:** Yes - `onClick={onCancel}`
- **Classes:** `rounded-xl bg-white/10 border border-white/10 hover:bg-white/20`
- **Status:** **OVER THRESHOLD** (48px)

---

## 2. QUANTITY INCREMENT/DECREMENT BUTTONS (Under 40px - Mobile, Over 40px - Desktop)

### CartSheet.tsx - Minus Button (Decrement Quantity)
- **Component:** CartSheet
- **File Path:** `src/components/kiosk/CartSheet.tsx` (Line 91-98)
- **Size:** `h-12 w-12` (mobile) → 48px | `lg:h-14 lg:w-14` (desktop) → 56px
- **Current Size:** 48px (mobile) **⚠️ EXCEEDS 40px**
- **Icon:** Minus (or Trash2 when qty=1)
- **Purpose:** Decrease item quantity / Remove item
- **Interactive:** Yes - `onClick={() => updateQty(item.menuId, -1, ...)}`
- **Classes:** `rounded-xl lg:rounded-2xl bg-white shadow-sm hover:text-red-500`
- **Status:** **OVER THRESHOLD** (48px mobile)

### CartSheet.tsx - Plus Button (Increment Quantity)
- **Component:** CartSheet
- **File Path:** `src/components/kiosk/CartSheet.tsx` (Line 100-107)
- **Size:** `h-12 w-12` (mobile) → 48px | `lg:h-14 lg:w-14` (desktop) → 56px
- **Current Size:** 48px (mobile) **⚠️ EXCEEDS 40px**
- **Icon:** Plus
- **Purpose:** Increase item quantity
- **Interactive:** Yes - `onClick={() => updateQty(item.menuId, 1, ...)}`
- **Classes:** `rounded-xl lg:rounded-2xl bg-white shadow-sm hover:text-brand-primary`
- **Status:** **OVER THRESHOLD** (48px mobile)

### CustomizationSheet.tsx - Minus Button (Decrement Quantity)
- **Component:** CustomizationSheet
- **File Path:** `src/components/kiosk/CustomizationSheet.tsx` (Line 195-202)
- **Size:** `h-12 w-12` (mobile) → 48px | `lg:h-14 lg:w-14` (desktop) → 56px
- **Current Size:** 48px (mobile) **⚠️ EXCEEDS 40px**
- **Icon:** Minus
- **Purpose:** Decrease customized item quantity
- **Interactive:** Yes - `onClick={() => setQuantity(q => Math.max(1, q - 1))}`
- **Classes:** `rounded-xl lg:rounded-2xl bg-white shadow-sm`
- **Status:** **OVER THRESHOLD** (48px mobile)

### CustomizationSheet.tsx - Plus Button (Increment Quantity)
- **Component:** CustomizationSheet
- **File Path:** `src/components/kiosk/CustomizationSheet.tsx` (Line 204-211)
- **Size:** `h-12 w-12` (mobile) → 48px | `lg:h-14 lg:w-14` (desktop) → 56px
- **Current Size:** 48px (mobile) **⚠️ EXCEEDS 40px**
- **Icon:** Plus
- **Purpose:** Increase customized item quantity
- **Interactive:** Yes - `onClick={() => setQuantity(q => q + 1)}`
- **Classes:** `rounded-xl lg:rounded-2xl bg-white shadow-sm`
- **Status:** **OVER THRESHOLD** (48px mobile)

---

## 3. CLOSE/CANCEL BUTTONS (Various sizes, most under 40px ✓)

### CustomizationSheet.tsx - Close Button
- **Component:** CustomizationSheet
- **File Path:** `src/components/kiosk/CustomizationSheet.tsx` (Line 124)
- **Size:** `h-10 w-10` → 40px
- **Current Size:** 40px **⚠️ AT THRESHOLD**
- **Icon:** X (Close)
- **Purpose:** Close customization dialog
- **Interactive:** Yes - `onClick={() => onOpenChange(false)}`
- **Classes:** `rounded-full` (implied icon button)
- **Status:** **AT THRESHOLD** (exactly 40px)

### PaymentMethodModal.tsx - Close Button
- **Component:** PaymentMethodModal
- **File Path:** `src/components/kiosk/PaymentMethodModal.tsx` (Line 31)
- **Size:** `h-10 w-10` → 40px
- **Current Size:** 40px **⚠️ AT THRESHOLD**
- **Icon:** X (Close)
- **Purpose:** Close payment method selector
- **Interactive:** Yes - `onClick={() => onOpenChange(false)}`
- **Classes:** `rounded-full hover:bg-red-50 hover:text-red-500`
- **Status:** **AT THRESHOLD** (exactly 40px)

---

## 4. ACTION BUTTONS (All over 40px, but important for context)

### CartSheet.tsx - "Tambah Menu Lain" Button
- **Component:** CartSheet
- **File Path:** `src/components/kiosk/CartSheet.tsx` (Line 138-144)
- **Size:** `h-10` (mobile) → 40px | `lg:h-12` (desktop) → 48px
- **Current Size:** 40px (mobile) **⚠️ AT THRESHOLD** | 48px (desktop)
- **Purpose:** Add more menu items to cart
- **Interactive:** Yes - `onClick={() => onOpenChange(false)}`
- **Status:** **AT/OVER THRESHOLD** (40-48px)

### CashWaitScreen.tsx - PIN Input Area
- **Component:** CashWaitScreen
- **File Path:** `src/components/kiosk/CashWaitScreen.tsx` (Line 239-249)
- **Size:** `h-20` (mobile) → 80px | `lg:h-24` (desktop) → 96px
- **Current Size:** 80px **⚠️ OVER THRESHOLD**
- **Purpose:** PIN entry field for cash payment confirmation
- **Interactive:** Yes - `onChange` text input
- **Status:** **OVER THRESHOLD** (80px mobile)

### QRISScreen.tsx - Status Check Button
- **Component:** QRISScreen
- **File Path:** `src/components/kiosk/QRISScreen.tsx` (Line 181-189)
- **Size:** `h-14` (mobile) → 56px | `lg:h-16` (desktop) → 64px
- **Current Size:** 56px **⚠️ OVER THRESHOLD**
- **Purpose:** Manually check payment status
- **Interactive:** Yes - `onClick={checkStatusManual}`
- **Status:** **OVER THRESHOLD** (56px mobile)

### QRISScreen.tsx - "Ganti Metode Pembayaran" Button
- **Component:** QRISScreen
- **File Path:** `src/components/kiosk/QRISScreen.tsx` (Line 191-197)
- **Size:** `h-10` (mobile) → 40px | `lg:h-12` (desktop) → 48px
- **Current Size:** 40px (mobile) **⚠️ AT THRESHOLD** | 48px (desktop)
- **Purpose:** Switch to different payment method
- **Interactive:** Yes - `onClick={onCancel}`
- **Status:** **AT/OVER THRESHOLD** (40-48px)

---

## SUMMARY BY CATEGORY

### ✅ UNDER 40px (None - all are 40px or over)
- None found

### ⚠️ AT EXACTLY 40px (3 buttons)
1. CustomizationSheet - Close button (`h-10 w-10`)
2. PaymentMethodModal - Close button (`h-10 w-10`)
3. CartSheet - "Tambah Menu Lain" button (mobile: `h-10`)
4. QRISScreen - "Ganti Metode" button (mobile: `h-10`)

### ❌ OVER 40px (9 buttons)
1. CartSheet - Close button (48px mobile, 56px desktop)
2. MenuHeader - Back button (48px)
3. QRISScreen - Back button (48px)
4. CartSheet - Minus/Trash button (48px mobile, 56px desktop)
5. CartSheet - Plus button (48px mobile, 56px desktop)
6. CustomizationSheet - Minus button (48px mobile, 56px desktop)
7. CustomizationSheet - Plus button (48px mobile, 56px desktop)
8. CashWaitScreen - PIN input (80px mobile)
9. QRISScreen - Check status button (56px mobile)

---

## DESIGN ISSUE ANALYSIS

### Key Findings:
1. **No buttons are truly "under 40px"** - The smallest are exactly 40px (`h-10`)
2. **Most interactive buttons are 4

# Admin Menus Page Redesign

**Date:** May 24, 2026  
**Objective:** Fix card layout issues, improve category display, add quick sold-out toggle, and optimize for iPad landscape  
**Owner:** Ayam Kalintang Admin Dashboard

---

## Problem Statement

### Current Issues
1. **Category names show random characters** - Data corruption in display (not database)
2. **Cards are cramped/stacking** - `space-y-2` causing items to wrap and overlap
3. **"Habis" (Sold Out) status** - Requires opening dialog to toggle, should have quick action button
4. **Not optimized for iPad** - Horizontal layout needed for 768px+ landscape

---

## Design Specification

### 1. Fix Category Data Display
**Root Cause:** Line 349 in MenuManager.tsx accessing `menu.categories?.[0]?.name` correctly, but:
- May be receiving null/undefined from query
- May have encoding issue in rendering

**Solution:**
- Verify Supabase query returns proper UTF-8 text
- Add fallback: If category is missing/corrupt, show "(No Category)" badge instead of random chars
- Ensure no text overflow with `truncate` class on category span

### 2. Horizontal Card Layout (No Scrolling)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Image] │ Name      │ Category  │ Price    │ Stock  │ Status  │ Edit │ Delete │
│ 12x12   │ Truncate  │ Truncate  │ Formatted│ X pcs  │ Badge   │ Btn  │  Btn   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Remove `touch-scroll` class from container (line 314)
- Change flex direction: keep `flex items-center gap-3` (horizontal)
- Use `grid` with fixed columns instead of flex for better alignment
- Responsive: Use `md:grid` to switch from stacked (mobile) to horizontal (tablet+)
- **Important for iPad:** `grid-cols-[60px_1fr_120px_100px_80px_60px_40px_40px]` or similar fixed widths

**Column Specs:**
| Column | Width | Content | Behavior |
|--------|-------|---------|----------|
| Thumbnail | 60px | Image or icon | Square, rounded corners |
| Name | 1fr (flex) | Menu name | `truncate` to prevent wrap |
| Category | 120px | Category name | `truncate`, fallback text |
| Price | 100px | Rp format | Right-aligned |
| Stock | 80px | "X pcs" | Center-aligned |
| Status | 60px | "Habis" / "Ready" badge | Center |
| Edit Button | 40px | Icon only | Touch-friendly 44px min |
| Delete Button | 40px | Icon only | Touch-friendly 44px min |

### 3. Quick Toggle for "Habis" Status

**Current Behavior:** Click card → open dialog → toggle switch → save  
**New Behavior:** Click status badge directly → toggle immediately → toast notification

**Implementation:**
- Replace Badge (line 339-346) with a clickable button
- Button styling: same badge look (colored background) but `cursor-pointer`
- Action: Call new server action `toggleMenuSoldOut(menuId)` 
- No dialog needed - immediate feedback with toast
- Optimistic UI: Update local state, then sync with server

**Button Style:**
```tsx
<button
  onClick={() => handleToggleSoldOut(menu.id)}
  className={cn(
    'text-white text-[10px] font-semibold px-2 py-1 rounded-md shrink-0',
    'transition-all hover:scale-105 active:scale-95',
    menu.is_sold_out ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
  )}
>
  {menu.is_sold_out ? 'Habis' : 'Ready'}
</button>
```

### 4. Fix Base UI Warnings (Uncontrolled Form Components)

**Issues in MenuManager.tsx:**
- Line 568: `Select` with `defaultValue` but no `onValueChange`
- Input fields with `defaultValue` but no `onChange`
- Line ~570: Switch with `defaultChecked` but no `onCheckedChange`

**Solution:**
- Use `value` + `onValueChange` instead of `defaultValue` for Select
- Use `value` + `onChange` instead of `defaultValue` for Input
- Use `checked` + `onCheckedChange` instead of `defaultChecked` for Switch
- Manage state with `useState` for dialog form fields

### 5. Remove Unnecessary Scroll & Spacing

**Current Line 314:** `<div className="space-y-2 touch-scroll">`  
**Change to:** `<div className="space-y-2">`

- `touch-scroll` was making the container scrollable
- `space-y-2` is fine for card vertical spacing
- Container should NOT be scrollable; let page body handle scrolling

---

## Implementation Checklist

- [ ] **Fix category data rendering** - Add fallback for null/corrupt categories
- [ ] **Convert flex layout to grid** - 8 fixed-width columns for iPad
- [ ] **Remove touch-scroll class** - Line 314
- [ ] **Make status badge clickable** - New `toggleMenuSoldOut` server action
- [ ] **Add optimistic UI for toggle** - Local state update before API call
- [ ] **Fix Select/Input/Switch controlled state** - Use `value`/`onChange` props
- [ ] **Test on iPad (768px landscape)** - All columns visible without horizontal scroll
- [ ] **Test touch interactions** - Buttons are 44px minimum for comfort
- [ ] **Add toast notifications** - Feedback when status changes
- [ ] **Verify no Base UI warnings** - Run dev server and check console

---

## Data Flow

### Current (Edit Dialog)
1. User clicks Edit button
2. Dialog opens with form
3. User toggles "Habis" switch
4. User clicks save
5. Server updates `is_sold_out` column
6. Page refreshes

### New (Quick Toggle)
1. User clicks status badge
2. `handleToggleSoldOut(menuId)` called
3. Local state updates immediately (optimistic)
4. `toggleMenuSoldOut(menuId)` server action runs
5. Server updates `is_sold_out` column
6. Toast shows "Status updated"
7. No page refresh needed

---

## Server Action Needed

Create new function in `src/actions/menu.ts`:

```typescript
export async function toggleMenuSoldOut(menuId: string) {
  const supabase = await createClient()
  
  // Get current state
  const { data: menu, error: fetchError } = await supabase
    .from('menus')
    .select('is_sold_out')
    .eq('id', menuId)
    .single()
  
  if (fetchError) throw new Error(fetchError.message)
  
  // Toggle
  const { error: updateError } = await supabase
    .from('menus')
    .update({ is_sold_out: !menu.is_sold_out })
    .eq('id', menuId)
  
  if (updateError) throw new Error(updateError.message)
  
  revalidatePath('/admin/menus')
  return { success: true, is_sold_out: !menu.is_sold_out }
}
```

---

## Testing Checklist

- [ ] Category names display correctly (no random chars)
- [ ] All 8 columns visible on iPad landscape (768px)
- [ ] No horizontal scrolling needed
- [ ] Click status badge → toggles immediately
- [ ] Toast shows success message
- [ ] Edit/Delete buttons still work
- [ ] No Base UI console warnings
- [ ] Touch targets are ≥44px
- [ ] Category fallback shows if data is missing

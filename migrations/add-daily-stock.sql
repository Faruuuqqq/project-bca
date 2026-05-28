-- Migration: Add daily_stock column to menus
-- Purpose: Store the default daily stock amount per menu item.
-- Admin sets this once; pressing "Reset Stok Harian" restores
-- current_stock to this value every day.
-- Run this in Supabase SQL Editor.

ALTER TABLE menus ADD COLUMN IF NOT EXISTS daily_stock INT DEFAULT 0;

-- Comment: daily_stock = 0 means "not configured" (no daily reset for this item)

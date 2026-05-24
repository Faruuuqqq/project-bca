-- Migration: add cost_price (COGS) to menus
-- Run this in Supabase SQL Editor before deploying PR3.
-- After running, populate cost_price per menu via Admin → Katalog Menu dialog.

ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN menus.cost_price IS
  'Cost of goods sold per portion in IDR. Used by getDashboardStats to compute real gross profit.';

-- Optional: backfill an estimate (35% COGS) for legacy rows so dashboard
-- shows non-zero margin until owner enters real numbers.
-- UPDATE menus SET cost_price = ROUND(price * 0.35, 0) WHERE cost_price = 0;

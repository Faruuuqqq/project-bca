-- Migration: Add stock_deducted flag to orders
-- Purpose: Idempotent guard to prevent double stock deduction
-- when both Midtrans webhook and polling fire for the same order.
-- Run this in Supabase SQL Editor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE;

-- Index for fast lookup on unpaid/undeducted orders
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted ON orders(stock_deducted) WHERE stock_deducted = FALSE;

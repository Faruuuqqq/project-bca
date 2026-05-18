-- Migration: Ensure 'reason' column exists on inventory_movements
-- Run this in Supabase SQL Editor.
-- This handles the case where the table was created before migration 002
-- and the CREATE TABLE IF NOT EXISTS was skipped (table already existed without 'reason').

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_movements' AND column_name = 'reason'
  ) THEN
    ALTER TABLE inventory_movements ADD COLUMN reason TEXT;
  END IF;
END $$;

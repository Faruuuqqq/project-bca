-- Migration: Fix inventory_movements table schema
-- Run this in Supabase SQL Editor.
-- This ensures the table has the correct columns expected by the application.

-- Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
  quantity INT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table exists but uses 'quantity' instead of 'amount', rename it
-- (Skip if 'amount' already exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_movements' AND column_name = 'quantity'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_movements' AND column_name = 'amount'
  ) THEN
    ALTER TABLE inventory_movements RENAME COLUMN quantity TO amount;
  END IF;

  -- If neither 'quantity' nor 'amount' exists, add 'amount'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_movements' AND column_name = 'amount'
  ) THEN
    ALTER TABLE inventory_movements ADD COLUMN amount INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Enable RLS (consistent with other tables)
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Allow authenticated read'
  ) THEN
    CREATE POLICY "Allow authenticated read" ON inventory_movements
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Allow authenticated insert'
  ) THEN
    CREATE POLICY "Allow authenticated insert" ON inventory_movements
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_movements_menu_id ON inventory_movements(menu_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

-- Migration: Create atomic decrement_stock RPC function
-- Purpose: Prevent race conditions when deducting stock for concurrent orders.
-- Uses GREATEST(0, ...) to prevent negative stock values.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION decrement_stock(p_menu_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE menus
  SET current_stock = GREATEST(0, current_stock - p_amount)
  WHERE id = p_menu_id;
END;
$$ LANGUAGE plpgsql;

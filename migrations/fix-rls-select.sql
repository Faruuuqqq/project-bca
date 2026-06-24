-- Migration: Fix RLS policies to allow anon read access
-- Problem: Anon key is used by the kiosk to fetch menus and orders, but we want 
-- to protect against unauthorized writes from the browser.
-- Solution: Grant SELECT to anon for necessary tables. 
-- All writes are handled securely via Server Actions using the service-role key.
--
-- Run this in Supabase SQL Editor.

-- Enable RLS on all related tables (if not already enabled)
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_configs ENABLE ROW LEVEL SECURITY;

-- 1. Menus & Categories (Publicly readable for kiosk)
CREATE POLICY "anon_select_menus" ON menus FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon USING (true);

-- 2. Menu Options (Publicly readable for kiosk)
CREATE POLICY "anon_select_menu_options" ON menu_options FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_menu_option_values" ON menu_option_values FOR SELECT TO anon USING (true);

-- 3. Orders & Order Items (Customer needs to see their own order on success page)
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_order_item_options" ON order_item_options FOR SELECT TO anon USING (true);

-- 4. Store Configs (Needed for cashier PIN check on fallback)
CREATE POLICY "anon_select_store_configs" ON store_configs FOR SELECT TO anon USING (true);

-- NOTE: No INSERT/UPDATE/DELETE policies are needed for anon because 
-- all mutations are now done through the service-role key in Server Actions.

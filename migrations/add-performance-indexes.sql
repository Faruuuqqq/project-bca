-- Performance indexes for Inventory History & Orders History
-- Run this in Supabase SQL Editor

-- Index on inventory_movements for history queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at 
ON inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_menu_id 
ON inventory_movements(menu_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type 
ON inventory_movements(movement_type);

-- Composite index for filtered inventory history queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_menu_created 
ON inventory_movements(menu_id, created_at DESC);

-- Index on orders for history queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_order_status 
ON orders(order_status);

-- Composite index for order filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(payment_status, order_status, created_at DESC);

-- Index on order_items for fast lookup
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Index on menus for current_stock checks (inventory alerts)
CREATE INDEX IF NOT EXISTS idx_menus_current_stock 
ON menus(current_stock) WHERE current_stock <= 5;

-- Add priority flag to orders for KDS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false;

-- Add actual_prep_time for analytics
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_prep_time_seconds INT;

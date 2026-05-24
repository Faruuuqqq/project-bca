-- Add stock alert tracking table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_by UUID,
  stock_level INT NOT NULL,
  threshold INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add critical_stock_threshold column to menus if not exists
ALTER TABLE menus ADD COLUMN IF NOT EXISTS critical_stock_threshold INT DEFAULT 5;

-- Create index for fast alert queries
CREATE INDEX IF NOT EXISTS idx_stock_alerts_menu_id ON stock_alerts(menu_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_dismissed_at ON stock_alerts(dismissed_at);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_triggered_at ON stock_alerts(triggered_at DESC);

-- Create composite index for undismissed alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON stock_alerts(menu_id)
WHERE dismissed_at IS NULL;

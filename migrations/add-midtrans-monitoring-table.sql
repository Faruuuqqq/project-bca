-- Midtrans Transaction Monitoring Table
-- FIX #3: Enables visibility into payment system health
-- Created: 2026-05-23

-- ============================================================================
-- Create midtrans_transactions table for logging all Midtrans API calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS midtrans_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_type VARCHAR NOT NULL, -- 'charge', 'status', 'webhook'
  status VARCHAR NOT NULL, -- 'success', 'failed', 'timeout'
  amount DECIMAL(12, 0),
  error_message TEXT,
  response_time_ms INTEGER,
  http_status INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Create indexes for efficient querying
-- ============================================================================

-- Query by order for debugging
CREATE INDEX IF NOT EXISTS idx_midtrans_order_id 
ON midtrans_transactions(order_id DESC);

-- Query by date for monitoring
CREATE INDEX IF NOT EXISTS idx_midtrans_created_at 
ON midtrans_transactions(created_at DESC);

-- Query by type for analytics (charge, status, webhook)
CREATE INDEX IF NOT EXISTS idx_midtrans_type_date
ON midtrans_transactions(transaction_type, created_at DESC);

-- Query failures for alerting
CREATE INDEX IF NOT EXISTS idx_midtrans_failures
ON midtrans_transactions(status, created_at DESC)
WHERE status != 'success';

-- ============================================================================
-- Create views for monitoring dashboards
-- ============================================================================

-- Hourly success rate
CREATE OR REPLACE VIEW midtrans_hourly_stats AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  transaction_type,
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate,
  ROUND(AVG(response_time_ms)) as avg_response_ms
FROM midtrans_transactions
GROUP BY DATE_TRUNC('hour', created_at), transaction_type, status
ORDER BY hour DESC;

-- Daily statistics
CREATE OR REPLACE VIEW midtrans_daily_stats AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'timeout') as timed_out,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate,
  ROUND(AVG(response_time_ms)) as avg_response_ms,
  MAX(response_time_ms) as max_response_ms
FROM midtrans_transactions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Recent errors for alerting
CREATE OR REPLACE VIEW midtrans_recent_errors AS
SELECT
  created_at,
  order_id,
  transaction_type,
  http_status,
  error_message
FROM midtrans_transactions
WHERE status != 'success' AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- Create function to clean up old logs (optional)
-- Run manually: SELECT cleanup_midtrans_logs();
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_midtrans_logs()
RETURNS void
LANGUAGE SQL
AS $$
  DELETE FROM midtrans_transactions
  WHERE created_at < NOW() - INTERVAL '90 days';
$$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE midtrans_transactions IS 'Logs all Midtrans API interactions for monitoring and debugging';
COMMENT ON COLUMN midtrans_transactions.transaction_type IS 'Type of transaction: charge (QRIS gen), status (inquiry), webhook (payment notification)';
COMMENT ON COLUMN midtrans_transactions.status IS 'Result: success, failed, or timeout';
COMMENT ON COLUMN midtrans_transactions.response_time_ms IS 'Response time in milliseconds (useful for performance monitoring)';
COMMENT ON VIEW midtrans_hourly_stats IS 'Hourly success rate and performance metrics';
COMMENT ON VIEW midtrans_daily_stats IS 'Daily aggregate statistics for SLA reporting';
COMMENT ON VIEW midtrans_recent_errors IS 'Recent errors for debugging and alerting';

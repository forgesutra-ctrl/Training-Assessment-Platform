-- ============================================================================
-- User time spent (managers and trainers) for admin visibility
-- ============================================================================
-- Prerequisite: Run migrations/allow-managers-read-trainer-profiles.sql first
-- (defines current_user_role() used by RLS).
--
-- Logs time spent on the system per user/role/date. Frontend sends a heartbeat
-- every 60 seconds while on Manager or Trainer dashboard; this table stores
-- daily totals. Admins see aggregated time in Manager Activity and Trainer
-- Performance tabs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_time_spent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'trainer')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role, date)
);

CREATE INDEX IF NOT EXISTS idx_user_time_spent_user_role_date
  ON user_time_spent (user_id, role, date);
CREATE INDEX IF NOT EXISTS idx_user_time_spent_date ON user_time_spent (date DESC);

COMMENT ON TABLE user_time_spent IS 'Daily time spent on system by managers and trainers; used for admin reporting.';

-- RLS: only admins can read; writes go through SECURITY DEFINER function
ALTER TABLE user_time_spent ENABLE ROW LEVEL SECURITY;

-- Admins can view all time spent
CREATE POLICY "Admins can view all user time spent"
  ON user_time_spent FOR SELECT
  USING (public.current_user_role() = 'admin');

-- Users can view their own rows (optional, for future self-view)
CREATE POLICY "Users can view own time spent"
  ON user_time_spent FOR SELECT
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE from client; use record_time_spent() RPC
-- (So we do not create INSERT/UPDATE policies for authenticated users.)

-- ============================================================================
-- RPC: record_time_spent(role) — call every ~60s from Manager/Trainer dashboard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_time_spent(p_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_role IS NULL OR p_role NOT IN ('manager', 'trainer') THEN
    RETURN;
  END IF;
  INSERT INTO user_time_spent (user_id, role, date, total_seconds, updated_at)
  VALUES (auth.uid(), p_role, CURRENT_DATE, 60, NOW())
  ON CONFLICT (user_id, role, date)
  DO UPDATE SET
    total_seconds = user_time_spent.total_seconds + 60,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION public.record_time_spent(TEXT) IS 'Record 60 seconds of time spent for current user in the given role (manager/trainer). Call from frontend every 60s while on dashboard.';

-- ============================================================================
-- After running: use record_time_spent from Manager/Trainer dashboards;
-- admins see time in Manager Activity and Trainer Performance.
-- ============================================================================

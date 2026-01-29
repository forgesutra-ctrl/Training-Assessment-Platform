-- ============================================================================
-- Fix RLS recursion on profiles + allow managers to read trainer profiles
-- ============================================================================
-- Policies on "profiles" must NOT query "profiles" (e.g. EXISTS (SELECT from
-- profiles)), or Postgres raises "infinite recursion detected in policy" (42P17).
-- Use SECURITY DEFINER helpers so role/team checks do not trigger RLS.
-- ============================================================================

-- Helpers (run with definer rights; no RLS when they read profiles)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Replace policies that reference profiles (to remove recursion)
DROP POLICY IF EXISTS "Managers can view their team profiles" ON profiles;
CREATE POLICY "Managers can view their team profiles"
    ON profiles FOR SELECT
    USING (
        public.current_user_role() = 'manager'
        AND (
            profiles.team_id = public.current_user_team_id()
            OR profiles.reporting_manager_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.current_user_role() = 'admin');

-- Allow managers to read all trainer profiles (for assessment dropdown)
DROP POLICY IF EXISTS "Managers can view all trainer profiles for assessment" ON profiles;
CREATE POLICY "Managers can view all trainer profiles for assessment"
    ON profiles FOR SELECT
    USING (
        profiles.role = 'trainer'
        AND public.current_user_role() = 'manager'
    );

-- ============================================================================
-- After running: (1) Profile fetch / auth no longer hits recursion.
-- (2) Manager "Select Trainer" dropdown shows eligible trainers.
-- ============================================================================

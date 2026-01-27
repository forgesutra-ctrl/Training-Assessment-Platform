-- ============================================================================
-- Fix: Infinite Recursion in RLS Policies for Profiles Table
-- ============================================================================
-- This script fixes the "infinite recursion detected in policy" error
-- by creating a SECURITY DEFINER function that can check user roles
-- without triggering RLS policies.
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;

-- Create a SECURITY DEFINER function to get user role
-- This function bypasses RLS because it runs with superuser privileges
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $function$
DECLARE
    user_role TEXT;
BEGIN
    -- Query profiles table without triggering RLS (SECURITY DEFINER bypasses RLS)
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, '');
END;
$function$;

-- Create a convenience function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $function$
BEGIN
    RETURN get_user_role(auth.uid());
END;
$function$;

-- Create a function to get user's team_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_team_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $function$
DECLARE
    user_team_id UUID;
BEGIN
    -- Query profiles table without triggering RLS (SECURITY DEFINER bypasses RLS)
    SELECT team_id INTO user_team_id
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_team_id;
END;
$function$;

-- Create a convenience function to get current user's team_id
CREATE OR REPLACE FUNCTION get_current_user_team_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $function$
BEGIN
    RETURN get_user_team_id(auth.uid());
END;
$function$;

-- ============================================================================
-- Drop and recreate policies to use the new function
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
DROP POLICY IF EXISTS "Trainers can view their own assessments" ON assessments;
DROP POLICY IF EXISTS "Managers can view assessments they created" ON assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON assessments;
DROP POLICY IF EXISTS "Managers can create assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can create assessments" ON assessments;
DROP POLICY IF EXISTS "Managers can update assessments they created" ON assessments;
DROP POLICY IF EXISTS "Admins can update all assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can delete assessments" ON assessments;

-- ===== PROFILES POLICIES (FIXED) =====

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Managers can view profiles of their team members
-- FIXED: Uses helper functions instead of querying profiles directly
CREATE POLICY "Managers can view their team profiles"
    ON profiles FOR SELECT
    USING (
        get_current_user_role() = 'manager'
        AND (
            -- Manager can see profiles in their team
            team_id = get_current_user_team_id()
            -- OR manager can see their direct reports
            OR reporting_manager_id = auth.uid()
        )
    );

-- Admins can view all profiles
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (get_current_user_role() = 'admin');

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- ===== TEAMS POLICIES (FIXED) =====

-- Everyone can view teams
CREATE POLICY "Everyone can view teams"
    ON teams FOR SELECT
    USING (true);

-- Only admins can insert/update/delete teams
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can manage teams"
    ON teams FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- ===== ASSESSMENTS POLICIES (FIXED) =====

-- Trainers can view their own assessments
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Trainers can view their own assessments"
    ON assessments FOR SELECT
    USING (
        trainer_id = auth.uid()
        AND get_current_user_role() = 'trainer'
    );

-- Managers can view assessments they created
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Managers can view assessments they created"
    ON assessments FOR SELECT
    USING (
        assessor_id = auth.uid()
        AND get_current_user_role() = 'manager'
    );

-- Admins can view all assessments
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can view all assessments"
    ON assessments FOR SELECT
    USING (get_current_user_role() = 'admin');

-- Managers can create assessments (trigger will prevent direct report assessments)
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Managers can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (
        get_current_user_role() = 'manager'
        AND assessor_id = auth.uid()
    );

-- Admins can create assessments
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (get_current_user_role() = 'admin');

-- Managers can update assessments they created
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Managers can update assessments they created"
    ON assessments FOR UPDATE
    USING (
        assessor_id = auth.uid()
        AND get_current_user_role() = 'manager'
    )
    WITH CHECK (
        assessor_id = auth.uid()
        AND get_current_user_role() = 'manager'
    );

-- Admins can update all assessments
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can update all assessments"
    ON assessments FOR UPDATE
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can delete assessments
-- FIXED: Uses get_user_role() function instead of querying profiles directly
CREATE POLICY "Admins can delete assessments"
    ON assessments FOR DELETE
    USING (get_current_user_role() = 'admin');

-- ============================================================================
-- Grant execute permissions on the functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_team_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_team_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION get_user_team_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_current_user_team_id() TO anon;

-- ============================================================================
-- Verification: Test that the functions work
-- ============================================================================

-- You can test with:
-- SELECT get_current_user_role(); -- Should return your role if logged in
-- SELECT get_user_role('user-uuid-here'); -- Should return role for that user

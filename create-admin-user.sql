-- ============================================================================
-- Create Admin User - Quick Setup Script
-- ============================================================================
-- This script helps you create an admin user for testing
-- 
-- IMPORTANT: You must create the auth user FIRST in Supabase Dashboard
-- before running the profile insert below.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Auth User in Supabase Dashboard
-- ============================================================================
-- 1. Go to: Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter:
--    - Email: admin@test.com (or your preferred email)
--    - Password: Admin@123456 (or your preferred password)
--    - Check "Auto Confirm User"
-- 4. Click "Create User"
-- 5. COPY THE USER ID (UUID) - you'll need it below
-- ============================================================================

-- ============================================================================
-- STEP 2: Get Your User ID
-- ============================================================================
-- Run this query to find your admin user ID:
-- SELECT id, email FROM auth.users WHERE email = 'admin@test.com';
-- 
-- Copy the UUID from the result
-- ============================================================================

-- ============================================================================
-- STEP 3: Insert Admin Profile
-- ============================================================================
-- Replace 'YOUR-ADMIN-USER-ID-HERE' with the actual UUID from Step 2
-- Then run this INSERT statement:
-- ============================================================================

INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES (
    'YOUR-ADMIN-USER-ID-HERE',  -- Replace with actual UUID from auth.users
    'Admin User',               -- Full name
    'admin',                    -- Role (must be 'admin', 'manager', or 'trainer')
    NULL,                       -- Team ID (NULL for admins)
    NULL                        -- Reporting Manager (NULL for admins)
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- ============================================================================
-- STEP 4: Verify Admin User
-- ============================================================================
-- Run this to verify your admin profile was created:
-- SELECT id, full_name, role FROM profiles WHERE role = 'admin';
-- ============================================================================

-- ============================================================================
-- RECOMMENDED TEST ADMIN CREDENTIALS
-- ============================================================================
-- Email: admin@test.com
-- Password: Admin@123456
-- Role: admin
-- 
-- After creating, you can login with these credentials
-- ============================================================================

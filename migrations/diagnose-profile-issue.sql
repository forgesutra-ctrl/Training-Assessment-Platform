-- Diagnostic Queries to Find Profile Issues
-- Run these one by one in Supabase SQL Editor to diagnose the problem

-- 1. Check if profiles exist for auth users
SELECT 
  au.id as user_id,
  au.email,
  CASE WHEN p.id IS NOT NULL THEN '✅ HAS PROFILE' ELSE '❌ MISSING PROFILE' END as profile_status,
  p.full_name,
  p.role,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 2. Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if RLS is enabled on profiles
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 4. Test if a specific user can read their own profile (replace USER_ID_HERE)
-- First, get a user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then test (replace with actual user ID):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_HERE';
-- SELECT * FROM profiles WHERE id = 'USER_ID_HERE';

-- 5. Check for any constraints or triggers that might block inserts
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;

-- 6. Verify the profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Count profiles vs auth users
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM profiles) as missing_profiles;

-- 8. Check if there are any profiles with NULL or invalid data
SELECT 
  id,
  full_name,
  role,
  team_id,
  reporting_manager_id,
  created_at
FROM profiles
WHERE full_name IS NULL 
   OR role IS NULL
   OR role NOT IN ('admin', 'manager', 'trainer')
ORDER BY created_at DESC;

-- Create Missing Profiles for Existing Auth Users
-- This script creates profile records for users who exist in auth.users but don't have profiles
-- Run this in Supabase SQL Editor if auto-create fails

-- Step 1: Check which users are missing profiles
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'role' as role,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Step 2: Create profiles for users missing them
-- This will create profiles with default values based on user metadata
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    INITCAP(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '))
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'role',
    'trainer'  -- Default role
  )::text as role,
  NULL as team_id,
  NULL as reporting_manager_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL  -- Only users without profiles
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify profiles were created
SELECT 
  p.id,
  p.full_name,
  p.role,
  au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- Step 4: If you need to set specific roles manually, use this:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'USER_ID_HERE';

-- Step 5: If you need to assign teams, first check available teams:
-- SELECT id, name FROM teams;

-- Then update profiles:
-- UPDATE profiles 
-- SET team_id = 'TEAM_ID_HERE' 
-- WHERE id = 'USER_ID_HERE';

-- Test RLS Policy for Profiles
-- This helps verify that the "Users can view their own profile" policy works
-- 
-- NOTE: When running in SQL Editor, auth.uid() will be NULL (no user session)
-- This is expected. The policy works when queries are made from the application
-- with a valid user session.

-- Check if the policy exists and is correct
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
AND policyname = 'Users can view their own profile';

-- Expected result:
-- policyname: "Users can view their own profile"
-- cmd: "SELECT"
-- qual: "(auth.uid() = id)"
-- with_check: null

-- If the policy doesn't exist or is incorrect, run this:
-- DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
-- CREATE POLICY "Users can view their own profile"
--     ON profiles FOR SELECT
--     USING (auth.uid() = id);

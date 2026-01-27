# Profile Not Found - Quick Fix Guide

## 🔍 Problem
You're seeing "Profile not found. Please contact support." after successful login. This means:
- ✅ Authentication works (Supabase auth succeeded)
- ❌ Profile record is missing from the `profiles` table

## 🚨 Quick Fix Options

### Option 1: Run the Seed Script (Recommended)

If you haven't run the seed script yet, this will create all test users with profiles:

```bash
npm run seed
```

This creates:
- 1 admin user
- 2 managers
- 6 trainers
- All with proper profiles in the database

### Option 2: Create Profile Manually in Supabase

1. **Get the User ID:**
   - After logging in, check browser console
   - Look for user ID in the error message
   - Or go to Supabase Dashboard → Authentication → Users
   - Find the user by email (e.g., `manager1@test.com`)
   - Copy the User ID (UUID)

2. **Create Profile in SQL Editor:**
   - Go to Supabase Dashboard → SQL Editor
   - Run this SQL (replace `USER_ID_HERE` with the actual UUID):

```sql
-- Replace USER_ID_HERE with the actual user ID from auth.users
-- Replace 'manager' with the correct role: 'admin', 'manager', or 'trainer'
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES (
  'USER_ID_HERE',
  'Manager One',
  'manager',
  NULL,  -- Set to team ID if user belongs to a team
  NULL   -- Set to manager ID if user has a reporting manager
)
ON CONFLICT (id) DO NOTHING;
```

### Option 3: Auto-Create Profile on First Login

We can modify the code to automatically create a profile if it doesn't exist. See below.

## 🔧 Verify Profiles Exist

Run this in Supabase SQL Editor to check:

```sql
-- Check all profiles
SELECT id, full_name, role, email 
FROM profiles 
ORDER BY created_at DESC;

-- Check if a specific user has a profile
SELECT p.*, au.email 
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'manager1@test.com';
```

## 🔒 Check RLS Policies

If profiles exist but still can't be accessed, check RLS policies:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Ensure this policy exists (allows users to read their own profile):
-- Policy name: "Users can view their own profile"
-- Policy: SELECT ... WHERE auth.uid() = id
```

## 🛠️ Test Credentials (from seed script)

If you run `npm run seed`, these accounts will be created:

**Admin:**
- Email: `admin@test.com`
- Password: `admin123`

**Managers:**
- Email: `manager1@test.com`
- Password: `manager123`
- Email: `manager2@test.com`
- Password: `manager123`

**Trainers:**
- Email: `trainer1@test.com` through `trainer6@test.com`
- Password: `trainer123` (for all)

## 📝 Next Steps

1. **First, try running the seed script:**
   ```bash
   npm run seed
   ```

2. **If that doesn't work, check the console for the user ID** and create the profile manually using Option 2.

3. **If profiles exist but still can't access**, check RLS policies (Option 3).

---

**Need help?** Check the browser console for detailed error messages. The error will show:
- User ID that's trying to log in
- Specific error code (PGRST116 = not found, 42501 = permission denied)

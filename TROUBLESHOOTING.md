# Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Invalid API key" Error (401 Unauthorized)

**Symptoms:**
- Console shows: `POST .../auth/v1/token?grant_type=password 401 (Unauthorized)`
- Error message: "Invalid API key" or "Invalid API Key"
- Login fails with authentication error

**Cause:**
Your Supabase API key in the `.env` file is incorrect, missing, or outdated.

**Solution:**

1. **Check your `.env` file exists:**
   - Make sure you have a `.env` file in the project root (same folder as `package.json`)
   - If it doesn't exist, create it:
     ```powershell
     # Windows PowerShell
     copy .env.example .env
     ```

2. **Get your correct Supabase credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Settings** → **API**
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (a long string starting with `eyJ...`)

3. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - **Important:** No quotes around the values
   - **Important:** No spaces around the `=` sign
   - **Important:** Make sure the URL starts with `https://`

4. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

5. **Verify the fix:**
   - Check the browser console - you should no longer see "Invalid API key" errors
   - Try logging in again

---

### ⚠️ "useAuthContext must be used within an AuthProvider" Error

**Symptoms:**
- Red error in console: `useAuthContext must be used within an AuthProvider`
- App crashes or shows blank screen

**Cause:**
Usually a hot-reload issue during development, or the app structure got corrupted.

**Solution:**

1. **Hard refresh the browser:**
   - Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or clear browser cache

2. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Clear browser storage (if issue persists):**
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage and Session Storage
   - Refresh the page

---

### ⚠️ React Router Future Flag Warnings

**Symptoms:**
- Console warnings about `v7_startTransition` and `v7_relativeSplatPath`
- These are just warnings, not errors

**Status:** ✅ **FIXED** - These warnings have been resolved by adding future flags to the Router.

If you still see them:
1. Hard refresh your browser (`Ctrl + Shift + R`)
2. Restart your dev server

---

### ⚠️ "Multiple GoTrueClient instances detected" Warning

**Symptoms:**
- Console warning: "Multiple GoTrueClient instances detected in the same browser context"

**Cause:**
Multiple Supabase client instances being created (usually during hot-reload).

**Status:** ✅ **FIXED** - The Supabase client now uses a singleton pattern to prevent multiple instances.

If you still see this:
1. Hard refresh your browser
2. Restart your dev server
3. Clear browser cache

---

### 🔍 How to Verify Your .env File

1. **Check if `.env` exists:**
   ```powershell
   # Windows PowerShell
   Test-Path .env
   # Should return: True
   ```

2. **View your .env file (without exposing secrets):**
   ```powershell
   # Windows PowerShell - shows first 50 chars of each line
   Get-Content .env | ForEach-Object { if ($_.Length -gt 50) { $_.Substring(0,50) + "..." } else { $_ } }
   ```

3. **Verify format:**
   - Should have exactly 2 lines (or more if you have other env vars):
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```
   - No quotes around values
   - No spaces around `=`
   - URL should start with `https://`
   - Key should start with `eyJ`

---

### ❌ "Infinite recursion detected in policy" Error (42P17)

**Symptoms:**
- Console shows: `GET .../rest/v1/profiles?select=*&id=eq.xxx 500 (Internal Server Error)`
- Error message: `infinite recursion detected in policy for relation "profiles"`
- Error code: `42P17`
- Login works but profile cannot be fetched

**Cause:**
Row Level Security (RLS) policies on the `profiles` table are querying the same table to check permissions, creating an infinite loop.

**Solution:**

1. **Run the fix script in Supabase SQL Editor:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **SQL Editor**
   - Open the file `fix-rls-recursion.sql` from your project
   - Copy and paste the entire contents into the SQL Editor
   - Click **Run** (or press `Ctrl+Enter`)

2. **Verify the fix:**
   - Try logging in again
   - The error should be gone
   - Profile should load successfully

**What the fix does:**
- Creates `SECURITY DEFINER` functions that can read the `profiles` table without triggering RLS
- Updates all RLS policies to use these functions instead of querying `profiles` directly
- Breaks the infinite recursion loop

---

### ❌ Signup Fails with 400, 401, or 429 Error

**Symptoms:**
- Console shows: `POST .../auth/v1/signup 400/401/429` errors
- Error message: "Failed to create account" or "email rate limit exceeded"
- Signup form submission fails

**Causes:**
1. **429 Error:** Too many signup attempts (rate limit exceeded)
2. **401 Error:** Missing INSERT policy for profiles table
3. **400 Error:** Email confirmation required, email already exists, or password requirements

**Symptoms:**
- Console shows: `POST .../auth/v1/signup 400 (Bad Request)` or `401 (Unauthorized)`
- Error message: "Failed to create account" or "Failed to create user profile"
- Signup form submission fails

**Causes:**
1. Missing INSERT policy for profiles table (401 error)
2. Email confirmation required in Supabase settings (400 error)
3. Email already exists (400 error)
4. Password doesn't meet requirements (400 error)

**Solution:**

1. **Fix Rate Limit (for 429 error):**
   - **Wait 5-10 minutes** before trying again (Supabase rate limit resets)
   - **OR** use a different email address
   - **OR** delete existing signup attempts from Supabase Dashboard:
     - Go to Authentication → Users
     - Delete any incomplete/unconfirmed users with the same email
     - Wait a few minutes, then try again

2. **Fix RLS Policies (for 401 error):**
   - Run the `fix-rls-recursion.sql` script in Supabase SQL Editor
   - This script now includes a policy that allows users to insert their own profile during signup
   - Make sure you run the updated version that includes: `"Users can insert their own profile"`

2. **Disable Email Confirmation (for 400 error):**
   - Go to Supabase Dashboard → Authentication → Settings
   - Under "Email Auth", find "Confirm email"
   - Toggle it OFF (or set to "Auto Confirm")
   - This allows users to sign up without email verification

3. **Check Password Requirements:**
   - Supabase default: minimum 6 characters
   - Your app requires: minimum 6 characters (as per SignUp.tsx)
   - Make sure password meets both requirements

4. **Check if Email Already Exists:**
   - Try a different email address
   - Or delete the existing user from Supabase Dashboard → Authentication → Users

5. **Verify the Fix:**
   - Try signing up again
   - Check browser console for specific error messages
   - The improved error handling will show more specific error details

**Quick SQL Fix (if RLS policy is missing):**
```sql
-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

---

### ⚠️ React Joyride "Target not mounted" Warning

**Symptoms:**
- Console warnings: `Target not mounted` from `react-joyride`
- This is a non-critical warning from the onboarding tour component

**Status:** ✅ **Harmless** - This is just a warning, not an error. The onboarding tour will still work.

**If you want to fix it:**
- The warning appears when the tour tries to highlight an element that hasn't rendered yet
- This is usually a timing issue and doesn't affect functionality
- You can ignore this warning safely

---

### 📝 Still Having Issues?

1. **Check browser console** for specific error messages
2. **Check terminal** where `npm run dev` is running for build errors
3. **Verify Supabase project is active:**
   - Go to Supabase Dashboard
   - Make sure your project isn't paused
4. **Verify users exist in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Make sure test users are created (e.g., `manager1@test.com`)

---

## Quick Checklist

- [ ] `.env` file exists in project root
- [ ] `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Values in `.env` match Supabase Dashboard → Settings → API
- [ ] No quotes around values in `.env`
- [ ] No spaces around `=` in `.env`
- [ ] Dev server restarted after changing `.env`
- [ ] Browser cache cleared (hard refresh)
- [ ] Supabase project is active (not paused)
- [ ] Test users exist in Supabase Auth

# How to Bypass Rate Limit for Signup

## ✅ Good News!

Your INSERT policy is correctly set up! The only issue now is Supabase's rate limiting.

## 🚫 Current Issue: Rate Limit (429 Error)

Supabase has rate limits to prevent abuse. You've hit the limit for signup attempts.

## 🎯 Solution: Create User Directly in Supabase Dashboard

**This bypasses the rate limit completely!**

### Step-by-Step:

1. **Go to Supabase Dashboard:**
   - Navigate to: [Supabase Dashboard](https://app.supabase.com)
   - Select your project

2. **Create Auth User:**
   - Go to **Authentication** → **Users**
   - Click **"Add User"** → **"Create new user"**
   - Enter:
     - **Email:** `admin@test.com` (or any email you want)
     - **Password:** `Admin@123456` (or your preferred password)
     - ✅ **Check "Auto Confirm User"** (important!)
   - Click **"Create User"**
   - **Copy the User ID (UUID)** - you'll need it in the next step

3. **Create Profile:**
   - Go to **SQL Editor** in Supabase
   - Run this query (replace `YOUR-USER-ID-HERE` with the UUID you copied):
   ```sql
   INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
   VALUES (
       'YOUR-USER-ID-HERE',  -- Replace with actual UUID
       'Admin User',          -- Full name
       'admin',              -- Role
       NULL,                  -- Team ID (NULL for admins)
       NULL                   -- Reporting Manager (NULL for admins)
   )
   ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       role = EXCLUDED.role;
   ```

4. **Login:**
   - Go to your app: `http://localhost:5174`
   - Use the credentials you just created
   - You should be able to login successfully!

---

## ⏰ Alternative: Wait for Rate Limit to Reset

If you prefer to use the signup form:

1. **Wait 10-15 minutes** for the rate limit to reset
2. **Clean up existing attempts:**
   - Go to Supabase Dashboard → Authentication → Users
   - Delete any incomplete/unconfirmed users
3. **Try signing up again**

---

## 🔍 Verify Rate Limit Status

You can check if you're still rate-limited by:
- Waiting 10-15 minutes
- Trying the signup form again
- If you still get 429, wait a bit longer

---

## 💡 Pro Tip

For testing/development, it's often faster to create users directly in the Supabase Dashboard rather than using the signup form. This:
- ✅ Bypasses rate limits
- ✅ Gives you full control
- ✅ Is faster for creating multiple test users
- ✅ Works immediately

---

## 📝 Quick Reference

**Recommended Admin Credentials:**
- Email: `admin@test.com`
- Password: `Admin@123456`
- Role: `admin`

**After creating, you can login immediately!**

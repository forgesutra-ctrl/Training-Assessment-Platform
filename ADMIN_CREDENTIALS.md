# Admin User Credentials Guide

## ⚠️ Important Note

**There are NO pre-configured admin users in the test data.** The seed script (`seed-test-data.sql`) only creates managers and trainers. You need to create an admin user manually.

**Note:** There is no "super admin" role in this system - only `admin`, `manager`, and `trainer` roles. The `admin` role has full access to all features.

---

## 🚀 Quick Setup: Create Admin User

### Method 1: Using Supabase Dashboard (Recommended)

1. **Create Auth User:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Navigate to **Authentication** → **Users**
   - Click **"Add User"** → **"Create new user"**
   - Enter:
     - **Email:** `admin@test.com` (or your preferred email)
     - **Password:** `Admin@123456` (or your preferred password)
     - ✅ Check **"Auto Confirm User"**
   - Click **"Create User"**
   - **Copy the User ID (UUID)** - you'll need it in the next step

2. **Create Profile:**
   - Go to **SQL Editor** in Supabase
   - Open `create-admin-user.sql` from this project
   - Replace `YOUR-ADMIN-USER-ID-HERE` with the UUID you copied
   - Run the SQL script

3. **Login:**
   - Go to your app: `http://localhost:5173`
   - Use credentials:
     - **Email:** `admin@test.com`
     - **Password:** `Admin@123456`

---

### Method 2: Using Sign Up Page

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Navigate to signup:**
   - Go to: `http://localhost:5173/signup`

3. **Fill the form:**
   - **Full Name:** Admin User
   - **Email:** admin@test.com
   - **Password:** Admin@123456
   - **Confirm Password:** Admin@123456
   - **Role:** Select **"Admin"**

4. **Submit:**
   - Click "Sign Up"
   - You'll be automatically logged in and redirected to the Admin Dashboard

---

## 📋 Recommended Test Admin Credentials

For testing purposes, you can use these credentials:

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `Admin@123456` | admin |

**Security Note:** These are test credentials. Change them in production!

---

## 🔍 Verify Admin User

After creating, verify your admin user exists:

1. **In Supabase SQL Editor, run:**
   ```sql
   SELECT 
       p.id,
       p.full_name,
       p.role,
       u.email
   FROM profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE p.role = 'admin';
   ```

2. **You should see your admin user listed**

---

## 🎯 Admin User Capabilities

Once logged in as admin, you can:

- ✅ View all users (managers, trainers, admins)
- ✅ Create, edit, and delete users
- ✅ Bulk upload users via CSV
- ✅ View all assessments across all teams
- ✅ Access comprehensive analytics and reports
- ✅ Manage teams
- ✅ View audit logs
- ✅ Access executive dashboard
- ✅ Export data

---

## 🔐 Current Test User Credentials

Here are all the test users that come with the seed data:

### Managers:
- **Email:** `manager1@test.com` | **Password:** `Test@123456` | **Name:** Sarah Johnson
- **Email:** `manager2@test.com` | **Password:** `Test@123456` | **Name:** John Smith

### Trainers:
- **Email:** `trainer1@test.com` | **Password:** `Test@123456` | **Name:** Alice Williams
- **Email:** `trainer2@test.com` | **Password:** `Test@123456` | **Name:** Bob Davis
- **Email:** `trainer3@test.com` | **Password:** `Test@123456` | **Name:** Carol Brown
- **Email:** `trainer4@test.com` | **Password:** `Test@123456` | **Name:** David Miller

### Admin:
- **Not included in seed data** - Create manually using instructions above

---

## 🆘 Troubleshooting

### "Profile not found" after creating admin user

**Solution:**
1. Make sure you created the profile entry in the `profiles` table
2. Verify the profile `id` matches the auth user `id`
3. Check that the role is set to `'admin'` (lowercase)

### "Permission denied" when accessing admin features

**Solution:**
1. Verify your profile has `role = 'admin'` in the database
2. Sign out and sign back in to refresh your session
3. Check browser console for specific error messages

### Can't access admin dashboard

**Solution:**
1. Make sure you selected "Admin" role when signing up
2. Or verify your profile in database has `role = 'admin'`
3. Clear browser cache and try again

---

## 📝 Quick Reference

**Files to check:**
- `create-admin-user.sql` - SQL script to create admin profile
- `seed-test-data.sql` - Test data (managers and trainers only)
- `get-user-ids.sql` - Helper to get user IDs

**SQL to check admin users:**
```sql
SELECT id, full_name, role, email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

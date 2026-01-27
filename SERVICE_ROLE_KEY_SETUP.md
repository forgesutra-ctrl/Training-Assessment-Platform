# Service Role Key Setup Guide

## ⚠️ Important Security Note

**The service role key should NEVER be exposed to the frontend in production!** It has full admin access to your Supabase project. This guide is for development/testing only.

## 🔍 Current Issues

You're seeing **403 Forbidden** errors because admin operations require the service role key:

- `supabase.auth.admin.listUsers()` - List all users
- `supabase.auth.admin.createUser()` - Create users
- `supabase.auth.admin.updateUserById()` - Update users
- `supabase.auth.admin.deleteUser()` - Delete users

## 🚀 Quick Fix (Development Only)

### Step 1: Get Your Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Find **"service_role"** key (NOT the anon key!)
5. Copy it (starts with `eyJ...`)

### Step 2: Add to .env File

Add this line to your `.env` file:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ WARNING:** This exposes admin access to your frontend. Only use this in development!

### Step 3: Update Supabase Client (Optional)

If you want to use service role key conditionally, you can create a separate client:

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null
```

Then use `supabaseAdmin` for admin operations.

## 🏗️ Production Solution (Recommended)

For production, you should:

1. **Create Backend API Endpoints** (Node.js, Python, etc.)
   - These endpoints use the service role key server-side
   - Frontend calls these endpoints instead of direct admin API

2. **Use Supabase Edge Functions**
   - Create Edge Functions that use service role key
   - Call these functions from your frontend

3. **Use Database Functions**
   - Create SECURITY DEFINER functions in PostgreSQL
   - These can perform admin operations safely

## 📝 Current Workarounds

The code has been updated to:
- ✅ Handle 403 errors gracefully
- ✅ Show helpful error messages
- ✅ Continue working even if admin API fails (with limited functionality)

**Features that require service role key:**
- User management (create/update/delete users)
- Bulk user operations
- Fetching user emails in admin dashboard

**Features that work without service role key:**
- User login/signup
- Profile management
- Assessments
- Most dashboard features

## 🔒 Security Best Practices

1. **Never commit `.env` file** to Git (already in `.gitignore`)
2. **Never expose service role key** in client-side code in production
3. **Use environment variables** for all sensitive keys
4. **Rotate keys** if accidentally exposed
5. **Use backend APIs** for admin operations in production

## 🆘 Troubleshooting

### "403 Forbidden" errors

**Cause:** Service role key not configured or incorrect.

**Solution:**
1. Check `.env` file has `VITE_SUPABASE_SERVICE_ROLE_KEY`
2. Verify the key is correct (from Supabase Dashboard → Settings → API)
3. Restart dev server after adding to `.env`

### "Cannot fetch user emails"

**Cause:** Admin API requires service role key.

**Solution:**
- Add service role key to `.env` (development only)
- Or implement backend API for production

---

**For now, the app will work but with limited admin functionality. User creation via signup still works!**

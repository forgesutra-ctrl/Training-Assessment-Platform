# Vercel Environment Variables Setup - CRITICAL

## ⚠️ Your app is stuck loading because environment variables are missing!

The 404 error and infinite loading spinner indicate that **Supabase environment variables are not configured in Vercel**.

## 🚨 Quick Fix (5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `Training-Assessment-Platform` project
3. Click **Settings** → **Environment Variables**
4. Add these **TWO** variables:

#### Variable 1:
- **Key:** `VITE_SUPABASE_URL`
- **Value:** Your Supabase project URL (from Step 1)
- **Environment:** ✅ Select **ALL** (Production, Preview, Development)
- Click **Save**

#### Variable 2:
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anon key (from Step 1)
- **Environment:** ✅ Select **ALL** (Production, Preview, Development)
- Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait for deployment to complete (1-2 minutes)

### Step 4: Test

1. Visit your Vercel URL
2. The login page should now load properly
3. You should be able to log in with your test credentials

---

## ✅ Verification Checklist

After adding environment variables, verify:

- [ ] Both variables are added in Vercel
- [ ] Both variables are enabled for **ALL environments**
- [ ] Project has been **redeployed** after adding variables
- [ ] Login page loads without infinite spinner
- [ ] No 404 errors in browser console
- [ ] Can successfully log in with test credentials

---

## 🔍 How to Check if Variables Are Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see:
   - `VITE_SUPABASE_URL` ✅
   - `VITE_SUPABASE_ANON_KEY` ✅
3. Both should have checkmarks for Production, Preview, and Development

---

## 🐛 Still Not Working?

### Check Browser Console

1. Open your deployed site
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for error messages

### Common Issues:

**"Supabase credentials are missing"**
- → Environment variables not set in Vercel
- → Fix: Add them (see Step 2 above)

**"Invalid API key"**
- → Wrong key copied
- → Fix: Double-check the key from Supabase Dashboard

**"Network error" or "Failed to fetch"**
- → Supabase URL is incorrect
- → Fix: Verify the URL in Supabase Dashboard → Settings → API

**Still seeing 404 errors**
- → Clear browser cache (Ctrl+Shift+Delete)
- → Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- → Try incognito/private window

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ **YES** | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ **YES** | Your Supabase anon/public key |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | ❌ Optional | Only needed for seed scripts |
| `VITE_CLAUDE_API_KEY` | ❌ Optional | Only for AI features |
| `VITE_OPENAI_API_KEY` | ❌ Optional | Only for AI features |

---

## 🎯 Expected Behavior After Fix

✅ Login page loads in < 2 seconds  
✅ No 404 errors in console  
✅ Login form is visible  
✅ Can successfully authenticate  
✅ Redirects to correct dashboard based on role  

---

**Once you've added the environment variables and redeployed, your app should work perfectly!** 🚀

# Complete Setup Guide - Training Assessment Platform

**One comprehensive guide to set up everything from scratch.**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Project Setup](#step-1-project-setup)
3. [Step 2: Supabase Database Setup](#step-2-supabase-database-setup)
4. [Step 3: Environment Configuration](#step-3-environment-configuration)
5. [Step 4: Install Dependencies](#step-4-install-dependencies)
6. [Step 5: Database Schema (SQL Scripts)](#step-5-database-schema-sql-scripts)
7. [Step 6: Test Data (Optional)](#step-6-test-data-optional)
8. [Step 7: Run the Application](#step-7-run-the-application)
9. [Step 8: Verify Everything Works](#step-8-verify-everything-works)
10. [Step 9: Optional Features Setup](#step-9-optional-features-setup)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ **Git** (optional, for version control)
- ✅ **Supabase Account** - [Sign up](https://supabase.com)
- ✅ **Code Editor** (VS Code recommended)

---

## Step 1: Project Setup

### 1.1 Navigate to Project Directory

```bash
cd "C:\Users\KB\OneDrive\Documents\TAPS"
```

### 1.2 Verify Project Structure

Ensure you have these folders:
- `src/` - Source code
- `public/` - Static files
- `supabase/` - Database scripts (if exists)

### 1.3 Check Existing Files

You should already have:
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.js`
- `.gitignore`

---

## Step 2: Supabase Database Setup

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Project Name:** Training Assessment Platform (or your choice)
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### 2.2 Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (keep this secret!)

---

## Step 3: Environment Configuration

### 3.1 Create `.env` File

In the project root (`C:\Users\KB\OneDrive\Documents\TAPS`), create a file named `.env`

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**Or manually create** a file named `.env` in the project root.

### 3.2 Add Environment Variables

Open `.env` and add:

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for seed scripts only)
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# OPTIONAL: AI Features
# ============================================
# Set to true to enable AI features
VITE_AI_ENABLED=false

# AI Provider: 'claude' or 'openai'
VITE_AI_PROVIDER=claude

# Claude API Key (if using Claude)
# Get from: https://console.anthropic.com
# VITE_CLAUDE_API_KEY=sk-ant-your-key-here

# OpenAI API Key (if using OpenAI)
# Get from: https://platform.openai.com
# VITE_OPENAI_API_KEY=sk-your-key-here

# ============================================
# OPTIONAL: Gamification Features
# ============================================
# Set to true to enable gamification
VITE_GAMIFICATION_ENABLED=true
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual Supabase URL
- `your-anon-key-here` with your actual anon key
- `your-service-role-key-here` with your service role key (if using seed scripts)

### 3.3 Verify `.env` is in `.gitignore`

Check that `.env` is listed in `.gitignore` (it should be by default).

---

## Step 4: Install Dependencies

### 4.1 Install npm Packages

Open terminal in project directory and run:

```bash
npm install
```

This installs all dependencies from `package.json`.

**Expected output:** Should complete without errors.

**If you see errors:**
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

---

## Step 5: Database Schema (SQL Scripts)

**⚠️ IMPORTANT:** Run these SQL scripts **IN ORDER** in Supabase SQL Editor.

### 5.1 Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### 5.2 Run Main Database Schema

**Script 1: Main Schema** (`supabase-schema.sql`)

1. Open `supabase-schema.sql` in your project
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for success message: ✅ "Success. No rows returned"

**This creates:**
- `teams` table
- `profiles` table
- `assessments` table
- Row Level Security (RLS) policies
- Database functions
- Indexes

### 5.3 Run Audit Log Schema

**Script 2: Audit Log** (`supabase-audit-log.sql`)

1. Open `supabase-audit-log.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor (new query)
4. Click **"Run"**
5. Verify success

**This creates:**
- `audit_logs` table
- Audit logging function
- RLS policies

### 5.4 Run Constraints & Validation

**Script 3: Constraints** (`supabase-constraints-validation.sql`)

1. Open `supabase-constraints-validation.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor (new query)
4. Click **"Run"**
5. Verify success

**This adds:**
- Rating constraints (1-5)
- Comment length constraints
- Duplicate assessment prevention
- Direct report assessment prevention

### 5.5 Run Gamification Schema (Optional)

**Script 4: Gamification** (`supabase-gamification.sql`)

**Only if you enabled gamification** (`VITE_GAMIFICATION_ENABLED=true`)

1. Open `supabase-gamification.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor (new query)
4. Click **"Run"**
5. Verify success

**This creates:**
- `badges` table
- `user_badges` table
- `goals` table
- `user_xp` table
- `xp_history` table
- `streaks` table
- `leaderboard_preferences` table
- `dashboard_widgets` table
- `kudos` table
- XP calculation functions
- Badge awarding triggers

---

## Step 6: Test Data (Optional)

Choose **ONE** method to create test data:

### Option A: Automated Seed Script (Recommended)

**Prerequisites:**
- `VITE_SUPABASE_SERVICE_ROLE_KEY` set in `.env`
- `tsx` installed (should be in devDependencies)

**Steps:**

1. Run the seed script:
```bash
npm run seed
```

2. This creates:
   - 2 teams (Sales Team, Marketing Team)
   - 2 managers
   - 4 trainers
   - 3-4 sample assessments

3. Check output for success messages

**If errors occur:**
- Verify service role key is correct
- Check Supabase project is active
- Review error messages in terminal

### Option B: Manual SQL Script

1. Open `seed-test-data.sql`
2. **IMPORTANT:** First create auth users manually:
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Click **"Add user"** → **"Create new user"**
   - Create users with these emails:
     - `manager1@test.com`
     - `manager2@test.com`
     - `trainer1@test.com`
     - `trainer2@test.com`
     - `trainer3@test.com`
     - `trainer4@test.com`
   - Set password: `Test@123456` for all

3. Get user IDs:
   - Run `get-user-ids.sql` in SQL Editor
   - Copy the UUIDs returned

4. Update `seed-test-data.sql`:
   - Replace placeholder UUIDs with actual user IDs
   - Update team IDs if needed

5. Run `seed-test-data.sql` in SQL Editor

### Option C: Create First Admin User via Sign Up

1. Start the application (see Step 7)
2. Go to `/signup`
3. Create an admin user
4. Log in and create other users via Admin Dashboard

---

## Step 7: Run the Application

### 7.1 Start Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7.2 Open in Browser

1. Open browser
2. Go to: `http://localhost:5173`
3. You should see the login page

**If you see errors:**
- Check browser console (F12)
- Verify `.env` file exists and has correct values
- Check terminal for error messages

---

## Step 8: Verify Everything Works

### 8.1 Test Authentication

1. **If you have test data:**
   - Email: `manager1@test.com`
   - Password: `Test@123456`
   - Should redirect to Manager Dashboard

2. **If no test data:**
   - Go to `/signup`
   - Create an admin user
   - Log in

### 8.2 Test Manager Dashboard

1. Log in as manager
2. Should see:
   - Welcome header
   - Stats cards
   - "New Assessment" button
   - Recent assessments table

### 8.3 Test Assessment Creation

1. Click **"New Assessment"**
2. Select a trainer (cross-team only)
3. Fill in ratings (1-5 stars)
4. Add comments (minimum 20 characters)
5. Submit
6. Should see success message and redirect

### 8.4 Test Trainer Dashboard

1. Log in as trainer
2. Should see:
   - Performance overview cards
   - Parameter breakdown
   - Performance trend chart
   - Assessment history
   - **If gamification enabled:** Badges, Goals, Level, Streaks, Leaderboard tabs

### 8.5 Test Admin Dashboard

1. Log in as admin
2. Should see:
   - Top metrics
   - Navigation tabs
   - Overview, Trainer Performance, Manager Activity, etc.
   - **If AI enabled:** Smart Search in Overview

### 8.6 Test User Management (Admin)

1. Go to Admin Dashboard → **User Management** tab
2. Click **"Add New User"**
3. Fill in form
4. Submit
5. User should appear in table

---

## Step 9: Optional Features Setup

### 9.1 Enable AI Features

**Prerequisites:**
- Claude API key OR OpenAI API key

**Steps:**

1. Get API key:
   - **Claude:** [console.anthropic.com](https://console.anthropic.com)
   - **OpenAI:** [platform.openai.com](https://platform.openai.com)

2. Update `.env`:
```env
VITE_AI_ENABLED=true
VITE_AI_PROVIDER=claude
VITE_CLAUDE_API_KEY=sk-ant-your-key-here
```

3. Restart dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

4. Test AI features:
   - Create assessment → Click "AI Assistant" button
   - View trainer dashboard → Check "AI Insights" section
   - Admin dashboard → Use Smart Search

### 9.2 Enable Gamification

**Already enabled by default** if `VITE_GAMIFICATION_ENABLED=true`

**Verify:**
1. Log in as trainer
2. Check for tabs: Badges, Goals, Level, Streaks, Leaderboard
3. Receive an assessment → Should earn XP and badges

**If not working:**
- Verify `supabase-gamification.sql` was run
- Check `VITE_GAMIFICATION_ENABLED=true` in `.env`
- Restart dev server

### 9.3 Disable Optional Features

To disable:
```env
VITE_AI_ENABLED=false
VITE_GAMIFICATION_ENABLED=false
```

Restart dev server after changes.

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" or Network Errors

**Causes:**
- Wrong Supabase URL in `.env`
- Wrong anon key in `.env`
- Supabase project paused (free tier)

**Solutions:**
- Verify `.env` values match Supabase Dashboard
- Check Supabase project is active
- Restart dev server

#### 2. "Row Level Security" Errors

**Causes:**
- RLS policies not created
- User not authenticated

**Solutions:**
- Verify `supabase-schema.sql` ran successfully
- Check RLS is enabled on tables
- Ensure user is logged in

#### 3. "Table does not exist" Errors

**Causes:**
- SQL scripts not run
- Scripts run in wrong order

**Solutions:**
- Run SQL scripts in order (Step 5)
- Check Supabase Tables view for created tables
- Re-run missing scripts

#### 4. Authentication Not Working

**Causes:**
- Wrong Supabase credentials
- Auth not enabled in Supabase

**Solutions:**
- Verify `.env` credentials
- Check Supabase → Authentication → Settings
- Ensure email auth is enabled

#### 5. Badges/XP Not Working

**Causes:**
- Gamification SQL not run
- Feature disabled in `.env`

**Solutions:**
- Run `supabase-gamification.sql`
- Set `VITE_GAMIFICATION_ENABLED=true`
- Restart dev server

#### 6. AI Features Not Working

**Causes:**
- API key missing or wrong
- Feature disabled
- API quota exceeded

**Solutions:**
- Verify API key in `.env`
- Set `VITE_AI_ENABLED=true`
- Check API provider dashboard for quota
- Restart dev server

#### 7. Build Errors

**Causes:**
- Missing dependencies
- TypeScript errors
- Outdated packages

**Solutions:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Fix linting
npm run lint:fix
```

#### 8. Port Already in Use

**Causes:**
- Another process using port 5173

**Solutions:**
```bash
# Use different port
npm run dev -- --port 3000
```

---

## Quick Reference Checklist

Use this to verify your setup:

### Database ✅
- [ ] Supabase project created
- [ ] `supabase-schema.sql` run
- [ ] `supabase-audit-log.sql` run
- [ ] `supabase-constraints-validation.sql` run
- [ ] `supabase-gamification.sql` run (if enabled)
- [ ] Test data created (optional)

### Configuration ✅
- [ ] `.env` file created
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `VITE_GAMIFICATION_ENABLED` set (optional)
- [ ] `VITE_AI_ENABLED` set (optional)
- [ ] API keys set (if using AI)

### Application ✅
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Login page loads
- [ ] Can create account
- [ ] Can log in
- [ ] Dashboards load correctly

### Features ✅
- [ ] Manager can create assessments
- [ ] Trainer can view performance
- [ ] Admin can manage users
- [ ] Badges work (if enabled)
- [ ] XP/Levels work (if enabled)
- [ ] AI features work (if enabled)

---

## Next Steps

After setup is complete:

1. **Create Production Build:**
   ```bash
   npm run build
   ```

2. **Deploy to Production:**
   - See `DEPLOYMENT.md` for detailed instructions
   - Options: Vercel, Netlify, or custom server

3. **Set Up Production Database:**
   - Create new Supabase project for production
   - Run all SQL scripts
   - Update production environment variables

4. **Configure Email (Optional):**
   - Set up Supabase email templates
   - Or use external email service
   - See `EMAIL_TEMPLATES.md`

5. **Monitor & Maintain:**
   - Set up error monitoring
   - Configure backups
   - Review audit logs
   - Monitor performance

---

## Support & Documentation

**Documentation Files:**
- `README.md` - Project overview
- `INSTALLATION.md` - Installation details
- `QUICK_START.md` - Quick start guide
- `AUTHENTICATION_GUIDE.md` - Auth system
- `ASSESSMENT_SYSTEM_GUIDE.md` - Assessment features
- `ADMIN_DASHBOARD_GUIDE.md` - Admin features
- `USER_MANAGEMENT_GUIDE.md` - User management
- `DEPLOYMENT.md` - Deployment guide
- `AI_SETUP_GUIDE.md` - AI features
- `GAMIFICATION_GUIDE.md` - Gamification features
- `USER_GUIDE.md` - End-user guide

**SQL Scripts:**
- `supabase-schema.sql` - Main schema
- `supabase-audit-log.sql` - Audit logging
- `supabase-constraints-validation.sql` - Constraints
- `supabase-gamification.sql` - Gamification
- `seed-test-data.sql` - Test data (manual)

**Scripts:**
- `src/scripts/seedData.ts` - Automated seed script

---

## Summary

**What to Run (SQL):**
1. ✅ `supabase-schema.sql` (REQUIRED)
2. ✅ `supabase-audit-log.sql` (REQUIRED)
3. ✅ `supabase-constraints-validation.sql` (REQUIRED)
4. ✅ `supabase-gamification.sql` (OPTIONAL - if gamification enabled)

**What to Configure:**
1. ✅ `.env` file with Supabase credentials
2. ✅ Optional: AI API keys
3. ✅ Optional: Gamification enabled

**What to Install:**
1. ✅ `npm install` (dependencies)

**What to Run:**
1. ✅ `npm run dev` (development server)
2. ✅ `npm run seed` (optional - test data)

**What to Verify:**
1. ✅ Login works
2. ✅ Dashboards load
3. ✅ Features function correctly

---

**You're all set! 🎉**

If you encounter any issues, refer to the Troubleshooting section or check the specific feature guides.

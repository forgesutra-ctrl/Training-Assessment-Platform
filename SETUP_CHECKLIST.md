# Setup Checklist

Quick checklist to verify your setup is complete.

## ✅ Pre-Setup

- [ ] Node.js installed (v18+)
- [ ] npm installed
- [ ] Supabase account created
- [ ] Code editor ready

## ✅ Step 1: Project Files

- [ ] Project folder exists
- [ ] `package.json` exists
- [ ] `vite.config.ts` exists
- [ ] `tsconfig.json` exists
- [ ] `tailwind.config.js` exists

## ✅ Step 2: Supabase

- [ ] Supabase project created
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied (for seed scripts)

## ✅ Step 3: Environment

- [ ] `.env` file created
- [ ] `VITE_SUPABASE_URL` added
- [ ] `VITE_SUPABASE_ANON_KEY` added
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` added (optional)
- [ ] `VITE_GAMIFICATION_ENABLED=true` (optional)
- [ ] `VITE_AI_ENABLED=false` (optional, set to true if using AI)
- [ ] `.env` in `.gitignore`

## ✅ Step 4: Dependencies

- [ ] Ran `npm install`
- [ ] No errors during installation
- [ ] `node_modules` folder exists

## ✅ Step 5: Database Schema (SQL)

Run these in Supabase SQL Editor **IN ORDER**:

- [ ] **Script 1:** `supabase-schema.sql` - Main schema
  - Creates: teams, profiles, assessments tables
  - Creates: RLS policies
  - Creates: Functions and triggers
  
- [ ] **Script 2:** `supabase-audit-log.sql` - Audit logging
  - Creates: audit_logs table
  - Creates: Audit function
  
- [ ] **Script 3:** `supabase-constraints-validation.sql` - Constraints
  - Adds: Rating constraints
  - Adds: Comment length constraints
  - Adds: Duplicate prevention
  
- [ ] **Script 4:** `supabase-gamification.sql` - Gamification (OPTIONAL)
  - Only if `VITE_GAMIFICATION_ENABLED=true`
  - Creates: badges, goals, XP, streaks tables

## ✅ Step 6: Test Data

Choose ONE method:

**Option A: Automated (Recommended)**
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` in `.env`
- [ ] Ran `npm run seed`
- [ ] Success message received
- [ ] Users created in Supabase Auth

**Option B: Manual SQL**
- [ ] Created auth users manually (6 users)
- [ ] Ran `get-user-ids.sql` to get UUIDs
- [ ] Updated `seed-test-data.sql` with UUIDs
- [ ] Ran `seed-test-data.sql` in SQL Editor

**Option C: Via Application**
- [ ] Started application
- [ ] Created admin user via `/signup`
- [ ] Created other users via Admin Dashboard

## ✅ Step 7: Application

- [ ] Ran `npm run dev`
- [ ] Server started successfully
- [ ] No errors in terminal
- [ ] Browser opens to `http://localhost:5173`
- [ ] Login page displays

## ✅ Step 8: Verification

### Authentication
- [ ] Can access `/login` page
- [ ] Can access `/signup` page
- [ ] Can create account
- [ ] Can log in
- [ ] Can log out

### Manager Dashboard
- [ ] Manager dashboard loads
- [ ] Stats cards display
- [ ] "New Assessment" button works
- [ ] Recent assessments table shows data
- [ ] Can navigate to assessment form

### Assessment Form
- [ ] Trainer dropdown shows eligible trainers
- [ ] Can select trainer
- [ ] Can set assessment date
- [ ] Can rate all 6 parameters
- [ ] Can add comments
- [ ] Form validation works
- [ ] Can submit assessment
- [ ] Success message appears

### Trainer Dashboard
- [ ] Trainer dashboard loads
- [ ] Performance cards display
- [ ] Parameter breakdown shows
- [ ] Trend chart displays (if data exists)
- [ ] Assessment history table shows
- [ ] Can view assessment feedback
- [ ] **If gamification enabled:**
  - [ ] Badges tab visible
  - [ ] Goals tab visible
  - [ ] Level tab visible
  - [ ] Streaks tab visible
  - [ ] Leaderboard tab visible

### Admin Dashboard
- [ ] Admin dashboard loads
- [ ] Top metrics display
- [ ] Navigation tabs work
- [ ] Overview tab shows data
- [ ] Trainer Performance tab works
- [ ] Manager Activity tab works
- [ ] Time Analysis tab works
- [ ] User Management tab works
- [ ] Audit Log tab works
- [ ] **If AI enabled:**
  - [ ] Smart Search visible
  - [ ] Predictive Analytics tab works
  - [ ] Trend Alerts tab works

### User Management (Admin)
- [ ] Can view users table
- [ ] Can add new user
- [ ] Can edit user
- [ ] Can deactivate user
- [ ] Can bulk upload (if implemented)
- [ ] Can view user details

## ✅ Step 9: Optional Features

### AI Features (Optional)
- [ ] Claude or OpenAI API key obtained
- [ ] `VITE_AI_ENABLED=true` in `.env`
- [ ] API key added to `.env`
- [ ] Dev server restarted
- [ ] AI Assistant button appears in assessment form
- [ ] Performance Insights show AI content
- [ ] Smart Search works

### Gamification (Optional)
- [ ] `VITE_GAMIFICATION_ENABLED=true` in `.env`
- [ ] `supabase-gamification.sql` run
- [ ] Dev server restarted
- [ ] Badges tab visible
- [ ] Can view badges
- [ ] XP/Level system works
- [ ] Goals can be created
- [ ] Streaks track correctly
- [ ] Leaderboard works (after opt-in)

## ✅ Final Checks

- [ ] No console errors in browser
- [ ] No errors in terminal
- [ ] All features work as expected
- [ ] Data persists after refresh
- [ ] Can log in/out multiple times
- [ ] All roles work correctly

## 🎉 Setup Complete!

If all items are checked, your platform is ready to use!

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run seed script (test data)
npm run seed

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Need Help?

- Check `COMPLETE_SETUP_GUIDE.md` for detailed instructions
- Review `TROUBLESHOOTING.md` (if exists) for common issues
- Check browser console (F12) for errors
- Check terminal for error messages
- Verify all SQL scripts ran successfully
- Verify `.env` file has correct values

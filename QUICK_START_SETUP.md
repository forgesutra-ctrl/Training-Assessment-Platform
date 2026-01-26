# Quick Start Setup - Training Assessment Platform

**Fastest way to get everything running.**

---

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` File
Create `.env` in project root with:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_GAMIFICATION_ENABLED=true
```

### 3. Run SQL Scripts (In Supabase SQL Editor)

**Run these IN ORDER:**

1. `supabase-schema.sql` ✅
2. `supabase-audit-log.sql` ✅
3. `supabase-constraints-validation.sql` ✅
4. `supabase-gamification.sql` ✅ (if gamification enabled)

### 4. Create Test Data (Optional)
```bash
npm run seed
```

### 5. Start Application
```bash
npm run dev
```

### 6. Open Browser
Go to: `http://localhost:5173`

**Login with test data:**
- Email: `manager1@test.com`
- Password: `Test@123456`

---

## 📋 What Each SQL Script Does

| Script | What It Creates | Required? |
|--------|----------------|-----------|
| `supabase-schema.sql` | Main tables (teams, profiles, assessments), RLS, functions | ✅ YES |
| `supabase-audit-log.sql` | Audit logging system | ✅ YES |
| `supabase-constraints-validation.sql` | Data validation rules | ✅ YES |
| `supabase-gamification.sql` | Badges, XP, goals, streaks | ⚠️ OPTIONAL |

---

## 🔧 Environment Variables

**Required:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Optional:**
- `VITE_SUPABASE_SERVICE_ROLE_KEY` (for seed script)
- `VITE_GAMIFICATION_ENABLED=true` (enable gamification)
- `VITE_AI_ENABLED=true` (enable AI features)
- `VITE_CLAUDE_API_KEY` (if using AI)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Can access login page
- [ ] Can create account
- [ ] Can log in
- [ ] Manager dashboard loads
- [ ] Can create assessment
- [ ] Trainer dashboard loads
- [ ] Admin dashboard loads

---

## 🆘 Quick Troubleshooting

**"Failed to fetch" error:**
→ Check `.env` file has correct Supabase URL and keys

**"Table does not exist" error:**
→ Run SQL scripts in Supabase SQL Editor

**"Row Level Security" error:**
→ Verify `supabase-schema.sql` ran successfully

**Badges/XP not working:**
→ Run `supabase-gamification.sql` and set `VITE_GAMIFICATION_ENABLED=true`

---

## 📚 Full Documentation

For detailed instructions, see:
- **`COMPLETE_SETUP_GUIDE.md`** - Complete step-by-step guide
- **`SETUP_CHECKLIST.md`** - Detailed checklist

---

**That's it! You're ready to go! 🎉**

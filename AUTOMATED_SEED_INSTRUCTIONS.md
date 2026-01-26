# Automated Seed Data Script - Instructions

I've created an **automated TypeScript script** that will create all test data for you automatically! No manual SQL needed.

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Service Role Key

1. Go to Supabase Dashboard
2. Click **Settings** → **API**
3. Find **service_role** key (NOT the anon key!)
4. Copy it

### Step 2: Add to .env File

Add this line to your `.env` file:

```
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important:** The service_role key has admin access. Keep it secret and never commit it to Git!

### Step 3: Run the Script

Open your terminal and run:

```bash
npm install
npm run seed
```

That's it! The script will automatically:
- ✅ Create 2 teams
- ✅ Create 6 auth users (2 managers, 4 trainers)
- ✅ Create 6 profiles
- ✅ Create 4 sample assessments

## 📋 What Gets Created

### Teams
- Sales Team
- Marketing Team

### Users (all with password: `Test@123456`)
- **Managers:**
  - manager1@test.com (Sarah Johnson)
  - manager2@test.com (John Smith)

- **Trainers:**
  - trainer1@test.com (Alice Williams) - Reports to Sarah
  - trainer2@test.com (Bob Davis) - Reports to Sarah
  - trainer3@test.com (Carol Brown) - Reports to John
  - trainer4@test.com (David Miller) - Reports to John

### Assessments
- Sarah assessing Carol (cross-team)
- Sarah assessing David (cross-team)
- John assessing Alice (cross-team)
- John assessing Bob (cross-team)

## 🎯 After Running

You can immediately log in with any of the test accounts:

- **Manager 1:** manager1@test.com / Test@123456
- **Manager 2:** manager2@test.com / Test@123456
- **Trainer 1:** trainer1@test.com / Test@123456
- etc.

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
- Make sure `.env` file has both:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Error: "Failed to create user"
- Check that email doesn't already exist
- Verify service_role key is correct
- Check Supabase project is active

### Error: "tsx command not found"
- Run `npm install` first to install dependencies

### Script says "already exists"
- That's fine! The script is idempotent (safe to run multiple times)
- It will skip existing data and only create new items

## 🔒 Security Note

The service_role key has **full admin access** to your database. 

**DO NOT:**
- ❌ Commit it to Git
- ❌ Share it publicly
- ❌ Use it in client-side code

**DO:**
- ✅ Keep it in `.env` (which is in `.gitignore`)
- ✅ Only use it for admin scripts like this
- ✅ Rotate it if exposed

## 📝 Manual Alternative

If you prefer the manual SQL approach, you can still use:
- `seed-test-data.sql` - Manual SQL script
- `QUICK_SEED_GUIDE.md` - Step-by-step instructions

But the automated script is much easier! 🎉

---

**Total Time:** ~2 minutes (vs 10+ minutes manually)

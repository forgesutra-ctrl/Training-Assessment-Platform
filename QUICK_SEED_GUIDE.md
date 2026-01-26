# Quick Seed Data Guide

## ⚠️ Important: Read This First!

**You MUST create auth users BEFORE running the seed script!** The profile table has a foreign key constraint that requires the user ID to exist in `auth.users` first.

## Step 1: Create Auth Users (5 minutes)

1. Go to your Supabase project dashboard
2. Click **Authentication** → **Users**
3. Click **Add User** → **Create new user**

Create these 6 users (one at a time):

| Email | Password | Full Name | Role |
|-------|----------|-----------|------|
| manager1@test.com | Test@123456 | Sarah Johnson | Manager |
| manager2@test.com | Test@123456 | John Smith | Manager |
| trainer1@test.com | Test@123456 | Alice Williams | Trainer |
| trainer2@test.com | Test@123456 | Bob Davis | Trainer |
| trainer3@test.com | Test@123456 | Carol Brown | Trainer |
| trainer4@test.com | Test@123456 | David Miller | Trainer |

**Important:** Check ✅ **"Auto Confirm User"** for each user!

## Step 2: Get User IDs (1 minute)

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
SELECT id, email FROM auth.users 
WHERE email LIKE '%@test.com' 
ORDER BY email;
```

3. **Copy all 6 IDs** - you'll need them in the next step

## Step 3: Update the Seed Script (2 minutes)

1. Open `seed-test-data.sql` in a text editor
2. Use **Find & Replace** (Ctrl+H) to replace these UUIDs:

**Find these (one at a time):**
- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` → Replace with Sarah Johnson's ID
- `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` → Replace with John Smith's ID
- `cccccccc-cccc-cccc-cccc-cccccccccccc` → Replace with Alice Williams's ID
- `dddddddd-dddd-dddd-dddd-dddddddddddd` → Replace with Bob Davis's ID
- `eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee` → Replace with Carol Brown's ID
- `ffffffff-ffff-ffff-ffff-ffffffffffff` → Replace with David Miller's ID

**Tip:** Use Find & Replace to replace all occurrences at once for each UUID.

## Step 4: Run the Seed Script (1 minute)

1. Copy the entire updated `seed-test-data.sql` file
2. Paste into Supabase SQL Editor
3. Click **Run**

You should see success! ✅

## Step 5: Verify (30 seconds)

Run this query to verify everything was created:

```sql
-- Check teams
SELECT 'Teams' as type, COUNT(*) as count FROM teams;

-- Check profiles
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;

-- Check assessments
SELECT 'Assessments' as type, COUNT(*) as count FROM assessments;
```

You should see:
- Teams: 2
- Profiles: 6 (2 managers, 4 trainers)
- Assessments: 4

## 🐛 Troubleshooting

### Error: "Key (id)=... is not present in table users"
- **Cause:** You're using placeholder UUIDs that don't exist
- **Fix:** Make sure you created auth users first and replaced all UUIDs with real IDs

### Error: "duplicate key value violates unique constraint"
- **Cause:** Data already exists
- **Fix:** This is fine! The script uses `ON CONFLICT` so it's safe to run multiple times

### Can't find users
- **Cause:** Users weren't created or have different emails
- **Fix:** Check Authentication → Users to see what users exist

## ✅ Success Checklist

- [ ] Created 6 auth users in Supabase Dashboard
- [ ] Got all 6 user IDs from SQL query
- [ ] Replaced all 6 placeholder UUIDs in seed script
- [ ] Ran seed script successfully
- [ ] Verified data with check queries
- [ ] Can log in with test credentials

## 🎯 Test Login

Once everything is set up, you can log in with:

- **Manager 1:** manager1@test.com / Test@123456
- **Manager 2:** manager2@test.com / Test@123456
- **Trainer 1:** trainer1@test.com / Test@123456
- **Trainer 2:** trainer2@test.com / Test@123456
- **Trainer 3:** trainer3@test.com / Test@123456
- **Trainer 4:** trainer4@test.com / Test@123456

---

**Total Time:** ~10 minutes  
**Difficulty:** Easy (just follow the steps!)

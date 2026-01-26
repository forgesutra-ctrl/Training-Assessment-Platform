# Test Data Setup Instructions

This guide will walk you through creating test data for the Training Assessment System.

## 🎯 Quick Start (Easiest Method)

### Step 1: Create Auth Users in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **Authentication** in the left sidebar
3. Click **Users** → **Add User** → **Create new user**

Create these 6 users (one at a time):

#### Manager 1: Sarah Johnson
- **Email**: `manager1@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅ (check this box)
- Click **Create User**
- **Copy the User ID** (you'll need it)

#### Manager 2: John Smith
- **Email**: `manager2@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅
- Click **Create User**
- **Copy the User ID**

#### Trainer 1: Alice Williams
- **Email**: `trainer1@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅
- Click **Create User**
- **Copy the User ID**

#### Trainer 2: Bob Davis
- **Email**: `trainer2@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅
- Click **Create User**
- **Copy the User ID**

#### Trainer 3: Carol Brown
- **Email**: `trainer3@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅
- Click **Create User**
- **Copy the User ID**

#### Trainer 4: David Miller
- **Email**: `trainer4@test.com`
- **Password**: `Test@123456`
- **Auto Confirm User**: ✅
- Click **Create User**
- **Copy the User ID**

### Step 2: Get All User IDs

After creating all users, you can get all IDs at once:

1. In Supabase, go to **SQL Editor**
2. Run this query:
```sql
SELECT id, email FROM auth.users ORDER BY email;
```
3. Copy all the IDs and match them to the users above

### Step 3: Update the Seed Script

1. Open `seed-test-data.sql` in a text editor
2. Find the section that says:
```sql
DECLARE
    manager1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; -- Replace with Sarah Johnson's auth user ID
    manager2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; -- Replace with John Smith's auth user ID
    trainer1_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc'; -- Replace with Alice Williams's auth user ID
    trainer2_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd'; -- Replace with Bob Davis's auth user ID
    trainer3_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'; -- Replace with Carol Brown's auth user ID
    trainer4_id UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff'; -- Replace with David Miller's auth user ID
```

3. Replace each UUID with the actual user ID you copied:
   - `manager1_id` = Sarah Johnson's ID
   - `manager2_id` = John Smith's ID
   - `trainer1_id` = Alice Williams's ID
   - `trainer2_id` = Bob Davis's ID
   - `trainer3_id` = Carol Brown's ID
   - `trainer4_id` = David Miller's ID

### Step 4: Run the Seed Script

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy the entire contents of `seed-test-data.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

You should see success messages!

### Step 5: Verify the Data

Run these queries in SQL Editor to verify:

```sql
-- Check teams
SELECT * FROM teams;

-- Check profiles
SELECT full_name, role, team_id FROM profiles ORDER BY role, full_name;

-- Check assessments
SELECT COUNT(*) as total_assessments FROM assessments;
```

## 📊 What Gets Created

- ✅ **2 Teams**: Sales Team, Marketing Team
- ✅ **2 Managers**: Sarah Johnson, John Smith
- ✅ **4 Trainers**: Alice Williams, Bob Davis, Carol Brown, David Miller
- ✅ **4 Sample Assessments**: Cross-team assessments with realistic data

## 🔐 Test Credentials

You can now log in with any of these accounts:

| Role | Email | Password |
|------|-------|----------|
| Manager | manager1@test.com | Test@123456 |
| Manager | manager2@test.com | Test@123456 |
| Trainer | trainer1@test.com | Test@123456 |
| Trainer | trainer2@test.com | Test@123456 |
| Trainer | trainer3@test.com | Test@123456 |
| Trainer | trainer4@test.com | Test@123456 |

## 🧪 Testing Scenarios

### Scenario 1: Manager Assessing Cross-Team Trainer
1. Log in as `manager1@test.com` (Sarah Johnson)
2. Go to Manager Dashboard
3. Click "New Assessment"
4. You should see Carol Brown and David Miller in the dropdown (not Alice or Bob - they're her direct reports)
5. Select Carol Brown and complete the assessment

### Scenario 2: View Recent Assessments
1. Log in as `manager1@test.com`
2. You should see 2 assessments in the "Recent Assessments" table
3. Click "View Details" to see full assessment

### Scenario 3: Manager Cannot Assess Direct Report
1. Log in as `manager1@test.com`
2. Try to create an assessment
3. Alice Williams and Bob Davis should NOT appear in the dropdown (they report to Sarah)

## 🐛 Troubleshooting

### "No eligible trainers available"
- Make sure you've created all profiles correctly
- Check that trainers have `reporting_manager_id` set correctly
- Verify managers are not trying to assess their direct reports

### "Profile not found" when logging in
- Make sure you updated the UUIDs in the seed script with actual auth user IDs
- Verify profiles were created successfully (check profiles table)

### Can't see assessments
- Check that assessments were created (run verification queries)
- Make sure you're logged in as the correct manager
- Verify the `assessor_id` matches your user ID

## 🔄 Re-running the Script

The script is **idempotent** (safe to run multiple times):
- Teams: Updates if they exist
- Profiles: Updates if they exist
- Assessments: Skips if they already exist

You can run it again without creating duplicates!

## 📝 Notes

- All passwords are: `Test@123456`
- Assessment dates are within the last 30 days
- All ratings are between 3-5 (realistic scores)
- Comments are meaningful and at least 30 characters
- Cross-team assessments only (managers assess trainers from other teams)

---

**Need Help?**
- Check the browser console for errors
- Verify database schema is set up (run `supabase-schema.sql` first)
- Check RLS policies are enabled
- Review the verification queries above

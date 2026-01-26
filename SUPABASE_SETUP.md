# Supabase Database Setup Guide

This guide will walk you through setting up your database schema in Supabase.

## 📋 Prerequisites

1. A Supabase account (free tier is fine)
2. A Supabase project created
3. Access to the Supabase SQL Editor

## 🚀 Step-by-Step Instructions

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Main Schema Script

1. Open the file `supabase-schema.sql` in this project
2. **Copy the ENTIRE contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected Result:** You should see success messages like:
- ✅ Database schema created successfully!
- ✅ Tables: teams, profiles, assessments
- ✅ RLS policies enabled

### Step 3: Verify Tables Were Created

1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see three tables:
   - `teams`
   - `profiles`
   - `assessments`

### Step 4: Create Test Users (Optional)

To test the system, you'll need to create users:

1. Go to **Authentication** → **Users** in Supabase
2. Click **Add User** → **Create new user**
3. Create users with these roles:
   - 1 Admin user
   - 2-3 Manager users
   - 4-6 Trainer users
4. **Important:** Copy the UUIDs of each user (you'll need them)

### Step 5: Insert Sample Data (Optional)

1. Open `supabase-sample-data.sql`
2. Replace the placeholder UUIDs with your actual user IDs from Step 4
3. Uncomment the INSERT statements (remove the `/*` and `*/`)
4. Run the script in SQL Editor

## 🔒 Security Features Explained

### Row Level Security (RLS)

All tables have RLS enabled, which means:
- Users can only see/modify data they're allowed to
- Policies automatically enforce access rules

### Key Security Rules

1. **Managers CANNOT assess direct reports**
   - A trigger prevents this automatically
   - If attempted, you'll get an error

2. **Trainers can ONLY view their own assessments**
   - They cannot see assessments of other trainers

3. **Managers can view assessments they created**
   - They can see assessments where they are the assessor

4. **Admins can view everything**
   - Full access to all data

5. **Only admins can delete assessments**
   - Regular users cannot delete assessments

## 📊 Database Structure

### Teams Table
- Stores team information
- Used to group users

### Profiles Table
- Extends Supabase `auth.users`
- Stores user role, team, and reporting relationships
- Links to teams and other profiles (for reporting structure)

### Assessments Table
- Stores all assessment data
- Links trainer (being assessed) to assessor (manager doing assessment)
- Contains 6 rating categories (1-5 scale) with comments
- Automatically prevents invalid assessments

## 🛠️ Helper Functions

### `calculate_assessment_average(assessment_id)`
Calculates the average score across all 6 rating categories.

**Usage:**
```sql
SELECT calculate_assessment_average('assessment-uuid-here');
```

### `prevent_self_report_assessment()`
Automatically prevents managers from assessing their direct reports.

**Note:** This runs automatically via trigger - you don't call it manually.

### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp when records are modified.

**Note:** This runs automatically via trigger.

## 📈 Helper View

### `assessment_summary`
A view that shows assessments with calculated averages and trainer/assessor names.

**Usage:**
```sql
SELECT * FROM assessment_summary ORDER BY assessment_date DESC;
```

## 🧪 Testing the Security Rules

### Test 1: Manager Cannot Assess Direct Report

1. Create a manager user
2. Create a trainer user that reports to that manager
3. Try to create an assessment where the manager assesses their direct report
4. **Expected:** Error message preventing the action

### Test 2: Trainer Can Only See Own Assessments

1. Log in as a trainer
2. Query assessments
3. **Expected:** Only see assessments where they are the trainer

### Test 3: Manager Can See Assessments They Created

1. Log in as a manager
2. Create an assessment (for a trainer who doesn't report to them)
3. Query assessments
4. **Expected:** See assessments where they are the assessor

## 🔍 Useful Queries

### Get all profiles with their teams
```sql
SELECT 
    p.full_name,
    p.role,
    t.team_name,
    m.full_name AS reporting_manager
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles m ON p.reporting_manager_id = m.id
ORDER BY p.role, p.full_name;
```

### Get assessment averages
```sql
SELECT 
    trainer.full_name AS trainer,
    assessor.full_name AS assessor,
    a.assessment_date,
    calculate_assessment_average(a.id) AS average_score
FROM assessments a
JOIN profiles trainer ON a.trainer_id = trainer.id
JOIN profiles assessor ON a.assessor_id = assessor.id
ORDER BY a.assessment_date DESC;
```

### Get all assessments for a specific trainer
```sql
SELECT * FROM assessment_summary 
WHERE trainer_name = 'Alice Trainer'
ORDER BY assessment_date DESC;
```

## ⚠️ Troubleshooting

### "Permission denied" errors
- Make sure RLS policies are enabled
- Check that you're logged in with the correct user
- Verify the user has a profile entry

### "Managers cannot assess their direct reports" error
- This is expected behavior!
- The system prevents managers from assessing people who report to them
- Use a different manager or change the reporting structure

### Tables not appearing
- Refresh the Table Editor
- Check the SQL Editor for any error messages
- Verify the script ran completely

### Sample data not inserting
- Make sure you replaced UUIDs with actual user IDs
- Verify users exist in `auth.users` table
- Check that profiles exist before inserting assessments

## 📝 Next Steps

1. **Integrate with your React app:**
   - Update `src/lib/supabase.ts` with your credentials
   - Create API functions to query assessments
   - Build UI components to display data

2. **Customize as needed:**
   - Add more rating categories
   - Modify RLS policies for your specific needs
   - Add additional tables (e.g., training sessions, courses)

3. **Set up authentication:**
   - Configure email authentication in Supabase
   - Set up user registration flow
   - Create profile automatically on user signup

## 💡 Tips

- Always test RLS policies with different user roles
- Use the `assessment_summary` view for easier querying
- The `calculate_assessment_average()` function is useful for dashboards
- Keep your user UUIDs handy - you'll need them for testing

---

**Need Help?**
- Check Supabase documentation: https://supabase.com/docs
- Review the SQL scripts for comments
- Test queries in the SQL Editor before using in your app

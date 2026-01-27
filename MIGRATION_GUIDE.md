# Migration Guide: 6 Parameters to 21 Parameters

## Overview

This guide walks you through migrating the assessment system from 6 generic parameters to 21 detailed parameters organized into 5 categories.

---

## Prerequisites

- Access to Supabase Dashboard
- SQL Editor access in Supabase
- Backup of existing data (recommended)

---

## Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Go to **SQL Editor**

2. **Run the Migration Script**
   - Open `migrations/update-to-21-parameters.sql`
   - Copy the entire SQL script
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Migration**
   - Check for any errors in the output
   - Run this verification query:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'assessments' 
   AND (column_name LIKE '%logs_in_early%' 
        OR column_name LIKE '%adequate_knowledge%'
        OR column_name LIKE '%maintains_attention%')
   ORDER BY column_name;
   ```
   - You should see the new parameter columns listed

---

## Step 2: Handle Existing Assessments

**Important:** Existing assessments will have `NULL` values for all 21 new parameters. This is expected behavior.

### Option A: Keep Existing Assessments As-Is (Recommended)
- Existing assessments remain valid
- They will show `NULL` for new parameters
- Only new assessments will use the 21-parameter structure

### Option B: Migrate Existing Data (Advanced)
If you want to map old 6 parameters to new 21 parameters, you'll need custom SQL. Example:

```sql
-- Example: Map old "trainers_readiness" to new "logs_in_early"
-- This is a simplified example - adjust based on your mapping logic
UPDATE assessments
SET logs_in_early = trainers_readiness
WHERE trainers_readiness IS NOT NULL;
```

**Note:** This requires careful mapping logic. Consult with your team before attempting.

---

## Step 3: Update Application Code

The following files have been updated:

### ✅ Completed Updates:
1. **Types** (`src/types/index.ts`)
   - Added `ASSESSMENT_STRUCTURE` constant
   - Updated `ManagerAssessment` interface
   - Added `CategoryAverage` type

2. **Assessment Form** (`src/components/AssessmentForm.tsx`)
   - Completely rebuilt with category-based UI
   - 21 parameters organized in 5 categories
   - Progress tracking
   - Auto-save functionality

3. **Assessment Feedback Modal** (`src/components/AssessmentFeedbackModal.tsx`)
   - Updated to display 21 parameters by category
   - Category averages
   - Collapsible sections

4. **Utilities** (`src/utils/trainerStats.ts`, `src/utils/trainerAssessments.ts`)
   - Updated to calculate averages from 21 parameters
   - Added category average functions

### ⚠️ Files That May Need Updates:
- `src/pages/TrainerDashboard.tsx` - Update parameter breakdown
- `src/components/admin/TrainerPerformance.tsx` - Update to show categories
- `src/utils/adminQueries.ts` - Update SQL queries
- `src/utils/excelExport.ts` - Update export format

---

## Step 4: Testing Checklist

### Database Tests
- [ ] Migration script runs without errors
- [ ] All 42 new columns exist (21 ratings + 21 comments)
- [ ] Existing assessments still accessible
- [ ] New assessment can be created

### Form Tests
- [ ] Assessment form loads correctly
- [ ] All 5 categories are visible
- [ ] All 21 parameters can be filled
- [ ] Progress indicator updates correctly
- [ ] Validation works (min 20 char comments)
- [ ] Auto-save works
- [ ] Form submission succeeds

### Display Tests
- [ ] Assessment feedback modal shows all parameters
- [ ] Category averages calculate correctly
- [ ] Trainer dashboard shows category breakdown
- [ ] Admin performance view shows categories

### Data Tests
- [ ] Average calculations use all 21 parameters
- [ ] Category averages are accurate
- [ ] Trend charts work with new structure
- [ ] Exports include all parameters

---

## Step 5: Rollback Plan (If Needed)

If you need to rollback:

1. **Restore Database Backup**
   - Use your Supabase backup
   - Or manually restore the old column structure

2. **Revert Code Changes**
   - Use git to revert to previous commit
   - Or manually restore old component files

3. **Test Rollback**
   - Verify old assessments are accessible
   - Verify form works with 6 parameters

---

## New Parameter Structure

### Category 1: Trainer Initial Readiness (5 parameters)
1. Early Login
2. Video Always On
3. Minimal Disturbance
4. Presentable & Prompt
5. Ready with Tools

### Category 2: Trainer Expertise & Delivery (5 parameters)
1. Subject Knowledge
2. Simplifies Topics
3. Encourages Participation
4. Handles Questions
5. Provides Context

### Category 3: Participant Engagement & Interaction (4 parameters)
1. Maintains Attention
2. Uses Interactive Tools
3. Assesses Learning
4. Clear Speech

### Category 4: Communication Skills (3 parameters)
1. Grammar & Language
2. Professional Tone
3. Manages Teams

### Category 5: Technical Acumen (4 parameters)
1. Tool Switching
2. Audio/Video Clarity
3. Session Recording
4. Survey Assignment

---

## Common Issues & Solutions

### Issue: Migration fails with "column already exists"
**Solution:** The column may have been partially created. Drop it first:
```sql
ALTER TABLE assessments DROP COLUMN IF EXISTS column_name CASCADE;
```
Then re-run the migration.

### Issue: Form shows old parameters
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Average calculations are wrong
**Solution:** Verify the `calculateAverageRating` function uses all 21 parameters, not just 6.

### Issue: Existing assessments show NULL
**Solution:** This is expected. Only new assessments will have all 21 parameters filled.

---

## Support

If you encounter issues:
1. Check the error message in Supabase SQL Editor
2. Review the migration script for syntax errors
3. Verify all TypeScript types are updated
4. Check browser console for frontend errors

---

## Post-Migration Tasks

After successful migration:

1. **Test thoroughly** with a new assessment
2. **Train users** on the new 21-parameter form
3. **Update documentation** if needed
4. **Monitor** for any calculation discrepancies
5. **Gather feedback** from managers and trainers

---

## Summary

- ✅ Database migration: Run SQL script
- ✅ Code updates: Already completed
- ✅ Testing: Use checklist above
- ✅ Rollback: Available if needed

The system is now ready to use 21 detailed parameters for comprehensive trainer assessments!

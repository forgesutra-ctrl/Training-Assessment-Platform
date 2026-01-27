# Post-Migration Checklist

## ✅ Migration Complete!

The database migration has been successfully run. Follow these steps to verify everything is working:

## 1. Database Verification

Run the verification queries in `migrations/verify-migration.sql`:

- ✅ All 21 rating columns exist
- ✅ All 21 comment columns exist  
- ✅ Old 6-parameter columns are removed
- ✅ Total of 42 new columns (21 ratings + 21 comments)
- ✅ Indexes created successfully
- ✅ Constraints applied correctly

## 2. Application Testing

### Test the Assessment Form
1. **Login as a Manager**
   - Navigate to the assessment form
   - Verify you see 5 category sections:
     - 🎯 Trainer Initial Readiness (5 parameters)
     - 📚 Trainer Expertise & Delivery (5 parameters)
     - 👥 Participant Engagement & Interaction (4 parameters)
     - 💬 Communication Skills (3 parameters)
     - ⚙️ Technical Acumen (4 parameters)

2. **Fill out a test assessment**
   - Rate all 21 parameters (1-5 stars)
   - Add comments (minimum 20 characters each)
   - Verify progress indicator shows "X of 21 completed"
   - Test auto-save functionality
   - Submit the assessment

3. **Verify submission**
   - Check that the assessment was saved successfully
   - Verify average score is calculated from all 21 parameters

### Test Trainer Dashboard
1. **Login as a Trainer**
   - View your dashboard
   - Check that performance metrics use all 21 parameters
   - Verify category averages are displayed correctly
   - Check "What's Improving" and "Needs Attention" show categories

### Test Admin Features
1. **Login as Admin**
   - View Trainer Performance
   - Export trainer data (should include all 21 parameters grouped by category)
   - Check Advanced Analytics / Data Studio
   - Verify correlation analysis works with 21 parameters

## 3. Data Migration (If Needed)

If you have existing assessments with the old 6-parameter structure:

**Option 1: Keep existing assessments as-is**
- Old assessments will have NULL values for new 21 parameters
- They'll still display with their old average_score
- New assessments will use the 21-parameter structure

**Option 2: Migrate existing data (Advanced)**
- Create a data migration script to map old 6 parameters to new 21 parameters
- This requires business logic to determine how to map:
  - `trainers_readiness` → `logs_in_early`, `video_always_on`, `minimal_disturbance`, `presentable_prompt`, `ready_with_tools`
  - `communication_skills` → `minimal_grammar_errors`, `professional_tone`, `manages_teams_well`
  - etc.

**Recommendation:** Start with Option 1, then migrate data later if needed.

## 4. Common Issues & Solutions

### Issue: "Column does not exist" errors
**Solution:** Verify migration ran completely. Check `migrations/verify-migration.sql`

### Issue: Assessment form shows old 6 parameters
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Average scores seem incorrect
**Solution:** Verify `calculateAssessmentAverage()` in `src/utils/trainerStats.ts` is using all 21 parameters

### Issue: Exports missing new parameters
**Solution:** Verify `src/components/admin/TrainerPerformance.tsx` export function includes all 21 parameters

## 5. Performance Monitoring

After migration, monitor:
- Assessment form load time
- Dashboard query performance
- Export generation speed
- Database query execution time

If performance degrades, check:
- Indexes are being used: `EXPLAIN ANALYZE` on slow queries
- Consider adding more indexes if needed

## 6. Rollback Plan (If Needed)

If you need to rollback:

1. **Restore from backup** (if you created one before migration)
2. **Or manually restore old columns:**
   ```sql
   -- Re-add old 6-parameter columns
   ALTER TABLE assessments ADD COLUMN trainers_readiness INTEGER;
   ALTER TABLE assessments ADD COLUMN communication_skills INTEGER;
   -- ... etc
   
   -- Drop new 21-parameter columns
   ALTER TABLE assessments DROP COLUMN logs_in_early CASCADE;
   -- ... etc
   ```

**Note:** Rollback will lose any new assessments created after migration.

## 7. Next Steps

- ✅ Migration complete
- ✅ Application code updated
- ⏭️ Test thoroughly
- ⏭️ Train users on new assessment form
- ⏭️ Monitor for issues
- ⏭️ Gather user feedback

## 🎉 Success Criteria

You'll know the migration is successful when:
- ✅ Assessment form displays all 21 parameters in 5 categories
- ✅ New assessments can be created and saved
- ✅ Trainer dashboards show correct category averages
- ✅ Admin exports include all 21 parameters
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

---

**Need Help?** Check `MIGRATION_GUIDE.md` for detailed documentation.

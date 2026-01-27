# Remaining Migration Tasks: 21-Parameter System

## Overview
This document lists all components and files that still need to be updated to fully support the new 21-parameter assessment system.

---

## 🔴 Critical Updates Required

### 1. **src/utils/adminQueries.ts** ⚠️ HIGH PRIORITY
**Status:** Needs complete update
**Issues:**
- Lines 38-46: `fetchPlatformStats()` still calculates average using 6 old parameters
- Lines 123-138: `fetchAllTrainersWithStats()` uses old 6-parameter calculation
- `fetchMonthlyTrends()` likely needs update for category averages
- All SQL queries that reference old column names

**What to update:**
- Replace 6-parameter average calculation with 21-parameter calculation
- Update to use `calculateAverageRating()` from `trainerStats.ts`
- Update `fetchMonthlyTrends()` to return category averages instead of parameter averages

---

### 2. **src/components/admin/TrainerPerformance.tsx** ⚠️ HIGH PRIORITY
**Status:** Partially needs update
**Issues:**
- Lines 137-142: Export function still references old 6 parameters
- Lines 512-517: Modal display shows old 6 parameters instead of 21

**What to update:**
- Update export to include all 21 parameters grouped by category
- Update trainer detail modal to show 5 category averages + all 21 parameters
- Use `ASSESSMENT_STRUCTURE` constant for parameter labels

---

### 3. **src/utils/reporting.ts** ⚠️ MEDIUM PRIORITY
**Status:** May need updates
**Issues:**
- Export functions are generic, but may need category grouping
- Excel exports should organize by category

**What to update:**
- Add category grouping in Excel exports
- Update column headers to use new parameter names
- Add category summary sheets

---

## 🟡 Secondary Updates (Nice to Have)

### 4. **src/pages/TrainerDashboard.tsx** 
**Status:** Mostly compatible, may need minor updates
**Issues:**
- Uses `calculateParameterAverages()` which we already updated ✅
- May need to update radar chart to show 5 categories instead of 6 parameters
- Parameter breakdown display may need category grouping

**What to update:**
- Update radar chart to use 5 categories
- Group parameter breakdown by category
- Update "Best/Worst Parameter" to show category-based insights

---

### 5. **src/components/admin/CorrelationAnalysis.tsx**
**Status:** Needs update
**Issues:**
- Likely references old 6 parameters for correlation calculations

**What to update:**
- Update correlation calculations to use 21 parameters
- Group correlations by category
- Update visualization to show category relationships

---

### 6. **src/utils/correlationAnalysis.ts**
**Status:** Needs update
**Issues:**
- Correlation calculations use old parameter names

**What to update:**
- Update to calculate correlations for all 21 parameters
- Add category-level correlation analysis

---

### 7. **src/components/admin/TimeAnalysis.tsx**
**Status:** Needs update
**Issues:**
- Time-based analysis likely uses old parameters

**What to update:**
- Update time analysis to use 21 parameters
- Add category trend analysis

---

### 8. **src/utils/trendAnalysis.ts**
**Status:** Needs update
**Issues:**
- Trend analysis uses old parameter structure

**What to update:**
- Update trend calculations for 21 parameters
- Add category trend tracking

---

### 9. **src/utils/assessments.ts**
**Status:** Needs check
**Issues:**
- May have utility functions referencing old parameters

**What to update:**
- Review and update any parameter-specific functions

---

### 10. **src/components/AssessmentDetails.tsx**
**Status:** Needs check
**Issues:**
- May display old parameter structure

**What to update:**
- Update to show 21 parameters by category (similar to AssessmentFeedbackModal)

---

### 11. **src/components/SmartSearch.tsx**
**Status:** Needs check
**Issues:**
- Search may filter by old parameter names

**What to update:**
- Update search to work with new parameter names

---

### 12. **src/utils/notifications.ts**
**Status:** Needs check
**Issues:**
- Alert rules may reference old parameters

**What to update:**
- Update alert conditions to use new parameter structure

---

### 13. **src/utils/recommendations.ts**
**Status:** Needs check
**Issues:**
- Recommendations may reference old parameters

**What to update:**
- Update recommendation logic for 21 parameters
- Add category-based recommendations

---

### 14. **src/utils/activityFeed.ts**
**Status:** Needs check
**Issues:**
- Activity feed may display old parameter names

**What to update:**
- Update activity descriptions to use new parameter names

---

### 15. **src/utils/gamification.ts**
**Status:** Needs check
**Issues:**
- Badge/XP calculations may reference old parameters

**What to update:**
- Update gamification logic to use 21 parameters
- Add category-specific achievements

---

### 16. **src/utils/aiService.ts**
**Status:** Needs check
**Issues:**
- AI feedback may reference old parameter names

**What to update:**
- Update AI prompts to use new parameter names
- Add category context to AI suggestions

---

### 17. **src/components/dashboard/TrainerSmartDashboard.tsx**
**Status:** Needs check
**Issues:**
- Dashboard may display old parameter breakdown

**What to update:**
- Update to show category-based performance
- Use `calculateCategoryAverages()` function

---

### 18. **src/components/GoalTracking.tsx**
**Status:** Needs check
**Issues:**
- Goals may reference old parameter names

**What to update:**
- Update goal types to include new parameters
- Add category-based goals

---

### 19. **src/scripts/seedData.ts**
**Status:** Needs update
**Issues:**
- Seed data uses old 6-parameter structure

**What to update:**
- Update seed script to create assessments with 21 parameters
- Use new column names

---

## ✅ Already Updated

1. ✅ `src/types/index.ts` - Added ASSESSMENT_STRUCTURE and updated types
2. ✅ `src/components/AssessmentForm.tsx` - Completely rebuilt for 21 parameters
3. ✅ `src/components/AssessmentFeedbackModal.tsx` - Updated to show 21 parameters by category
4. ✅ `src/utils/trainerStats.ts` - Updated all calculation functions
5. ✅ `src/utils/trainerAssessments.ts` - Updated to calculate from 21 parameters
6. ✅ `migrations/update-to-21-parameters.sql` - Database migration ready

---

## 📋 Priority Order

### Phase 1: Critical (Must Fix)
1. `src/utils/adminQueries.ts` - Core admin queries
2. `src/components/admin/TrainerPerformance.tsx` - Admin performance view

### Phase 2: Important (Should Fix)
3. `src/utils/reporting.ts` - Export functionality
4. `src/pages/TrainerDashboard.tsx` - Trainer dashboard display
5. `src/components/admin/CorrelationAnalysis.tsx` - Analytics

### Phase 3: Nice to Have (Can Fix Later)
6. All other utility files
7. Seed scripts
8. Dashboard components

---

## 🚀 Quick Fix Guide

### For adminQueries.ts:
```typescript
// OLD (lines 38-46):
const avg = (a.trainers_readiness + a.communication_skills + ...) / 6

// NEW:
import { calculateAssessmentAverage } from '@/utils/trainerStats'
const avg = calculateAssessmentAverage(a)
```

### For TrainerPerformance.tsx:
```typescript
// OLD:
'Trainer Readiness': assessment.trainers_readiness,

// NEW:
import { ASSESSMENT_STRUCTURE } from '@/types'
ASSESSMENT_STRUCTURE.categories.forEach(category => {
  category.parameters.forEach(param => {
    data[param.label] = assessment[param.id]
  })
})
```

---

## 📝 Testing Checklist

After updating each file:
- [ ] Verify calculations use all 21 parameters
- [ ] Check that category averages display correctly
- [ ] Test exports include all parameters
- [ ] Verify no console errors
- [ ] Test with existing assessments (NULL values)
- [ ] Test with new assessments (all 21 parameters)

---

## Summary

**Total Files to Update:** ~19 files
**Critical:** 2 files (adminQueries.ts, TrainerPerformance.tsx)
**Important:** 3 files
**Nice to Have:** 14 files

The core functionality is working, but admin features and analytics need updates to fully support the new structure.

# Manager Assessment System Guide

Complete guide to the manager assessment form system.

## 📋 Overview

The assessment system allows managers to evaluate trainers from other teams (not their direct reports) across 6 key parameters with detailed comments.

## 🎯 Features

### Manager Dashboard
- **Real-time Statistics**: Monthly assessment counts, trainers assessed, average ratings
- **Quick Access**: Large "New Assessment" button
- **Recent Assessments Table**: Last 10 assessments with trainer name, date, average score
- **View Details**: Click to see full assessment in modal
- **Loading States**: Skeleton loaders while fetching data

### Assessment Form
- **Smart Trainer Selection**: Only shows trainers from other teams (not direct reports)
- **Six Rating Categories**: Each with 1-5 star rating and required comments
- **Form Validation**: Real-time validation with clear error messages
- **Character Limits**: Comments must be 20-500 characters
- **Auto-save Prevention**: Prevents double submission
- **Success Feedback**: Toast notifications and auto-redirect

### Star Rating Component
- **Interactive**: Hover and click to select
- **Visual Feedback**: Gold stars for selected, gray for unselected
- **Accessible**: Keyboard navigation and ARIA labels
- **Clear Display**: Shows numeric value (e.g., "4 / 5")

### Assessment Details Modal
- **Complete View**: All ratings and comments in one place
- **Average Calculation**: Automatically calculated overall score
- **Professional Layout**: Card-based design with clear sections
- **Easy Navigation**: Close button and backdrop click to dismiss

## 📁 File Structure

```
src/
├── components/
│   ├── AssessmentForm.tsx      # Main assessment form
│   ├── AssessmentDetails.tsx   # Modal for viewing assessments
│   └── StarRating.tsx          # Interactive star rating component
├── pages/
│   └── ManagerDashboard.tsx    # Updated dashboard with stats and table
├── utils/
│   └── assessments.ts          # Database utility functions
└── types/
    └── index.ts                # TypeScript types (ManagerAssessment, etc.)
```

## 🔄 User Flow

1. **Manager logs in** → Redirected to `/manager/dashboard`
2. **Views dashboard** → Sees stats and recent assessments
3. **Clicks "New Assessment"** → Navigates to `/manager/assessment/new`
4. **Selects trainer** → Dropdown shows only eligible trainers
5. **Fills form** → Rates 6 categories with comments
6. **Submits** → Validation → Database save → Success toast → Redirect to dashboard
7. **Views details** → Clicks "View Details" → Modal opens with full assessment

## 📊 Database Functions

### `fetchEligibleTrainers(managerId)`
- Fetches trainers where `reporting_manager_id != managerId`
- Returns trainer name and team information
- Used in assessment form dropdown

### `fetchManagerAssessments(managerId, limit)`
- Fetches manager's recent assessments
- Calculates average scores
- Includes trainer and assessor names
- Used in dashboard table

### `fetchMonthlyStats(managerId)`
- Calculates statistics for current month:
  - Total assessments submitted
  - Number of unique trainers assessed
  - Average rating across all assessments
- Used in dashboard stats cards

### `fetchAssessmentDetails(assessmentId)`
- Fetches single assessment with all details
- Calculates average score
- Includes related profile data
- Used in assessment details modal

## 🎨 UI Components

### StarRating Component
```tsx
<StarRating
  value={rating}
  onChange={(value) => setRating(value)}
  label="Rating"
  required
  error={error}
/>
```

**Props:**
- `value`: Current rating (0-5)
- `onChange`: Callback when rating changes
- `label`: Optional label text
- `required`: Shows required indicator
- `error`: Error message to display
- `disabled`: Disable interaction

### AssessmentForm Component
- Full form with all 6 rating sections
- Trainer selection dropdown
- Date picker
- Overall comments (optional)
- Submit and cancel buttons
- Back navigation to dashboard

### AssessmentDetails Modal
- Displays complete assessment
- Shows all 6 ratings with stars
- Displays all comments
- Shows metadata (dates, IDs)
- Responsive modal design

## ✅ Validation Rules

1. **Trainer Selection**: Required, must be from eligible list
2. **Assessment Date**: Required, must be valid date
3. **All Ratings**: Required, must be 1-5
4. **All Comments**: Required, 20-500 characters
5. **Overall Comments**: Optional, max 1000 characters

## 🔒 Security

- **RLS Policies**: Database enforces managers can't assess direct reports
- **Trigger Protection**: Database trigger prevents invalid assessments
- **Role-Based Access**: Only managers can access assessment routes
- **Profile Validation**: Checks user profile before allowing access

## 📱 Responsive Design

- **Mobile**: Stacked layout, full-width cards
- **Tablet**: 2-column grid for stats
- **Desktop**: 3-column grid, full table view
- **Touch-Friendly**: Large buttons, adequate spacing

## 🎯 Accessibility

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **ARIA Labels**: Proper labels for screen readers
- **Focus Indicators**: Clear focus states
- **Error Messages**: Descriptive error text
- **Color Contrast**: Meets WCAG AA standards

## 🚀 Usage Examples

### Creating a New Assessment

1. Navigate to Manager Dashboard
2. Click "New Assessment" button
3. Select trainer from dropdown
4. Select assessment date
5. Rate each category (1-5 stars)
6. Add comments for each category (20-500 chars)
7. Optionally add overall comments
8. Click "Submit Assessment"

### Viewing Assessment Details

1. Go to Manager Dashboard
2. Find assessment in "Recent Assessments" table
3. Click "View Details" button
4. Modal opens with full assessment
5. Review all ratings and comments
6. Click "Close" or backdrop to dismiss

## 🐛 Troubleshooting

### "No eligible trainers available"
- **Cause**: All trainers are direct reports or no trainers exist
- **Solution**: Ensure trainers from other teams exist in database

### "Failed to submit assessment"
- **Cause**: Validation error or database constraint violation
- **Solution**: Check all fields are filled correctly, ensure trainer is eligible

### "Managers cannot assess their direct reports"
- **Cause**: Attempting to assess a direct report
- **Solution**: This is expected behavior - select a trainer from another team

### Stats not showing
- **Cause**: No assessments created this month
- **Solution**: Create assessments to see statistics

## 📝 TypeScript Types

```typescript
interface ManagerAssessment {
  id: string
  trainer_id: string
  assessor_id: string
  assessment_date: string
  trainers_readiness: number
  trainers_readiness_comments: string | null
  communication_skills: number
  communication_skills_comments: string | null
  domain_expertise: number
  domain_expertise_comments: string | null
  knowledge_displayed: number
  knowledge_displayed_comments: string | null
  people_management: number
  people_management_comments: string | null
  technical_skills: number
  technical_skills_comments: string | null
  overall_comments: string | null
  created_at: string
  updated_at: string
}

interface AssessmentWithDetails extends ManagerAssessment {
  trainer_name: string
  assessor_name: string
  average_score: number
}
```

## 🎨 Color Scheme

- **Primary**: Blue (`primary-600`, `primary-700`)
- **Secondary**: Purple (`secondary-600`, `secondary-700`)
- **Success**: Green (`green-500`, `green-600`)
- **Warning**: Yellow (`yellow-400`, `yellow-500`)
- **Error**: Red (`red-500`, `red-600`)
- **Stars**: Gold (`yellow-400`)

## 📈 Performance

- **Lazy Loading**: Data fetched on component mount
- **Optimistic Updates**: UI updates immediately
- **Error Handling**: Graceful error messages
- **Loading States**: Skeleton loaders for better UX

---

**Need Help?**
- Check browser console for detailed errors
- Verify database schema is set up correctly
- Ensure RLS policies are enabled
- Check user has manager role in profile

# User Guide - Training Assessment Platform

Complete guide for using the Training Assessment Platform. This guide is designed for all user types: Managers, Trainers, and Administrators.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Manager Guide](#manager-guide)
3. [Trainer Guide](#trainer-guide)
4. [Admin Guide](#admin-guide)
5. [Frequently Asked Questions](#frequently-asked-questions)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Login

1. **Open the application** in your web browser
2. **Enter your email and password** provided by your administrator
3. **Click "Sign In"**
4. You'll be automatically redirected to your dashboard based on your role:
   - **Managers** → Manager Dashboard
   - **Trainers** → Trainer Dashboard
   - **Admins** → Admin Dashboard

### Changing Your Password

1. Click on **Settings** (top right, or go to `/settings`)
2. Go to **Security** tab
3. Enter your current password
4. Enter your new password (must be at least 8 characters with uppercase, lowercase, and number)
5. Confirm your new password
6. Click **Update Password**

### Updating Your Profile

1. Go to **Settings** → **Profile** tab
2. Update your full name
3. Click **Save Changes**

**Note:** Email and role cannot be changed. Contact an administrator if you need these updated.

---

## Manager Guide

### Overview

As a Manager, you can assess trainers from other teams to provide objective feedback. You cannot assess your own direct reports.

### Dashboard

Your dashboard shows:
- **Total Assessments** submitted this month
- **Trainers Assessed** count
- **Average Rating** you've given
- **Recent Assessments** table with last 10 assessments

### Creating an Assessment

#### Step 1: Start New Assessment

1. From your dashboard, click the large **"New Assessment"** button
2. Or navigate to the assessment form directly

#### Step 2: Select Trainer

1. In the **Trainer** dropdown, you'll see only trainers from **other teams**
2. Your direct reports are automatically excluded
3. Select the trainer you want to assess

#### Step 3: Select Date

1. Choose the **Assessment Date** (defaults to today)
2. You can select any date within the last 2 years

#### Step 4: Rate the Trainer

For each of the 6 parameters, you need to:

1. **Click stars** to rate (1-5 stars):
   - ⭐ = Needs Improvement
   - ⭐⭐ = Below Average
   - ⭐⭐⭐ = Average
   - ⭐⭐⭐⭐ = Good
   - ⭐⭐⭐⭐⭐ = Excellent

2. **Write comments** (required, 20-500 characters):
   - Provide specific, constructive feedback
   - Focus on observable behaviors
   - Be professional and respectful

**The 6 Parameters:**
- **Trainer's Readiness** - How prepared was the trainer?
- **Communication Skills** - How well did they communicate?
- **Domain Expertise** - How knowledgeable were they?
- **Knowledge Displayed** - How well did they demonstrate knowledge?
- **People Management** - How well did they manage the session?
- **Technical Skills** - How well did they use tools (laptop, screen sharing, etc.)?

#### Step 5: Overall Comments

1. Add any **additional feedback** in the "Overall Comments" section
2. This is optional but recommended

#### Step 6: Submit

1. Review your assessment
2. Click **Submit Assessment**
3. You'll see a success message
4. The form will clear, and you can create another assessment

### Viewing Past Assessments

1. On your dashboard, scroll to **Recent Assessments** table
2. Click **"View Details"** on any assessment
3. A modal will show the complete assessment with all ratings and comments

### Important Rules

✅ **You CAN:**
- Assess trainers from other teams
- View your own submitted assessments
- Submit multiple assessments per day (different trainers)

❌ **You CANNOT:**
- Assess your own direct reports
- Assess trainers from your own team
- Edit assessments after submission
- Submit duplicate assessments (same trainer, same date)

### Tips for Effective Assessments

1. **Be Specific:** Instead of "Good job," say "Effectively used screen sharing to demonstrate the process"
2. **Be Timely:** Submit assessments soon after observing the trainer
3. **Be Balanced:** Include both strengths and areas for improvement
4. **Be Professional:** Use respectful, constructive language
5. **Be Objective:** Focus on observable behaviors, not personal opinions

---

## Trainer Guide

### Overview

As a Trainer, you can view your performance metrics, see feedback from managers, and track your progress over time.

### Dashboard Overview

Your dashboard shows:

#### Performance Overview Cards

1. **Current Month Average** - Your average rating this month
2. **Total Assessments** - Number of assessments received this month
3. **Best Parameter** - Your highest-rated skill area
4. **Area for Improvement** - Your lowest-rated skill area

#### Parameter Breakdown

See all 6 parameters with:
- **Average score** for each parameter
- **Visual progress bar** showing your rating (0-5 scale)
- **Color coding:**
  - 🟢 Green (4.0+): Excellent
  - 🟡 Yellow (3.0-3.9): Good
  - 🔴 Red (<3.0): Needs Improvement

#### Performance Trend Chart

- **Line chart** showing your average rating over the last 6 months
- See if you're improving, maintaining, or declining
- Hover over data points to see exact values

#### Assessment History

- **Table** of all assessments you've received
- Shows: Date, Assessed By, Overall Score
- **Pagination** (10 per page)
- Click **"View Feedback"** to see full details

### Viewing Assessment Feedback

1. Click **"View Feedback"** on any assessment in the history table
2. A modal opens showing:
   - **Assessment date**
   - **Assessor name** (manager who assessed you)
   - **Overall average score** (large, prominent)
   - **All 6 parameters** with:
     - Star rating
     - Comments from the assessor
   - **Overall comments** section

### Filtering Your Data

Use the **Date Range** dropdown to filter:

- **Current Month** (default) - Shows this month's data
- **Last 3 Months** - Last quarter
- **Last 6 Months** - Last half year
- **Year to Date** - Since January 1st
- **All Time** - All your assessments

### Understanding Your Ratings

**5 Stars (Excellent):**
- Outstanding performance
- Exceeds expectations
- Keep up the great work!

**4 Stars (Good):**
- Strong performance
- Meets expectations
- Minor areas for improvement

**3 Stars (Average):**
- Adequate performance
- Meets basic expectations
- Room for growth

**2 Stars (Below Average):**
- Needs improvement
- Below expectations
- Focus on development

**1 Star (Needs Improvement):**
- Significant improvement needed
- Below expectations
- Consider additional training

### Tips for Growth

1. **Review Feedback Regularly:** Check your dashboard weekly
2. **Identify Patterns:** Look for consistent feedback across assessments
3. **Focus on Weak Areas:** Use the "Area for Improvement" as a guide
4. **Celebrate Strengths:** Build on your "Best Parameter"
5. **Ask Questions:** If feedback is unclear, discuss with your manager
6. **Set Goals:** Use trends to set improvement goals

---

## Admin Guide

### Overview

As an Administrator, you have full access to manage users, view analytics, and oversee the entire platform.

### Dashboard Tabs

Your admin dashboard has 6 main tabs:

#### 1. Overview Tab

**Recent Activity Feed:**
- See the last 20 assessments submitted
- Shows: Manager, Trainer, Date, Score
- Chronological list with timestamps

**Top Performers:**
- Top 5 trainers by average rating this month
- Shows: Name, Team, Average, Assessment Count

**Assessment Distribution:**
- Bar chart showing rating distribution
- See how many assessments fall into each rating range

**Monthly Trend:**
- Line chart showing assessment volume over 12 months
- Track platform activity

#### 2. Trainer Performance Tab

**Comprehensive Table:**
- All trainers with detailed statistics
- Columns: Name, Team, Month Avg, Quarter Avg, YTD Avg, All-Time Avg, Total, Trend
- **Sortable** by clicking column headers
- **Search** by name or team
- **Filter** by team and date range
- **Pagination** (20 per page)

**Actions:**
- **View Details** - See individual trainer performance
- **Export** - Download trainer data

#### 3. Manager Activity Tab

**Manager Activity Table:**
- Shows all managers and their activity
- Columns: Name, Team, Assessments (Month/Quarter/Year/All-Time), Avg Rating Given, Unique Trainers, Last Assessment, Status

**Cross-Team Assessment Matrix:**
- Visual table showing which managers assess which teams
- Helps identify assessment patterns
- Ensures cross-team compliance

#### 4. Time-based Analysis Tab

**Monthly Trends:**
- Average rating per month
- Assessment volume per month
- Parameter performance over time

**Quarterly Comparison:**
- Compare quarters side-by-side
- Year-over-year analysis

#### 5. User Management Tab

**User Statistics:**
- Total Users, Managers, Trainers, Admins
- Active users this month

**User Table:**
- All users with: Name, Email, Role, Team, Reporting Manager, Status, Created Date
- **Search** by name or email
- **Filter** by role, team, status
- **Sort** by any column
- **Pagination** (20 per page)

**Actions:**
- **Add New User** - Create individual user
- **Bulk Upload** - Upload CSV to create multiple users
- **Edit User** - Modify user details
- **View Details** - See user activity
- **Activate/Deactivate** - Toggle user status
- **Org Structure** - Visual organizational hierarchy

**Creating Users:**

1. Click **"Add New User"**
2. Fill in:
   - Full Name
   - Email
   - Role (Trainer/Manager/Admin)
   - Team (if not admin)
   - Reporting Manager (if trainer)
   - Password options
3. Click **"Create User"**

**Bulk Upload:**

1. Click **"Bulk Upload"**
2. Download CSV template
3. Fill in user data
4. Upload CSV file
5. Review validation
6. Import valid rows

#### 6. Audit Log Tab

**Activity Tracking:**
- All system activities logged
- Shows: Timestamp, User, Action Type, Target, Details, IP Address

**Filters:**
- Date range
- Action type
- Target type
- User

**Export:**
- Download audit log as CSV
- 1-year retention policy

### Managing Users

#### Creating a User

1. Go to **User Management** tab
2. Click **"Add New User"**
3. Fill in required information
4. Choose password option (auto-generate or manual)
5. Optionally send welcome email
6. Click **"Create User"**

#### Editing a User

1. Find user in table
2. Click **Edit** icon
3. Modify fields:
   - Full Name
   - Role (with confirmation)
   - Team
   - Reporting Manager
   - Status
4. Click **"Update User"**

#### Resetting Password

1. Edit the user
2. Click **"Reset Password"** button
3. New password will be generated
4. Share password securely with user

#### Deactivating a User

1. Find user in table
2. Click **Deactivate** icon (power off)
3. Confirm action
4. User will be unable to log in

### Viewing Reports

#### Exporting Data

1. Navigate to relevant tab
2. Apply filters if needed
3. Click **Export** button
4. Choose format (CSV/Excel)
5. Download file

#### Generating Reports

- **Trainer Performance:** Export individual or bulk
- **Manager Activity:** Export activity reports
- **Audit Logs:** Export for compliance
- **Assessment Data:** Export for analysis

### System Settings

Go to **Settings** page for:
- Platform configuration
- Email templates
- Notification settings
- Data retention policies

---

## Frequently Asked Questions

### General Questions

**Q: How do I log in?**
A: Use the email and password provided by your administrator. If you forgot your password, contact support.

**Q: Can I change my email?**
A: No, email changes must be done by an administrator. Contact support.

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). Mobile browsers are also supported.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored securely. We follow industry best practices for data protection.

### Manager Questions

**Q: Why can't I see certain trainers in the dropdown?**
A: You can only assess trainers from other teams. Your direct reports and team members are excluded to ensure objective feedback.

**Q: Can I edit an assessment after submitting?**
A: No, assessments cannot be edited after submission to maintain data integrity. Contact an admin if you made an error.

**Q: How often should I assess trainers?**
A: Regular assessments are recommended, ideally monthly. The system tracks your activity.

**Q: What if I make a mistake in an assessment?**
A: Contact an administrator who can help resolve the issue.

### Trainer Questions

**Q: How are my ratings calculated?**
A: Your overall rating is the average of all 6 parameters: (Parameter1 + Parameter2 + ... + Parameter6) / 6

**Q: Who can see my assessments?**
A: You can see your own assessments. Managers can see assessments they submitted. Admins can see all assessments.

**Q: How do I improve my ratings?**
A: Review feedback regularly, focus on areas for improvement, ask your manager for guidance, and set improvement goals.

**Q: What if I disagree with an assessment?**
A: Discuss your concerns with your manager or contact an administrator.

### Admin Questions

**Q: How do I create the first admin user?**
A: Use the signup page or create directly in Supabase, then update the profile role to 'admin'.

**Q: How do I backup the database?**
A: Supabase automatically backs up your database. You can also export data manually through the admin dashboard.

**Q: How do I set up email notifications?**
A: Follow the `EMAIL_TEMPLATES.md` guide to configure email service and templates.

**Q: Can I customize the platform?**
A: Yes, you can customize branding, colors, and email templates. Contact your development team for advanced customizations.

---

## Troubleshooting

### Login Issues

**Problem:** Can't log in
- **Check:** Email and password are correct
- **Check:** Caps Lock is off
- **Check:** Account is active (not deactivated)
- **Solution:** Contact administrator to reset password

**Problem:** "Invalid credentials" error
- **Check:** Email is correct
- **Check:** Password hasn't changed
- **Solution:** Request password reset from administrator

### Dashboard Not Loading

**Problem:** Dashboard shows loading forever
- **Check:** Internet connection
- **Check:** Browser console for errors (F12)
- **Solution:** Refresh page, clear browser cache, try different browser

### Assessment Form Issues

**Problem:** Can't submit assessment
- **Check:** All required fields are filled
- **Check:** Comments are 20-500 characters
- **Check:** All ratings are selected
- **Solution:** Review form for validation errors (shown in red)

**Problem:** Trainer not in dropdown
- **Check:** Trainer is from different team
- **Check:** Trainer is not your direct report
- **Solution:** Only cross-team trainers are available

### Performance Issues

**Problem:** Dashboard loads slowly
- **Check:** Internet connection speed
- **Check:** Date range filter (try smaller range)
- **Solution:** Wait for data to load, or contact support if persistent

### Data Not Showing

**Problem:** No assessments in history
- **Check:** Date range filter
- **Check:** You have received assessments
- **Solution:** Adjust filters or contact administrator

### Still Need Help?

1. **Check this guide** for common solutions
2. **Contact your administrator** for account issues
3. **Contact support** for technical issues:
   - Email: support@trainingassessment.com
   - Include: Your role, issue description, screenshots if possible

---

## Tips for Success

### For Managers:
- ✅ Assess regularly (monthly recommended)
- ✅ Provide specific, constructive feedback
- ✅ Be objective and professional
- ✅ Submit assessments promptly after observations

### For Trainers:
- ✅ Review feedback regularly
- ✅ Focus on areas for improvement
- ✅ Celebrate your strengths
- ✅ Set improvement goals
- ✅ Discuss feedback with your manager

### For Admins:
- ✅ Monitor platform activity regularly
- ✅ Review audit logs periodically
- ✅ Keep user data up to date
- ✅ Respond to support requests promptly
- ✅ Backup data regularly

---

**Thank you for using the Training Assessment Platform!** 🎉

For technical support or deployment questions, see `DEPLOYMENT.md` or `README.md`.

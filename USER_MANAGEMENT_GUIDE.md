# User Management System Guide

Complete guide to the comprehensive User Management system for administrators.

## 🎯 Overview

The User Management system provides administrators with complete control over all users (managers, trainers, and admins) in the platform. It includes user creation, editing, bulk operations, organizational structure visualization, and comprehensive filtering and search capabilities.

## 📊 Features

### User Management Tab

#### Top Statistics Cards (5 cards)
- **Total Users** - Count of all users in the system
- **Managers** - Total number of managers
- **Trainers** - Total number of trainers
- **Admins** - Total number of administrators
- **Active This Month** - Users created this month

#### Action Bar
- **Add New User** - Opens modal to create individual user
- **Bulk Upload** - CSV upload for multiple users
- **Org Structure** - Visual organizational hierarchy
- **Download Template** - CSV template for bulk uploads
- **Search Box** - Search by name or email

#### Filters
- **Role Filter** - All, Admin, Manager, Trainer
- **Team Filter** - All teams or specific team
- **Status Filter** - All, Active, Inactive

#### Users Table
- **Bulk Selection** - Checkboxes for batch operations
- **Avatar/Initials** - Colored circle with user initials
- **Full Name** - User's full name
- **Email** - User's email address
- **Role** - Color-coded badge (blue=admin, green=manager, purple=trainer)
- **Team** - User's team assignment
- **Reporting Manager** - For trainers only
- **Status** - Active/Inactive badge
- **Created Date** - Account creation date
- **Actions** - View Details, Edit, Activate/Deactivate
- **Sortable Columns** - Click headers to sort
- **Pagination** - 20 users per page

## 🔧 Components

### 1. Add User Modal (`AddUserModal.tsx`)
**Features:**
- Full name input (required)
- Email input with validation (required, unique)
- Role selection (Trainer, Manager, Admin)
- Team selection (required for managers/trainers)
- Reporting Manager selection (required for trainers, filtered by team)
- Auto-generate password option (default: checked)
- Manual password input (if not auto-generated)
- Send welcome email option
- Real-time validation
- Error messages
- Loading states

**Validation:**
- Email format check
- Email uniqueness check
- Team required for non-admins
- Reporting manager required for trainers
- Password strength (if manual)

### 2. Edit User Modal (`EditUserModal.tsx`)
**Features:**
- Pre-filled form with current user data
- Editable fields:
  - Full Name
  - Role (with confirmation warning)
  - Team
  - Reporting Manager
  - Status (Active/Inactive)
- Read-only fields:
  - Email (cannot be changed)
  - Created date
  - Last updated date
- Password reset button
- Role change warning dialog
- Self-edit restrictions (cannot change own role)

**Role Change Warning:**
- Shows when changing between trainer and manager roles
- Warns about impact on reporting relationships
- Requires confirmation to proceed

### 3. Bulk Upload Modal (`BulkUploadModal.tsx`)
**Features:**
- Drag & drop CSV upload
- Click to browse file
- CSV format instructions
- Download template button
- Preview table with validation
- Color-coded rows:
  - Green: Valid rows
  - Red: Invalid rows with errors
- Validation results per row
- Import valid rows only
- Progress bar during import
- Import summary:
  - Success count
  - Failure count
  - Error details
  - Download error report

**CSV Format:**
```
full_name,email,role,team_name,reporting_manager_email
John Doe,john.doe@example.com,trainer,Sales Team,manager1@test.com
Jane Smith,jane.smith@example.com,manager,Marketing Team,
```

### 4. User Detail Modal (`UserDetailModal.tsx`)
**Features:**
- User info card with avatar
- Role badge
- Contact information
- Team and reporting manager
- Status indicator
- Activity statistics:
  - For Trainers: Assessments received, average rating, trend
  - For Managers: Assessments submitted, average rating given
- Recent assessment history (last 10)
- Export report button
- Send message button

### 5. Reporting Structure (`ReportingStructure.tsx`)
**Features:**
- Visual organizational tree
- Teams at top level
- Managers under teams
- Trainers under managers
- Expandable/collapsible nodes
- Color-coded by role
- Orphaned trainers section (highlighted)
- Summary statistics
- Click user to edit
- Visual connecting lines

### 6. User Management Tab (`UserManagement.tsx`)
**Main Component Features:**
- Integrates all modals
- Manages user list state
- Handles filtering and sorting
- Pagination
- Bulk selection
- Status toggling
- Search functionality

## 🗄️ Database Functions

### User Utilities (`src/utils/userManagement.ts`)

#### Fetching
- `fetchAllUsers(filters)` - Get all users with filters
- `fetchUserStats()` - Get user statistics
- `getAvailableManagers(teamId)` - Get managers for a team
- `getReportingStructure()` - Build organizational tree

#### User Operations
- `createUser(userData, currentUserId)` - Create new user
- `updateUser(userId, updates, currentUserId)` - Update user
- `deactivateUser(userId)` - Deactivate user
- `activateUser(userId)` - Activate user
- `resetUserPassword(userId)` - Generate new password

#### Bulk Operations
- `bulkCreateUsers(users[], currentUserId)` - Create multiple users
- `validateUserData(data, isUpdate, userId)` - Validate user data
- `checkEmailUnique(email, excludeUserId)` - Check email uniqueness

#### CSV Operations
- `generateCSVTemplate()` - Generate CSV template
- `downloadCSVTemplate()` - Download template file
- `parseCSV(csvText)` - Parse CSV content
- `validateCSVRow(row, headers, rowIndex)` - Validate CSV row

#### Utilities
- `generatePassword()` - Generate random strong password

## 🔒 Security & Permissions

### Access Control
- Only admins can access user management
- Protected by role-based routing
- Admin-only API endpoints

### Self-Protection
- Admins cannot delete themselves
- Admins cannot change their own role
- Self-edit restrictions enforced

### Validation Rules
- Email must be unique across platform
- Email must be valid format
- Trainers must have reporting manager
- Reporting manager must be from same team
- Reporting manager must have role = 'manager'
- Team required for managers and trainers
- Role changes require confirmation
- Cannot delete users (only deactivate)

### Audit Trail
- Tracks last modified by (when audit table implemented)
- Logs all user management actions
- Confirmation required for destructive actions

## 📋 Validation Rules

### Email Validation
- Must be valid email format
- Must be unique (checked against database)
- Case-insensitive comparison

### Password Validation (Manual)
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Special characters recommended

### Role-Specific Rules
- **Admin**: No team or reporting manager required
- **Manager**: Team required, no reporting manager
- **Trainer**: Team and reporting manager required

### Team Validation
- Team must exist in database
- Team name must match exactly (case-sensitive)

### Reporting Manager Validation
- Must be a manager
- Must be from same team as trainer
- Must exist in database

## 🎨 UI/UX Features

### Design
- Professional, clean interface
- Consistent color scheme
- Color-coded roles and statuses
- Gradient cards for metrics
- Smooth animations
- Modal overlays

### Responsiveness
- Mobile-friendly layout
- Responsive tables with horizontal scroll
- Adaptive grid layouts
- Touch-friendly interactions
- Works on tablets

### Accessibility
- Keyboard navigation (Esc to close, Enter to submit)
- ARIA labels
- Screen reader support
- High contrast colors
- Focus indicators

### User Experience
- Loading states for all operations
- Success/error toast notifications
- Clear error messages
- Helpful empty states
- Tooltips for complex features
- Intuitive workflows
- Confirmation dialogs for destructive actions

## 🚀 Usage

### Adding a New User
1. Click "Add New User" button
2. Fill in required fields
3. Select role, team, and reporting manager (if trainer)
4. Choose password option
5. Click "Create User"
6. User is created and welcome email sent (if enabled)

### Editing a User
1. Click "Edit" icon on user row
2. Modify fields as needed
3. Confirm role change if applicable
4. Click "Update User"
5. Changes are saved immediately

### Bulk Upload
1. Click "Bulk Upload" button
2. Download template (optional)
3. Fill CSV with user data
4. Upload CSV file
5. Review validation results
6. Click "Import Valid Rows"
7. Review import summary

### Viewing User Details
1. Click "View Details" icon on user row
2. See user information and activity
3. View assessment history
4. Export report or send message

### Organizational Structure
1. Click "Org Structure" button
2. View hierarchical tree
3. Expand/collapse nodes
4. Click user to edit
5. Identify orphaned trainers

### Filtering and Searching
1. Use search box for name/email
2. Select role filter
3. Select team filter
4. Select status filter
5. Results update automatically

### Bulk Operations
1. Select users with checkboxes
2. Use bulk action buttons
3. Confirm action
4. Multiple users updated at once

## 📊 Key Insights

### User Statistics
- Total user count
- Role distribution
- Active users this month
- Team distribution

### Organizational Health
- Orphaned trainers (no reporting manager)
- Managers with no trainers
- Team structure visualization
- Reporting relationships

### Activity Tracking
- User creation dates
- Last update dates
- Status changes
- Assessment activity

## 🔮 Future Enhancements

### Planned Features
- Export user list to Excel
- Advanced filtering (date range, custom fields)
- User activity heatmap
- Login tracking
- Batch operations (activate/deactivate multiple)
- User import history log
- Email templates customization
- Two-factor authentication setup
- User groups/permissions
- Custom user fields

## 💡 Tips

1. **Use Bulk Upload** - For adding multiple users at once
2. **Check Org Structure** - Regularly review for orphaned trainers
3. **Use Filters** - Narrow down large user lists quickly
4. **Validate Before Import** - Review CSV validation before importing
5. **Set Reporting Managers** - Ensure all trainers have managers
6. **Monitor Activity** - Check user details for activity levels
7. **Use Search** - Quick way to find specific users

## 🐛 Troubleshooting

### User Creation Fails
- Check email is unique
- Verify team exists
- Ensure reporting manager is valid
- Check password meets requirements

### Bulk Upload Errors
- Verify CSV format matches template
- Check team names match exactly
- Ensure manager emails are correct
- Review validation errors in preview

### Cannot Edit User
- Verify you're logged in as admin
- Check user exists
- Ensure you're not trying to edit yourself (for role changes)

### Org Structure Not Loading
- Check database connection
- Verify teams and profiles exist
- Check browser console for errors

---

**The User Management system is production-ready and provides comprehensive user administration capabilities!** 🎉

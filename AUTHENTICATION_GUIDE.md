# Authentication System Guide

This guide explains the complete authentication system implemented in the Training Assessment System.

## 🏗️ Architecture Overview

The authentication system uses:
- **Supabase Auth** for user authentication
- **React Context API** for state management
- **Protected Routes** for role-based access control
- **Profile fetching** from the `profiles` table after login

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Main authentication context
├── components/
│   ├── ProtectedRoute.tsx       # Route protection component
│   └── LoadingSpinner.tsx      # Loading indicator
├── pages/
│   ├── Login.tsx                # Login page
│   └── SignUp.tsx               # Sign up page
├── lib/
│   └── supabase.ts              # Supabase client configuration
└── types/
    └── index.ts                  # TypeScript types (includes Profile)
```

## 🔐 Authentication Flow

### 1. User Login
```
User enters credentials → AuthContext.signIn() → 
Supabase Auth validates → Fetch profile from database → 
Redirect based on role
```

### 2. User Sign Up
```
User fills form → AuthContext.signUp() → 
Create auth user → Create profile entry → 
Fetch profile → Redirect based on role
```

### 3. Protected Routes
```
User navigates → ProtectedRoute checks auth → 
Checks role permissions → Allow/Redirect
```

## 🎯 Key Features

### AuthContext (`src/contexts/AuthContext.tsx`)

Provides:
- `user` - Supabase user object
- `profile` - User profile from database (includes role, team, etc.)
- `session` - Current auth session
- `loading` - Loading state
- `signIn(email, password)` - Sign in function
- `signUp(email, password, fullName, role)` - Sign up function
- `signOut()` - Sign out function
- `refreshProfile()` - Refresh profile data

### ProtectedRoute Component

Usage:
```tsx
<ProtectedRoute allowedRoles={['manager', 'admin']}>
  <YourComponent />
</ProtectedRoute>
```

Features:
- Automatically redirects to login if not authenticated
- Checks role permissions
- Shows loading spinner during auth check
- Redirects to appropriate dashboard if role doesn't match

### Role-Based Routing

After login, users are redirected based on their role:
- **Admin** → `/admin/dashboard`
- **Manager** → `/manager/dashboard`
- **Trainer** → `/trainer/dashboard`

## 📝 Usage Examples

### Using AuthContext in Components

```tsx
import { useAuthContext } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, profile, signOut, loading } = useAuthContext()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <p>Welcome, {profile?.full_name}</p>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Creating Protected Routes

```tsx
// Only managers can access
<Route
  path="/manager/dashboard"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <ManagerDashboard />
    </ProtectedRoute>
  }
/>

// Only admins can access
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## 🔒 Security Features

1. **Row Level Security (RLS)**: All database queries respect Supabase RLS policies
2. **Role-Based Access**: Routes are protected by user role
3. **Session Management**: Automatic session refresh and persistence
4. **Profile Validation**: Profile must exist for protected routes

## 🎨 UI Features

### Login Page
- Beautiful gradient background
- Professional form styling
- Error message display
- Loading states
- Auto-redirect if already logged in
- Link to sign up page

### Sign Up Page
- Full form validation
- Password confirmation
- Role selection
- Real-time error feedback
- Password match indicator
- Link to login page

## 🚀 Getting Started

### 1. Set Up Supabase

1. Create a Supabase project
2. Run the database schema script (`supabase-schema.sql`)
3. Add your credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

### 2. Create First User

Option 1: Via Sign Up Page
- Go to `/signup`
- Fill in the form
- Select "Admin" role
- Account and profile will be created automatically

Option 2: Via Supabase Dashboard
- Go to Authentication → Users
- Create user manually
- Then create profile entry in database

### 3. Test Authentication

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. You'll be redirected to `/login`
4. Sign in with your credentials
5. You'll be redirected to your role's dashboard

## 🐛 Troubleshooting

### "Profile not found" error
- Make sure the user has a profile entry in the `profiles` table
- Check that the profile `id` matches the auth user `id`

### "Permission denied" errors
- Check RLS policies in Supabase
- Verify user role in profile table
- Ensure user is authenticated

### Redirect loops
- Check that routes are properly configured
- Verify ProtectedRoute is working
- Check browser console for errors

### Sign up fails
- Check Supabase Auth settings (email confirmation might be enabled)
- Verify database schema is set up correctly
- Check browser console for detailed errors

## 📊 Profile Data Structure

```typescript
interface Profile {
  id: string                    // Matches auth.users.id
  full_name: string
  role: 'admin' | 'manager' | 'trainer'
  team_id: string | null
  reporting_manager_id: string | null
  created_at: string
  updated_at: string
}
```

## 🔄 Session Management

- Sessions are automatically persisted in localStorage
- Sessions refresh automatically
- Sign out clears all session data
- Auth state is synced across browser tabs

## 💡 Best Practices

1. **Always check loading state** before accessing user/profile data
2. **Use ProtectedRoute** for all authenticated pages
3. **Check profile exists** before accessing role-specific features
4. **Handle errors gracefully** - show user-friendly messages
5. **Refresh profile** after role changes in database

## 🎯 Next Steps

1. Add password reset functionality
2. Add email verification flow
3. Add "Remember me" option
4. Add social login (Google, GitHub, etc.)
5. Add two-factor authentication
6. Add session timeout handling

---

**Need Help?**
- Check Supabase Auth docs: https://supabase.com/docs/guides/auth
- Review the code comments in AuthContext.tsx
- Check browser console for detailed error messages

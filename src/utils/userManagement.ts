import { supabase } from '@/lib/supabase'
import {
  UserForManagement,
  UserStats,
  CreateUserData,
  UpdateUserData,
  ValidationResult,
  BulkCreateResult,
  OrgTree,
  OrgTreeNode,
} from '@/types'

/**
 * Generate a random strong password
 */
export const generatePassword = (): string => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Check if email is unique
 */
export const checkEmailUnique = async (email: string, excludeUserId?: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (error) throw error

  if (!data || data.length === 0) return true
  if (excludeUserId && data[0].id === excludeUserId) return true
  return false
}

/**
 * Validate user data
 */
export const validateUserData = async (
  data: CreateUserData | UpdateUserData,
  isUpdate: boolean = false,
  userId?: string
): Promise<ValidationResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  // Email validation
  if ('email' in data && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    } else {
      const isUnique = await checkEmailUnique(data.email, userId)
      if (!isUnique) {
        errors.push('Email already exists')
      }
    }
  }

  // Full name validation
  if ('full_name' in data && data.full_name) {
    if (data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters')
    }
  }

  // Role validation
  if ('role' in data && data.role) {
    if (!['admin', 'manager', 'trainer'].includes(data.role)) {
      errors.push('Invalid role')
    }
  }

  // Team validation (required for managers and trainers)
  if ('role' in data && data.role && data.role !== 'admin') {
    if (!('team_id' in data) || !data.team_id) {
      errors.push('Team is required for managers and trainers')
    }
  }

  // Reporting manager validation (required for trainers)
  if ('role' in data && data.role === 'trainer') {
    if (!('reporting_manager_id' in data) || !data.reporting_manager_id) {
      errors.push('Reporting manager is required for trainers')
    }
  }

  // Password validation (if manual)
  if ('password' in data && data.password && !data.auto_generate_password) {
    if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data.password)) {
      errors.push('Password must contain uppercase, lowercase, and number')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Fetch all users with filters
 */
export const fetchAllUsers = async (filters?: {
  role?: string
  team_id?: string
  status?: string
  search?: string
}): Promise<UserForManagement[]> => {
  let query = supabase
    .from('profiles')
    .select('id, full_name, role, team_id, reporting_manager_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (filters?.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters?.team_id && filters.team_id !== 'all') {
    query = query.eq('team_id', filters.team_id)
  }

  const { data: usersData, error } = await query

  if (error) throw error

  if (!usersData || usersData.length === 0) {
    return []
  }

  // Fetch teams and reporting managers separately
  const teamIds = [...new Set(usersData.map((u: any) => u.team_id).filter(Boolean))]
  const managerIds = [...new Set(usersData.map((u: any) => u.reporting_manager_id).filter(Boolean))]

  let teamMap = new Map<string, any>()
  let managerMap = new Map<string, any>()

  if (teamIds.length > 0) {
    let query = supabase.from('teams').select('id, team_name')
    const { data: teams, error: teamsError } = teamIds.length === 1
      ? await query.eq('id', teamIds[0])
      : await query.in('id', teamIds)
    if (!teamsError && teams) {
      const teamsArray = Array.isArray(teams) ? teams : [teams]
      teamsArray.forEach((team: any) => {
        teamMap.set(team.id, team)
      })
    }
  }

  if (managerIds.length > 0) {
    let query = supabase.from('profiles').select('id, full_name')
    const { data: managers, error: managersError } = managerIds.length === 1
      ? await query.eq('id', managerIds[0])
      : await query.in('id', managerIds)
    
    if (!managersError && managers) {
      const managersArray = Array.isArray(managers) ? managers : [managers]
      managersArray.forEach((manager: any) => {
        managerMap.set(manager.id, manager)
      })
    }
  }

  // Apply search filter if provided
  let filteredData = usersData
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredData = filteredData.filter((profile: any) => {
      // Search by name only (email requires admin API which needs service role key)
      return profile.full_name.toLowerCase().includes(searchLower)
    })
  }

  // Note: We can't use supabase.auth.admin.listUsers() from the client (requires service role key)
  // Instead, we'll get emails from a database function or skip email display
  // For now, we'll work with profiles only and note that email fetching requires backend

  const users: UserForManagement[] = filteredData.map((profile: any) => {
    // Email fetching requires service role key, so we'll use a placeholder
    // In production, you'd want to create a database function or use backend API
    const email = 'N/A' // Would need backend API or database function to get email
    const status = 'active' // Default to active (can't check banned status without admin API)
    const team = profile.team_id ? teamMap.get(profile.team_id) : null
    const manager = profile.reporting_manager_id ? managerMap.get(profile.reporting_manager_id) : null

    return {
      id: profile.id,
      email,
      full_name: profile.full_name,
      role: profile.role,
      team_id: profile.team_id,
      team_name: team?.team_name || null,
      reporting_manager_id: profile.reporting_manager_id,
      reporting_manager_name: manager?.full_name || null,
      status: status as 'active' | 'inactive',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_modified_by: null, // Would need audit log table
    }
  })

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    return users.filter((u) => u.status === filters.status)
  }

  return users
}

/**
 * Fetch user statistics
 */
export const fetchUserStats = async (): Promise<UserStats> => {
  const { data: profiles } = await supabase.from('profiles').select('role, created_at')

  if (!profiles) {
    return {
      totalUsers: 0,
      totalManagers: 0,
      totalTrainers: 0,
      totalAdmins: 0,
      activeUsersThisMonth: 0,
    }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats: UserStats = {
    totalUsers: profiles.length,
    totalManagers: profiles.filter((p) => p.role === 'manager').length,
    totalTrainers: profiles.filter((p) => p.role === 'trainer').length,
    totalAdmins: profiles.filter((p) => p.role === 'admin').length,
    activeUsersThisMonth: profiles.filter(
      (p) => new Date(p.created_at) >= monthStart
    ).length,
  }

  return stats
}

/**
 * Create a new user
 */
export const createUser = async (
  userData: CreateUserData,
  currentUserId: string
): Promise<UserForManagement> => {
  // Validate data
  const validation = await validateUserData(userData)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Generate password if needed
  const password = userData.auto_generate_password
    ? generatePassword()
    : userData.password || generatePassword()

  // Create auth user (requires service role key)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: userData.full_name,
      role: userData.role,
    },
  })

  if (authError) {
    if (authError.status === 403 || authError.message.includes('Forbidden')) {
      throw new Error('Admin operations require service role key. Please configure VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file, or use backend API endpoints.')
    }
    throw authError
  }
  if (!authData.user) throw new Error('Failed to create auth user')

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name: userData.full_name,
    role: userData.role,
    team_id: userData.team_id,
    reporting_manager_id: userData.reporting_manager_id,
  })

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    try {
      await supabase.auth.admin.deleteUser(authData.user.id)
    } catch (deleteError) {
      console.error('Failed to rollback auth user creation:', deleteError)
      // Continue anyway - profile creation failed but auth user exists
    }
    throw profileError
  }

  // Send welcome email if requested (would need email service integration)
  if (userData.send_welcome_email) {
    // TODO: Implement email sending
    console.log('Would send welcome email to:', userData.email, 'with password:', password)
  }

  // Fetch created user
  const users = await fetchAllUsers()
  const createdUser = users.find((u) => u.id === authData.user.id)

  if (!createdUser) throw new Error('Failed to fetch created user')

  return createdUser
}

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  updates: UpdateUserData,
  currentUserId: string
): Promise<UserForManagement> => {
  // Validate data
  const validation = await validateUserData(updates, true, userId)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.full_name,
      role: updates.role,
      team_id: updates.team_id,
      reporting_manager_id: updates.reporting_manager_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error

  // Update auth user status if needed
  if (updates.status !== undefined) {
    if (updates.status === 'inactive') {
      // Ban user (deactivate)
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h', // ~100 years (effectively permanent)
      })
    } else {
      // Unban user (activate)
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      })
    }
  }

  // Fetch updated user
  const users = await fetchAllUsers()
  const updatedUser = users.find((u) => u.id === userId)

  if (!updatedUser) throw new Error('Failed to fetch updated user')

  return updatedUser
}

/**
 * Deactivate user
 */
export const deactivateUser = async (userId: string): Promise<void> => {
  await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
  })
}

/**
 * Activate user
 */
export const activateUser = async (userId: string): Promise<void> => {
  await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })
}

/**
 * Reset user password
 */
export const resetUserPassword = async (userId: string): Promise<string> => {
  const newPassword = generatePassword()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw error

  // TODO: Send password reset email
  console.log('New password generated for user:', userId)

  return newPassword
}

/**
 * Get available managers for a team
 */
export const getAvailableManagers = async (teamId: string | null): Promise<UserForManagement[]> => {
  if (!teamId) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'manager')
    .eq('team_id', teamId)

  if (error) throw error

  return (data || []).map((m) => ({
    id: m.id,
    email: '',
    full_name: m.full_name,
    role: 'manager' as const,
    team_id: teamId,
    team_name: null,
    reporting_manager_id: null,
    reporting_manager_name: null,
    status: 'active' as const,
    created_at: '',
    updated_at: '',
    last_modified_by: null,
  }))
}

/**
 * Get reporting structure (org tree)
 */
export const getReportingStructure = async (): Promise<OrgTree> => {
  // Fetch all teams
  const { data: teams } = await supabase.from('teams').select('id, team_name').order('team_name')

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, team_id, reporting_manager_id')
    .in('role', ['manager', 'trainer'])

  if (!teams || !profiles) {
    return { teams: [], orphaned: [] }
  }

  // Fetch team names separately
  const teamIdsFromProfiles = [...new Set(profiles.map((p: any) => p.team_id).filter(Boolean))]
  let teamNameMap = new Map<string, string>()
  
  if (teamIdsFromProfiles.length > 0) {
    let query = supabase.from('teams').select('id, team_name')
    const { data: allTeams, error: teamsError } = teamIdsFromProfiles.length === 1
      ? await query.eq('id', teamIdsFromProfiles[0])
      : await query.in('id', teamIdsFromProfiles)
    
    if (!teamsError && allTeams) {
      const teamsArray = Array.isArray(allTeams) ? allTeams : [allTeams]
      teamsArray.forEach((t: any) => {
        teamNameMap.set(t.id, t.team_name)
      })
    }
  }

  const orgTree: OrgTree = {
    teams: [],
    orphaned: [],
  }

  // Build tree for each team
  for (const team of teams) {
    const teamManagers = profiles.filter(
      (p: any) => p.role === 'manager' && p.team_id === team.id
    )

    const managers: OrgTreeNode[] = teamManagers.map((manager: any) => {
      const managerTrainers = profiles.filter(
        (p: any) => p.role === 'trainer' && p.reporting_manager_id === manager.id
      )

      const trainers: OrgTreeNode[] = managerTrainers.map((trainer: any) => ({
        id: trainer.id,
        name: trainer.full_name,
        role: 'trainer',
        team_id: trainer.team_id,
        team_name: trainer.team_id ? teamNameMap.get(trainer.team_id) || null : null,
      }))

      return {
        id: manager.id,
        name: manager.full_name,
        role: 'manager',
        team_id: manager.team_id,
        team_name: team.team_name,
        children: trainers,
      }
    })

    orgTree.teams.push({
      id: team.id,
      name: team.team_name,
      managers,
    })
  }

  // Find orphaned trainers (no reporting manager or manager from different team)
  const allTrainers = profiles.filter((p: any) => p.role === 'trainer')
  const orphaned = allTrainers
    .filter((trainer: any) => {
      if (!trainer.reporting_manager_id) return true
      const manager = profiles.find((p: any) => p.id === trainer.reporting_manager_id)
      return !manager || manager.team_id !== trainer.team_id
    })
    .map((trainer: any) => ({
      id: trainer.id,
      name: trainer.full_name,
      role: 'trainer' as const,
      team_id: trainer.team_id,
      team_name: trainer.team_id ? teamNameMap.get(trainer.team_id) || null : null,
      isOrphaned: true,
    }))

  orgTree.orphaned = orphaned

  return orgTree
}

/**
 * Bulk create users from CSV data
 */
export const bulkCreateUsers = async (
  users: CreateUserData[],
  currentUserId: string
): Promise<BulkCreateResult> => {
  const result: BulkCreateResult = {
    success: 0,
    failed: 0,
    errors: [],
    warnings: [],
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    try {
      await createUser(user, currentUserId)
      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push({
        row: i + 2, // +2 because row 1 is header, and arrays are 0-indexed
        email: user.email,
        error: error.message || 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Generate CSV template
 */
export const generateCSVTemplate = (): string => {
  const headers = ['full_name', 'email', 'role', 'team_name', 'reporting_manager_email']
  const examples = [
    ['John Doe', 'john.doe@example.com', 'trainer', 'Sales Team', 'manager1@test.com'],
    ['Jane Smith', 'jane.smith@example.com', 'manager', 'Marketing Team', ''],
    ['Bob Johnson', 'bob.johnson@example.com', 'trainer', 'Sales Team', 'manager1@test.com'],
  ]

  const csv = [headers.join(','), ...examples.map((row) => row.join(','))].join('\n')
  return csv
}

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
  const csv = generateCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user_upload_template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Parse CSV file
 */
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n').filter((line) => line.trim())
  return lines.map((line) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  })
}

/**
 * Validate CSV row
 */
export const validateCSVRow = (
  row: string[],
  headers: string[],
  rowIndex: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const data: Record<string, string> = {}

  headers.forEach((header, index) => {
    data[header] = row[index] || ''
  })

  // Required fields
  if (!data.full_name?.trim()) {
    errors.push('Full name is required')
  }
  if (!data.email?.trim()) {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }
  }
  if (!data.role?.trim()) {
    errors.push('Role is required')
  } else if (!['admin', 'manager', 'trainer'].includes(data.role.toLowerCase())) {
    errors.push('Role must be admin, manager, or trainer')
  }

  // Team required for non-admins
  if (data.role?.toLowerCase() !== 'admin' && !data.team_name?.trim()) {
    errors.push('Team is required for managers and trainers')
  }

  // Reporting manager required for trainers
  if (data.role?.toLowerCase() === 'trainer' && !data.reporting_manager_email?.trim()) {
    errors.push('Reporting manager email is required for trainers')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

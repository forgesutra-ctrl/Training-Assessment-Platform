// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'trainer' | 'trainee'
  createdAt: string
}

// Profile type (matches database schema)
export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'manager' | 'trainer'
  team_id: string | null
  reporting_manager_id: string | null
  created_at: string
  updated_at: string
}

// Extended user with profile data
export interface UserWithProfile extends User {
  profile: Profile | null
}

// Training types
export interface Training {
  id: string
  title: string
  description: string
  trainerId: string
  startDate: string
  endDate: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: string
}

// Assessment types (matches database schema)
export interface ManagerAssessment {
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

// Assessment with related data
export interface AssessmentWithDetails extends ManagerAssessment {
  trainer_name: string
  assessor_name: string
  average_score: number
}

// Trainer Performance Types
export interface ParameterAverage {
  parameter: string
  average: number
  count: number
}

export interface TrainerStats {
  currentMonthAverage: number
  totalAssessments: number
  bestParameter: ParameterAverage
  worstParameter: ParameterAverage
  parameterAverages: ParameterAverage[]
  lastAssessmentDate: string | null
}

export interface TrendDataPoint {
  month: string
  average: number
  count: number
}

export interface TrainerAssessmentWithDetails extends AssessmentWithDetails {
  assessor_name: string
  assessor_id: string
}

// Admin Dashboard Types
export interface PlatformStats {
  totalTrainers: number
  totalAssessmentsThisMonth: number
  platformAverageRating: number
  assessmentActivityRate: number
}

export interface TrainerWithStats {
  id: string
  full_name: string
  team_name: string | null
  reporting_manager_name: string | null
  current_month_avg: number
  quarter_avg: number
  ytd_avg: number
  all_time_avg: number
  total_assessments: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
}

export interface ManagerActivity {
  id: string
  full_name: string
  team_name: string | null
  assessments_this_month: number
  assessments_this_quarter: number
  assessments_this_year: number
  all_time_total: number
  avg_rating_given: number
  unique_trainers_assessed: number
  last_assessment_date: string | null
  activity_status: 'active' | 'inactive'
}

export interface MonthlyTrend {
  month: string
  average_rating: number
  assessment_count: number
  trainers_assessed: number
  parameter_averages: {
    trainers_readiness: number
    communication_skills: number
    domain_expertise: number
    knowledge_displayed: number
    people_management: number
    technical_skills: number
  }
}

export interface QuarterlyData {
  quarter: string
  average_rating: number
  assessment_count: number
  year: number
}

export interface CrossAssessmentMatrix {
  manager_id: string
  manager_name: string
  team_assessments: Record<string, number>
}

export interface HeatmapData {
  date: string
  count: number
}

export interface RecentActivity {
  id: string
  assessor_name: string
  trainer_name: string
  assessment_date: string
  average_score: number
  created_at: string
}

export interface TopPerformer {
  trainer_id: string
  trainer_name: string
  team_name: string | null
  average_rating: number
  assessment_count: number
}

// User Management Types
export interface UserForManagement {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'trainer'
  team_id: string | null
  team_name: string | null
  reporting_manager_id: string | null
  reporting_manager_name: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  last_modified_by: string | null
}

export interface UserStats {
  totalUsers: number
  totalManagers: number
  totalTrainers: number
  totalAdmins: number
  activeUsersThisMonth: number
}

export interface CreateUserData {
  full_name: string
  email: string
  role: 'admin' | 'manager' | 'trainer'
  team_id: string | null
  reporting_manager_id: string | null
  password?: string
  auto_generate_password: boolean
  send_welcome_email: boolean
}

export interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'manager' | 'trainer'
  team_id?: string | null
  reporting_manager_id?: string | null
  status?: 'active' | 'inactive'
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BulkCreateResult {
  success: number
  failed: number
  errors: Array<{ row: number; email: string; error: string }>
  warnings: Array<{ row: number; email: string; warning: string }>
}

export interface OrgTreeNode {
  id: string
  name: string
  role: 'admin' | 'manager' | 'trainer'
  team_id: string | null
  team_name: string | null
  children?: OrgTreeNode[]
  isOrphaned?: boolean
}

export interface OrgTree {
  teams: Array<{
    id: string
    name: string
    managers: OrgTreeNode[]
  }>
  orphaned: OrgTreeNode[]
}

// Gamification Types
export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge: Badge
}

export interface Goal {
  id: string
  user_id: string
  type: 'overall_rating' | 'parameter' | 'assessment_count'
  target_value: number | null
  target_parameter: string | null
  deadline: string | null
  status: 'active' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at: string | null
  created_by: string | null
  description: string | null
  progress?: number
}

export interface UserXP {
  user_id: string
  total_xp: number
  current_level: number
  level_xp: number
  level_up_at: string | null
  updated_at: string
  xp_for_next_level: number
  progress_to_next_level: number
}

export interface XPHistory {
  id: string
  user_id: string
  xp_amount: number
  source: string
  source_id: string | null
  description: string | null
  created_at: string
}

export interface Streak {
  user_id: string
  type: 'improvement' | 'assessment_received' | 'consistency'
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  streak_start_date: string | null
  updated_at: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  team_name: string | null
  score: number
  metric: string
  is_current_user?: boolean
}

export interface LeaderboardPreference {
  user_id: string
  opt_in: boolean
  show_name: boolean
  updated_at: string
}

export interface DashboardWidget {
  id: string
  user_id: string
  widget_type: string
  position: number
  visible: boolean
  config: Record<string, any> | null
  created_at: string
}

export interface Kudos {
  id: string
  from_user_id: string
  to_user_id: string
  from_user_name?: string
  message: string | null
  type: 'appreciation' | 'tip' | 'celebration'
  created_at: string
}

// Legacy Assessment types (for future use)
export interface Assessment {
  id: string
  trainingId: string
  title: string
  questions: Question[]
  passingScore: number
  createdAt: string
}

export interface Question {
  id: string
  text: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer: string | string[]
  points: number
}

// Result types
export interface AssessmentResult {
  id: string
  assessmentId: string
  userId: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  submittedAt: string
  answers: Answer[]
}

export interface Answer {
  questionId: string
  answer: string | string[]
  isCorrect: boolean
  points: number
}

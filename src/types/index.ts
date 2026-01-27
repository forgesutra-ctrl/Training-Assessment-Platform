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

// Assessment Structure: 21 Parameters in 5 Categories
export const ASSESSMENT_STRUCTURE = {
  categories: [
    {
      id: 'trainer_readiness',
      name: 'Trainer Initial Readiness',
      color: 'blue',
      icon: '🎯',
      parameters: [
        { id: 'logs_in_early', label: 'Early Login', description: 'Trainer logs in a few minutes before the session to host the participants' },
        { id: 'video_always_on', label: 'Video Always On', description: 'Trainer on video at all times for the training' },
        { id: 'minimal_disturbance', label: 'Minimal Disturbance', description: 'Trainer ensured minimal / zero background disturbance' },
        { id: 'presentable_prompt', label: 'Presentable & Prompt', description: 'Trainer looks presentable and prompt for the training session' },
        { id: 'ready_with_tools', label: 'Ready with Tools', description: 'Trainer is ready with content and tools needed for the session with no struggle during screen share' }
      ]
    },
    {
      id: 'expertise_delivery',
      name: 'Trainer Expertise & Delivery',
      color: 'green',
      icon: '📚',
      parameters: [
        { id: 'adequate_knowledge', label: 'Subject Knowledge', description: 'Trainer demonstrated adequate knowledge of the subject' },
        { id: 'simplifies_topics', label: 'Simplifies Topics', description: 'Trainer was able to simplify complex topics and explain in simple terms for ease of participants\' understanding' },
        { id: 'encourages_participation', label: 'Encourages Participation', description: 'Trainer encouraged participation' },
        { id: 'handles_questions', label: 'Handles Questions', description: 'Trainer encouraged questions from the participants and provided real-time responses' },
        { id: 'provides_context', label: 'Provides Context', description: 'Trainer was able to provide context to learning material and relate to BU / Production requirements' }
      ]
    },
    {
      id: 'engagement_interaction',
      name: 'Participant Engagement & Interaction',
      color: 'purple',
      icon: '👥',
      parameters: [
        { id: 'maintains_attention', label: 'Maintains Attention', description: 'Trainer kept every participants attention to the session' },
        { id: 'uses_interactive_tools', label: 'Uses Interactive Tools', description: 'Trainer engaged participants with quiz / polls / activities' },
        { id: 'assesses_learning', label: 'Assesses Learning', description: 'Trainer called out to participants to assess learning or confirm understanding' },
        { id: 'clear_speech', label: 'Clear Speech', description: 'Trainer maintained clarity of speech and acceptable rate of speech' }
      ]
    },
    {
      id: 'communication',
      name: 'Communication Skills',
      color: 'orange',
      icon: '💬',
      parameters: [
        { id: 'minimal_grammar_errors', label: 'Grammar & Language', description: 'Trainer spoke well with little / no grammatical errors' },
        { id: 'professional_tone', label: 'Professional Tone', description: 'Trainer sounded energetic and maintained a professional tone throughout the session' },
        { id: 'manages_teams_well', label: 'Manages Teams', description: 'Trainer displayed efficiency to manage Teams' }
      ]
    },
    {
      id: 'technical_acumen',
      name: 'Technical Acumen',
      color: 'indigo',
      icon: '⚙️',
      parameters: [
        { id: 'efficient_tool_switching', label: 'Tool Switching', description: 'Trainer was efficient in toggling between various tools during screen share' },
        { id: 'audio_video_clarity', label: 'Audio/Video Clarity', description: 'Trainer ensured audio / video clarity throughout the session' },
        { id: 'session_recording', label: 'Session Recording', description: 'Trainer recorded the session for reference of participants' },
        { id: 'survey_assignment', label: 'Survey Assignment', description: 'Trainer assigned survey / assessment seamlessly' }
      ]
    }
  ]
} as const

// Helper type to get all parameter IDs
export type ParameterId = typeof ASSESSMENT_STRUCTURE.categories[number]['parameters'][number]['id']

// Assessment types (matches database schema with 21 parameters)
export interface ManagerAssessment {
  id: string
  trainer_id: string
  assessor_id: string
  assessment_date: string
  
  // Category 1: Trainer Initial Readiness (5 parameters)
  logs_in_early: number | null
  logs_in_early_comments: string | null
  video_always_on: number | null
  video_always_on_comments: string | null
  minimal_disturbance: number | null
  minimal_disturbance_comments: string | null
  presentable_prompt: number | null
  presentable_prompt_comments: string | null
  ready_with_tools: number | null
  ready_with_tools_comments: string | null
  
  // Category 2: Trainer Expertise & Delivery (5 parameters)
  adequate_knowledge: number | null
  adequate_knowledge_comments: string | null
  simplifies_topics: number | null
  simplifies_topics_comments: string | null
  encourages_participation: number | null
  encourages_participation_comments: string | null
  handles_questions: number | null
  handles_questions_comments: string | null
  provides_context: number | null
  provides_context_comments: string | null
  
  // Category 3: Participant Engagement & Interaction (4 parameters)
  maintains_attention: number | null
  maintains_attention_comments: string | null
  uses_interactive_tools: number | null
  uses_interactive_tools_comments: string | null
  assesses_learning: number | null
  assesses_learning_comments: string | null
  clear_speech: number | null
  clear_speech_comments: string | null
  
  // Category 4: Communication Skills (3 parameters)
  minimal_grammar_errors: number | null
  minimal_grammar_errors_comments: string | null
  professional_tone: number | null
  professional_tone_comments: string | null
  manages_teams_well: number | null
  manages_teams_well_comments: string | null
  
  // Category 5: Technical Acumen (4 parameters)
  efficient_tool_switching: number | null
  efficient_tool_switching_comments: string | null
  audio_video_clarity: number | null
  audio_video_clarity_comments: string | null
  session_recording: number | null
  session_recording_comments: string | null
  survey_assignment: number | null
  survey_assignment_comments: string | null
  
  overall_comments: string | null
  created_at: string
  updated_at: string
}

// Helper type for assessment form data
export interface Assessment21Data {
  [key: string]: number | string | null
  // All 21 rating fields and comment fields will be dynamically typed
}

// Category average type
export interface CategoryAverage {
  categoryId: string
  categoryName: string
  average: number
  parameterCount: number
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
  category_averages: {
    trainer_readiness: number
    expertise_delivery: number
    engagement_interaction: number
    communication: number
    technical_acumen: number
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

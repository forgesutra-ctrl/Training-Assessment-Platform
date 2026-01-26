-- ============================================================================
-- TRAINING ASSESSMENT PLATFORM - MASTER SETUP SCRIPT
-- ============================================================================
-- 
-- THIS IS THE ONLY SQL SCRIPT YOU NEED TO RUN!
-- 
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it.
-- It includes everything: schema, audit logs, constraints, and gamification.
-- 
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- PART 1: DROP ALL EXISTING OBJECTS (for clean setup)
-- ============================================================================

-- Note: Policies are automatically dropped when tables are dropped with CASCADE
-- So we don't need to drop them explicitly

-- Drop views
DROP VIEW IF EXISTS assessment_summary CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_prevent_self_report ON assessments;
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_update_assessments_updated_at ON assessments;
DROP TRIGGER IF EXISTS trigger_audit_assessment_submission ON assessments;
DROP TRIGGER IF EXISTS trigger_prevent_self_report_assessment ON assessments;
DROP TRIGGER IF EXISTS trigger_ensure_cross_team_assessment ON assessments;
DROP TRIGGER IF EXISTS trigger_validate_assessment_data ON assessments;
DROP TRIGGER IF EXISTS trigger_validate_assessment_roles ON assessments;
DROP TRIGGER IF EXISTS trigger_award_assessment_xp ON assessments;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_assessment_average(UUID) CASCADE;
DROP FUNCTION IF EXISTS prevent_self_report_assessment() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_audit_action(UUID, TEXT, TEXT, UUID, JSONB, INET) CASCADE;
DROP FUNCTION IF EXISTS audit_assessment_submission() CASCADE;
DROP FUNCTION IF EXISTS audit_user_changes() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_audit_logs() CASCADE;
DROP FUNCTION IF EXISTS ensure_cross_team_assessment() CASCADE;
DROP FUNCTION IF EXISTS validate_assessment_data() CASCADE;
DROP FUNCTION IF EXISTS validate_assessment_roles() CASCADE;
DROP FUNCTION IF EXISTS calculate_assessment_xp(NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS calculate_level(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS xp_for_next_level(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS award_assessment_xp() CASCADE;

-- Drop tables (CASCADE handles dependencies)
DROP TABLE IF EXISTS kudos CASCADE;
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS leaderboard_preferences CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS xp_history CASCADE;
DROP TABLE IF EXISTS user_xp CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- PART 2: CREATE MAIN TABLES
-- ============================================================================

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'trainer', 'admin')),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    trainers_readiness INTEGER NOT NULL CHECK (trainers_readiness >= 1 AND trainers_readiness <= 5),
    trainers_readiness_comments TEXT CHECK (trainers_readiness_comments IS NULL OR (LENGTH(TRIM(trainers_readiness_comments)) >= 20 AND LENGTH(trainers_readiness_comments) <= 500)),
    communication_skills INTEGER NOT NULL CHECK (communication_skills >= 1 AND communication_skills <= 5),
    communication_skills_comments TEXT CHECK (communication_skills_comments IS NULL OR (LENGTH(TRIM(communication_skills_comments)) >= 20 AND LENGTH(communication_skills_comments) <= 500)),
    domain_expertise INTEGER NOT NULL CHECK (domain_expertise >= 1 AND domain_expertise <= 5),
    domain_expertise_comments TEXT CHECK (domain_expertise_comments IS NULL OR (LENGTH(TRIM(domain_expertise_comments)) >= 20 AND LENGTH(domain_expertise_comments) <= 500)),
    knowledge_displayed INTEGER NOT NULL CHECK (knowledge_displayed >= 1 AND knowledge_displayed <= 5),
    knowledge_displayed_comments TEXT CHECK (knowledge_displayed_comments IS NULL OR (LENGTH(TRIM(knowledge_displayed_comments)) >= 20 AND LENGTH(knowledge_displayed_comments) <= 500)),
    people_management INTEGER NOT NULL CHECK (people_management >= 1 AND people_management <= 5),
    people_management_comments TEXT CHECK (people_management_comments IS NULL OR (LENGTH(TRIM(people_management_comments)) >= 20 AND LENGTH(people_management_comments) <= 500)),
    technical_skills INTEGER NOT NULL CHECK (technical_skills >= 1 AND technical_skills <= 5),
    technical_skills_comments TEXT CHECK (technical_skills_comments IS NULL OR (LENGTH(TRIM(technical_skills_comments)) >= 20 AND LENGTH(technical_skills_comments) <= 500)),
    overall_comments TEXT CHECK (overall_comments IS NULL OR (LENGTH(TRIM(overall_comments)) >= 20 AND LENGTH(overall_comments) <= 500)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_not_self_report CHECK (trainer_id != assessor_id)
);

-- ============================================================================
-- PART 3: CREATE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 4: CREATE GAMIFICATION TABLES
-- ============================================================================

-- Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_value NUMERIC,
  target_parameter TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- XP and levels
CREATE TABLE user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_xp INTEGER DEFAULT 0,
  level_up_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XP history
CREATE TABLE xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Streaks table
CREATE TABLE streaks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, type)
);

-- Leaderboard preferences
CREATE TABLE leaderboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opt_in BOOLEAN DEFAULT false,
  show_name BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  position INTEGER NOT NULL,
  visible BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, widget_type)
);

-- Kudos
CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'appreciation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- ============================================================================
-- PART 5: CREATE INDEXES
-- ============================================================================

-- Main tables indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reporting_manager_id ON profiles(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_id ON assessments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_id ON assessments(assessor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_date ON assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_date ON assessments(trainer_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_date ON assessments(assessor_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_kudos_to_user ON kudos(to_user_id);

-- Unique constraint for assessments
CREATE UNIQUE INDEX IF NOT EXISTS unique_assessment_per_day
  ON assessments(assessor_id, trainer_id, assessment_date)
  WHERE assessment_date IS NOT NULL;

-- ============================================================================
-- PART 6: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $update_func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$update_func$;

-- Function to calculate average assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_average(assessment_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $avg_func$
DECLARE
    avg_score NUMERIC;
BEGIN
    SELECT AVG(
        trainers_readiness + 
        communication_skills + 
        domain_expertise + 
        knowledge_displayed + 
        people_management + 
        technical_skills
    ) / 6.0
    INTO avg_score
    FROM assessments
    WHERE id = assessment_uuid;
    
    RETURN ROUND(avg_score, 2);
END;
$avg_func$;

-- Function to prevent managers from assessing their direct reports
CREATE OR REPLACE FUNCTION prevent_self_report_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $prevent_func$
DECLARE
    trainer_reporting_manager UUID;
    assessor_role TEXT;
BEGIN
    SELECT reporting_manager_id INTO trainer_reporting_manager
    FROM profiles
    WHERE id = NEW.trainer_id;
    
    SELECT role INTO assessor_role
    FROM profiles
    WHERE id = NEW.assessor_id;
    
    IF assessor_role = 'manager' AND trainer_reporting_manager = NEW.assessor_id THEN
        RAISE EXCEPTION 'Managers cannot assess their direct reports. Trainer % reports to manager %', 
            NEW.trainer_id, NEW.assessor_id;
    END IF;
    
    RETURN NEW;
END;
$prevent_func$;

-- Function to ensure cross-team assessment
CREATE OR REPLACE FUNCTION ensure_cross_team_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $cross_team_func$
DECLARE
    trainer_team_id UUID;
    assessor_team_id UUID;
BEGIN
    SELECT team_id INTO trainer_team_id
    FROM profiles
    WHERE id = NEW.trainer_id;
    
    SELECT team_id INTO assessor_team_id
    FROM profiles
    WHERE id = NEW.assessor_id;
    
    IF trainer_team_id IS NOT NULL 
       AND assessor_team_id IS NOT NULL 
       AND trainer_team_id = assessor_team_id THEN
        RAISE EXCEPTION 'Assessments must be cross-team. Managers cannot assess trainers from their own team.';
    END IF;
    
    RETURN NEW;
END;
$cross_team_func$;

-- Function to validate assessment data
CREATE OR REPLACE FUNCTION validate_assessment_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $validate_func$
BEGIN
    IF NEW.trainers_readiness IS NULL OR
       NEW.communication_skills IS NULL OR
       NEW.domain_expertise IS NULL OR
       NEW.knowledge_displayed IS NULL OR
       NEW.people_management IS NULL OR
       NEW.technical_skills IS NULL THEN
        RAISE EXCEPTION 'All rating fields are required';
    END IF;
    
    IF NEW.assessment_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Assessment date cannot be in the future';
    END IF;
    
    IF NEW.assessment_date < CURRENT_DATE - INTERVAL '2 years' THEN
        RAISE EXCEPTION 'Assessment date cannot be more than 2 years in the past';
    END IF;
    
    RETURN NEW;
END;
$validate_func$;

-- Function to validate assessment roles
CREATE OR REPLACE FUNCTION validate_assessment_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $roles_func$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.trainer_id
        AND role = 'trainer'
    ) THEN
        RAISE EXCEPTION 'Target user must be a trainer';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.assessor_id
        AND role IN ('manager', 'admin')
    ) THEN
        RAISE EXCEPTION 'Only managers and admins can submit assessments';
    END IF;
    
    RETURN NEW;
END;
$roles_func$;

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $audit_func$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action_type,
    target_type,
    target_id,
    details,
    ip_address
  ) VALUES (
    p_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$audit_func$;

-- Audit assessment submission function
CREATE OR REPLACE FUNCTION audit_assessment_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $audit_submit_func$
BEGIN
  PERFORM log_audit_action(
    NEW.assessor_id,
    'assessment_submitted',
    'assessment',
    NEW.id,
    jsonb_build_object(
      'trainer_id', NEW.trainer_id,
      'assessment_date', NEW.assessment_date,
      'average_score', (
        (NEW.trainers_readiness +
         NEW.communication_skills +
         NEW.domain_expertise +
         NEW.knowledge_displayed +
         NEW.people_management +
         NEW.technical_skills) / 6.0
      )
    ),
    NULL
  );
  RETURN NEW;
END;
$audit_submit_func$;

-- Cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $cleanup_func$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$cleanup_func$;

-- Gamification: Calculate XP from assessment
CREATE OR REPLACE FUNCTION calculate_assessment_xp(assessment_avg NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql
AS $xp_calc_func$
BEGIN
    IF assessment_avg >= 4.5 THEN
        RETURN 150;
    ELSIF assessment_avg >= 4.0 THEN
        RETURN 100;
    ELSIF assessment_avg >= 3.5 THEN
        RETURN 75;
    ELSIF assessment_avg >= 3.0 THEN
        RETURN 50;
    ELSE
        RETURN 25;
    END IF;
END;
$xp_calc_func$;

-- Gamification: Calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(total_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $level_func$
BEGIN
    IF total_xp >= 8000 THEN RETURN 6;
    ELSIF total_xp >= 4000 THEN RETURN 5;
    ELSIF total_xp >= 2000 THEN RETURN 4;
    ELSIF total_xp >= 1000 THEN RETURN 3;
    ELSIF total_xp >= 500 THEN RETURN 2;
    ELSE RETURN 1;
    END IF;
END;
$level_func$;

-- Gamification: Get XP needed for next level
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $xp_next_func$
BEGIN
    CASE current_level
        WHEN 1 THEN RETURN 500;
        WHEN 2 THEN RETURN 1000;
        WHEN 3 THEN RETURN 2000;
        WHEN 4 THEN RETURN 4000;
        WHEN 5 THEN RETURN 8000;
        ELSE RETURN 8000;
    END CASE;
END;
$xp_next_func$;

-- Gamification: Award XP when assessment is created
CREATE OR REPLACE FUNCTION award_assessment_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $award_xp_func$
DECLARE
  avg_score NUMERIC;
  xp_earned INTEGER;
  current_total_xp INTEGER;
  new_level INTEGER;
  old_level INTEGER;
BEGIN
    avg_score := (
        NEW.trainers_readiness +
        NEW.communication_skills +
        NEW.domain_expertise +
        NEW.knowledge_displayed +
        NEW.people_management +
        NEW.technical_skills
    ) / 6.0;

    xp_earned := calculate_assessment_xp(avg_score);

    SELECT COALESCE(total_xp, 0), COALESCE(current_level, 1)
    INTO current_total_xp, old_level
    FROM user_xp
    WHERE user_id = NEW.trainer_id;

    INSERT INTO user_xp (user_id, total_xp, current_level, level_xp, updated_at)
    VALUES (
        NEW.trainer_id,
        current_total_xp + xp_earned,
        calculate_level(current_total_xp + xp_earned),
        (current_total_xp + xp_earned) - (SELECT COALESCE(SUM(xp_for_next_level(level)), 0) FROM (
            SELECT generate_series(1, calculate_level(current_total_xp + xp_earned) - 1) AS level
        ) levels),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_xp = user_xp.total_xp + xp_earned,
        current_level = calculate_level(user_xp.total_xp + xp_earned),
        level_xp = (user_xp.total_xp + xp_earned) - (SELECT COALESCE(SUM(xp_for_next_level(level)), 0) FROM (
            SELECT generate_series(1, calculate_level(user_xp.total_xp + xp_earned) - 1) AS level
        ) levels),
        updated_at = NOW();

    INSERT INTO xp_history (user_id, xp_amount, source, source_id, description)
    VALUES (
        NEW.trainer_id,
        xp_earned,
        'assessment',
        NEW.id,
        'Assessment received: ' || avg_score::TEXT || '/5.0'
    );

    new_level := calculate_level(current_total_xp + xp_earned);
    IF new_level > old_level THEN
        UPDATE user_xp
        SET level_up_at = NOW()
        WHERE user_id = NEW.trainer_id;
    END IF;

    RETURN NEW;
END;
$award_xp_func$;

-- ============================================================================
-- PART 7: CREATE TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Assessment validation triggers
CREATE TRIGGER trigger_prevent_self_report
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_report_assessment();

CREATE TRIGGER trigger_ensure_cross_team_assessment
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_cross_team_assessment();

CREATE TRIGGER trigger_validate_assessment_data
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assessment_data();

CREATE TRIGGER trigger_validate_assessment_roles
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assessment_roles();

-- Audit trigger
CREATE TRIGGER trigger_audit_assessment_submission
    AFTER INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION audit_assessment_submission();

-- Gamification trigger
CREATE TRIGGER trigger_award_assessment_xp
    AFTER INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION award_assessment_xp();

-- ============================================================================
-- PART 8: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 9: CREATE RLS POLICIES
-- ============================================================================

-- Teams policies
CREATE POLICY "Everyone can view teams"
    ON teams FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Managers can view their team profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles AS manager_profile
            WHERE manager_profile.id = auth.uid()
            AND manager_profile.role = 'manager'
            AND (
                profiles.team_id = manager_profile.team_id
                OR profiles.reporting_manager_id = manager_profile.id
            )
        )
    );

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Assessments policies
CREATE POLICY "Trainers can view their own assessments"
    ON assessments FOR SELECT
    USING (
        trainer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'trainer'
        )
    );

CREATE POLICY "Managers can view assessments they created"
    ON assessments FOR SELECT
    USING (
        assessor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Admins can view all assessments"
    ON assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Managers can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
        AND assessor_id = auth.uid()
    );

CREATE POLICY "Admins can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Managers can update assessments they created"
    ON assessments FOR UPDATE
    USING (
        assessor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    )
    WITH CHECK (
        assessor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Admins can update all assessments"
    ON assessments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete assessments"
    ON assessments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Badges policies
CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own badges"
    ON user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user badges"
    ON user_badges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Goals policies
CREATE POLICY "Users can view their own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

-- XP policies
CREATE POLICY "Users can view their own XP"
    ON user_xp FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP history"
    ON xp_history FOR SELECT
    USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view their own streaks"
    ON streaks FOR SELECT
    USING (auth.uid() = user_id);

-- Leaderboard preferences policies
CREATE POLICY "Users can manage their own preferences"
    ON leaderboard_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Dashboard widgets policies
CREATE POLICY "Users can manage their own widgets"
    ON dashboard_widgets FOR ALL
    USING (auth.uid() = user_id);

-- Kudos policies
CREATE POLICY "Users can view kudos they received"
    ON kudos FOR SELECT
    USING (auth.uid() = to_user_id);

CREATE POLICY "Users can send kudos"
    ON kudos FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- ============================================================================
-- PART 10: CREATE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW assessment_summary AS
SELECT 
    a.id,
    a.assessment_date,
    trainer.full_name AS trainer_name,
    trainer.role AS trainer_role,
    assessor.full_name AS assessor_name,
    assessor.role AS assessor_role,
    a.trainers_readiness,
    a.communication_skills,
    a.domain_expertise,
    a.knowledge_displayed,
    a.people_management,
    a.technical_skills,
    calculate_assessment_average(a.id) AS average_score,
    a.overall_comments,
    a.created_at,
    a.updated_at
FROM assessments a
JOIN profiles trainer ON a.trainer_id = trainer.id
JOIN profiles assessor ON a.assessor_id = assessor.id;

-- ============================================================================
-- PART 11: INSERT DEFAULT BADGES
-- ============================================================================

INSERT INTO badges (code, name, description, icon, category, rarity) VALUES
('rising_star', 'Rising Star', 'Received your first 4+ rating', '🌟', 'milestone', 'common'),
('consistency_king', 'Consistency King', '5 consecutive 4+ ratings', '🏆', 'achievement', 'rare'),
('improver', 'Improver', 'Improved by 0.5 points in any parameter', '📈', 'improvement', 'common'),
('all_rounder', 'All-Rounder', 'All parameters above 4.0', '🎯', 'achievement', 'rare'),
('excellence', 'Excellence', '3 months of 4.5+ average', '💎', 'achievement', 'epic'),
('mvp', 'MVP', 'Highest rated trainer of the month', '🚀', 'achievement', 'legendary'),
('hot_streak', 'Hot Streak', '10 consecutive improving assessments', '🔥', 'streak', 'epic'),
('first_assessment', 'First Steps', 'Received your first assessment', '👶', 'milestone', 'common'),
('century_club', 'Century Club', 'Received 100 assessments', '💯', 'milestone', 'rare'),
('perfect_score', 'Perfect Score', 'Received a perfect 5.0 rating', '⭐', 'achievement', 'epic')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 12: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON badges TO authenticated;
GRANT SELECT, INSERT ON user_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON goals TO authenticated;
GRANT SELECT ON user_xp TO authenticated;
GRANT SELECT ON xp_history TO authenticated;
GRANT SELECT ON streaks TO authenticated;
GRANT ALL ON leaderboard_preferences TO authenticated;
GRANT ALL ON dashboard_widgets TO authenticated;
GRANT SELECT, INSERT ON kudos TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_action TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================
-- 
-- ✅ Database setup complete!
-- 
-- Created:
-- - Tables: teams, profiles, assessments, audit_logs
-- - Gamification: badges, goals, XP, streaks, leaderboards
-- - Functions: calculations, validations, triggers
-- - RLS policies: security rules
-- - Indexes: performance optimization
-- 
-- Next steps:
-- 1. Create users in Supabase Auth (Authentication → Users)
-- 2. Insert profiles using user IDs
-- 3. Test the application
-- 
-- ============================================================================

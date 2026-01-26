-- ============================================================================
-- Training Assessment System - Complete Database Schema
-- ============================================================================
-- This script creates all tables, RLS policies, functions, and sample data
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Drop existing objects if they exist (for idempotency)
DROP POLICY IF EXISTS "Managers can view assessments they created" ON assessments;
DROP POLICY IF EXISTS "Trainers can view their own assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can delete assessments" ON assessments;
DROP POLICY IF EXISTS "Managers can create assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can create assessments" ON assessments;
DROP POLICY IF EXISTS "Managers can update assessments they created" ON assessments;
DROP POLICY IF EXISTS "Admins can update all assessments" ON assessments;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

-- Drop view first (it depends on the function)
DROP VIEW IF EXISTS assessment_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_assessment_average(UUID) CASCADE;
DROP FUNCTION IF EXISTS prevent_self_report_assessment() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- CREATE TABLES
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
    trainers_readiness_comments TEXT,
    communication_skills INTEGER NOT NULL CHECK (communication_skills >= 1 AND communication_skills <= 5),
    communication_skills_comments TEXT,
    domain_expertise INTEGER NOT NULL CHECK (domain_expertise >= 1 AND domain_expertise <= 5),
    domain_expertise_comments TEXT,
    knowledge_displayed INTEGER NOT NULL CHECK (knowledge_displayed >= 1 AND knowledge_displayed <= 5),
    knowledge_displayed_comments TEXT,
    people_management INTEGER NOT NULL CHECK (people_management >= 1 AND people_management <= 5),
    people_management_comments TEXT,
    technical_skills INTEGER NOT NULL CHECK (technical_skills >= 1 AND technical_skills <= 5),
    technical_skills_comments TEXT,
    overall_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_not_self_report CHECK (
        trainer_id != assessor_id
    )
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reporting_manager_id ON profiles(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_id ON assessments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_id ON assessments(assessor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_date ON assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Function to calculate average assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_average(assessment_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Function to prevent managers from assessing their direct reports
CREATE OR REPLACE FUNCTION prevent_self_report_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
    trainer_reporting_manager UUID;
    assessor_role TEXT;
BEGIN
    -- Get trainer's reporting manager
    SELECT reporting_manager_id INTO trainer_reporting_manager
    FROM profiles
    WHERE id = NEW.trainer_id;
    
    -- Get assessor's role
    SELECT role INTO assessor_role
    FROM profiles
    WHERE id = NEW.assessor_id;
    
    -- Check if assessor is a manager and trainer reports to them
    IF assessor_role = 'manager' AND trainer_reporting_manager = NEW.assessor_id THEN
        RAISE EXCEPTION 'Managers cannot assess their direct reports. Trainer % reports to manager %', 
            NEW.trainer_id, NEW.assessor_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at automatically
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to prevent managers from assessing direct reports
CREATE TRIGGER prevent_direct_report_assessment
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_report_assessment();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- ===== TEAMS POLICIES =====

-- Everyone can view teams
CREATE POLICY "Everyone can view teams"
    ON teams FOR SELECT
    USING (true);

-- Only admins can insert/update/delete teams
CREATE POLICY "Admins can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ===== PROFILES POLICIES =====

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Managers can view profiles of their team members
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

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ===== ASSESSMENTS POLICIES =====

-- Trainers can view their own assessments
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

-- Managers can view assessments they created
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

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
    ON assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Managers can create assessments (trigger will prevent direct report assessments)
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

-- Admins can create assessments
CREATE POLICY "Admins can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Managers can update assessments they created
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

-- Admins can update all assessments
CREATE POLICY "Admins can update all assessments"
    ON assessments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete assessments
CREATE POLICY "Admins can delete assessments"
    ON assessments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert Teams
INSERT INTO teams (id, team_name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Sales Training Team'),
    ('00000000-0000-0000-0000-000000000002', 'Technical Training Team')
ON CONFLICT (id) DO NOTHING;

-- Note: Profiles will be created when users sign up via Supabase Auth
-- For testing, you'll need to create users in Supabase Auth first, then insert profiles
-- The following is example data structure - adjust UUIDs based on your actual auth.users

-- Example profile inserts (replace UUIDs with actual auth.users IDs):
/*
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id) VALUES
    -- Admins
    ('admin-uuid-1', 'Admin User', 'admin', NULL, NULL),
    
    -- Managers
    ('manager-uuid-1', 'John Manager', 'manager', '00000000-0000-0000-0000-000000000001', NULL),
    ('manager-uuid-2', 'Jane Manager', 'manager', '00000000-0000-0000-0000-000000000002', NULL),
    ('manager-uuid-3', 'Bob Manager', 'manager', '00000000-0000-0000-0000-000000000001', NULL),
    
    -- Trainers (reporting to managers)
    ('trainer-uuid-1', 'Alice Trainer', 'trainer', '00000000-0000-0000-0000-000000000001', 'manager-uuid-1'),
    ('trainer-uuid-2', 'Charlie Trainer', 'trainer', '00000000-0000-0000-0000-000000000001', 'manager-uuid-1'),
    ('trainer-uuid-3', 'David Trainer', 'trainer', '00000000-0000-0000-0000-000000000001', 'manager-uuid-3'),
    ('trainer-uuid-4', 'Eve Trainer', 'trainer', '00000000-0000-0000-0000-000000000002', 'manager-uuid-2'),
    ('trainer-uuid-5', 'Frank Trainer', 'trainer', '00000000-0000-0000-0000-000000000002', 'manager-uuid-2'),
    ('trainer-uuid-6', 'Grace Trainer', 'trainer', '00000000-0000-0000-0000-000000000002', 'manager-uuid-2')
ON CONFLICT (id) DO NOTHING;

-- Example assessments (replace UUIDs with actual profile IDs):
INSERT INTO assessments (
    trainer_id, assessor_id, assessment_date,
    trainers_readiness, trainers_readiness_comments,
    communication_skills, communication_skills_comments,
    domain_expertise, domain_expertise_comments,
    knowledge_displayed, knowledge_displayed_comments,
    people_management, people_management_comments,
    technical_skills, technical_skills_comments,
    overall_comments
) VALUES
    -- Assessment 1: Manager 2 assessing Trainer 4 (different manager, so allowed)
    ('trainer-uuid-4', 'manager-uuid-1', '2024-01-15',
     4, 'Good preparation and organization',
     5, 'Excellent communication skills',
     4, 'Strong domain knowledge',
     5, 'Demonstrated deep understanding',
     3, 'Needs improvement in team management',
     4, 'Solid technical foundation',
     'Overall strong performance with room for growth in people management'),
    
    -- Assessment 2: Manager 2 assessing Trainer 5
    ('trainer-uuid-5', 'manager-uuid-2', '2024-01-20',
     5, 'Outstanding readiness',
     4, 'Clear and effective communication',
     5, 'Expert level domain expertise',
     5, 'Exceptional knowledge display',
     4, 'Good people management skills',
     5, 'Advanced technical capabilities',
     'Excellent trainer with comprehensive skills'),
    
    -- Assessment 3: Manager 3 assessing Trainer 1 (different manager, so allowed)
    ('trainer-uuid-1', 'manager-uuid-3', '2024-02-01',
     3, 'Adequate preparation',
     4, 'Good communication',
     3, 'Basic domain knowledge',
     3, 'Satisfactory knowledge display',
     4, 'Good team interaction',
     4, 'Competent technical skills',
     'Solid performance, continuing to develop')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- HELPER VIEWS (Optional - for easier querying)
-- ============================================================================

-- View to see assessments with calculated averages
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
-- COMPLETION MESSAGE
-- ============================================================================

-- Completion message (commented out to avoid DO block issues in some SQL editors)
-- Schema created successfully!
-- Tables: teams, profiles, assessments
-- RLS policies enabled
-- Functions and triggers created

-- ============================================================================
-- Training Assessment System - Complete Database Schema
-- ============================================================================
-- This is a SINGLE, COMPLETE script that can be run all at once
-- Just copy and paste the entire file into Supabase SQL Editor and run it
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING OBJECTS (for idempotency)
-- ============================================================================

-- Drop policies first
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

-- Drop view first (it depends on function)
DROP VIEW IF EXISTS assessment_summary CASCADE;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS calculate_assessment_average(UUID) CASCADE;
DROP FUNCTION IF EXISTS prevent_self_report_assessment() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_prevent_self_report ON assessments;
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_update_assessments_updated_at ON assessments;

-- Drop tables (CASCADE will handle dependencies)
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
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
    CONSTRAINT check_not_self_report CHECK (trainer_id != assessor_id)
);

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reporting_manager_id ON profiles(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_id ON assessments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_id ON assessments(assessor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_date ON assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $update_function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$update_function$;

-- Function to calculate average assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_average(assessment_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $avg_function$
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
$avg_function$;

-- Function to prevent managers from assessing their direct reports
CREATE OR REPLACE FUNCTION prevent_self_report_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $prevent_function$
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
$prevent_function$;

-- ============================================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at automatically on profiles
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at automatically on assessments
CREATE TRIGGER trigger_update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to prevent managers from assessing their direct reports
CREATE TRIGGER trigger_prevent_self_report
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_report_assessment();

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- ===== TEAMS POLICIES =====

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

-- ===== PROFILES POLICIES =====

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

-- ===== ASSESSMENTS POLICIES =====

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

-- ============================================================================
-- STEP 8: CREATE HELPER VIEW
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
-- COMPLETION
-- ============================================================================
-- Schema created successfully!
-- Tables: teams, profiles, assessments
-- RLS policies enabled
-- Functions and triggers created
-- View created
-- 
-- NEXT STEPS:
-- 1. Run supabase-audit-log.sql
-- 2. Run supabase-constraints-validation.sql
-- 3. Run supabase-gamification.sql (if using gamification)
-- 4. Create users in Supabase Auth
-- 5. Insert profiles using user IDs

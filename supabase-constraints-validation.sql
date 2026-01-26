-- Database Constraints and Validation
-- Run this in Supabase SQL Editor after creating the assessments table

-- 1. Check constraint: Ratings must be between 1-5
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_trainers_readiness_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_trainers_readiness_range
  CHECK (trainers_readiness >= 1 AND trainers_readiness <= 5);

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_communication_skills_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_communication_skills_range
  CHECK (communication_skills >= 1 AND communication_skills <= 5);

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_domain_expertise_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_domain_expertise_range
  CHECK (domain_expertise >= 1 AND domain_expertise <= 5);

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_knowledge_displayed_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_knowledge_displayed_range
  CHECK (knowledge_displayed >= 1 AND knowledge_displayed <= 5);

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_people_management_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_people_management_range
  CHECK (people_management >= 1 AND people_management <= 5);

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_technical_skills_range;
ALTER TABLE assessments
  ADD CONSTRAINT check_technical_skills_range
  CHECK (technical_skills >= 1 AND technical_skills <= 5);

-- 2. Check constraint: Comments must be at least 20 characters (if provided)
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_trainers_readiness_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_trainers_readiness_comments_length
  CHECK (
    trainers_readiness_comments IS NULL OR
    LENGTH(TRIM(trainers_readiness_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_communication_skills_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_communication_skills_comments_length
  CHECK (
    communication_skills_comments IS NULL OR
    LENGTH(TRIM(communication_skills_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_domain_expertise_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_domain_expertise_comments_length
  CHECK (
    domain_expertise_comments IS NULL OR
    LENGTH(TRIM(domain_expertise_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_knowledge_displayed_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_knowledge_displayed_comments_length
  CHECK (
    knowledge_displayed_comments IS NULL OR
    LENGTH(TRIM(knowledge_displayed_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_people_management_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_people_management_comments_length
  CHECK (
    people_management_comments IS NULL OR
    LENGTH(TRIM(people_management_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_technical_skills_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_technical_skills_comments_length
  CHECK (
    technical_skills_comments IS NULL OR
    LENGTH(TRIM(technical_skills_comments)) >= 20
  );

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_overall_comments_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_overall_comments_length
  CHECK (
    overall_comments IS NULL OR
    LENGTH(TRIM(overall_comments)) >= 20
  );

-- 3. Check constraint: Comments must not exceed 500 characters
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_comments_max_length;
ALTER TABLE assessments
  ADD CONSTRAINT check_comments_max_length
  CHECK (
    (trainers_readiness_comments IS NULL OR LENGTH(trainers_readiness_comments) <= 500) AND
    (communication_skills_comments IS NULL OR LENGTH(communication_skills_comments) <= 500) AND
    (domain_expertise_comments IS NULL OR LENGTH(domain_expertise_comments) <= 500) AND
    (knowledge_displayed_comments IS NULL OR LENGTH(knowledge_displayed_comments) <= 500) AND
    (people_management_comments IS NULL OR LENGTH(people_management_comments) <= 500) AND
    (technical_skills_comments IS NULL OR LENGTH(technical_skills_comments) <= 500) AND
    (overall_comments IS NULL OR LENGTH(overall_comments) <= 500)
  );

-- 4. Unique constraint: Prevent duplicate assessments (same manager, same trainer, same date)
CREATE UNIQUE INDEX IF NOT EXISTS unique_assessment_per_day
  ON assessments(assessor_id, trainer_id, assessment_date)
  WHERE assessment_date IS NOT NULL;

-- 5. Trigger: Prevent manager from assessing their own direct reports
-- This should already exist from the original schema, but let's ensure it's there
CREATE OR REPLACE FUNCTION prevent_self_report_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the trainer being assessed reports to the assessor
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.trainer_id
    AND reporting_manager_id = NEW.assessor_id
  ) THEN
    RAISE EXCEPTION 'Managers cannot assess their own direct reports. Please assess trainers from other teams.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_self_report_assessment ON assessments;
CREATE TRIGGER trigger_prevent_self_report_assessment
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_report_assessment();

-- 6. Trigger: Ensure trainer and assessor are from different teams
CREATE OR REPLACE FUNCTION ensure_cross_team_assessment()
RETURNS TRIGGER AS $$
DECLARE
  trainer_team_id UUID;
  assessor_team_id UUID;
BEGIN
  -- Get trainer's team
  SELECT team_id INTO trainer_team_id
  FROM profiles
  WHERE id = NEW.trainer_id;
  
  -- Get assessor's team
  SELECT team_id INTO assessor_team_id
  FROM profiles
  WHERE id = NEW.assessor_id;
  
  -- If both have teams and they're the same, prevent the assessment
  IF trainer_team_id IS NOT NULL 
     AND assessor_team_id IS NOT NULL 
     AND trainer_team_id = assessor_team_id THEN
    RAISE EXCEPTION 'Assessments must be cross-team. Managers cannot assess trainers from their own team.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ensure_cross_team_assessment ON assessments;
CREATE TRIGGER trigger_ensure_cross_team_assessment
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_cross_team_assessment();

-- 7. Function to validate assessment data before insert
CREATE OR REPLACE FUNCTION validate_assessment_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Check all required ratings are provided
  IF NEW.trainers_readiness IS NULL OR
     NEW.communication_skills IS NULL OR
     NEW.domain_expertise IS NULL OR
     NEW.knowledge_displayed IS NULL OR
     NEW.people_management IS NULL OR
     NEW.technical_skills IS NULL THEN
    RAISE EXCEPTION 'All rating fields are required';
  END IF;
  
  -- Check assessment date is not in the future
  IF NEW.assessment_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Assessment date cannot be in the future';
  END IF;
  
  -- Check assessment date is not too old (optional: within last 2 years)
  IF NEW.assessment_date < CURRENT_DATE - INTERVAL '2 years' THEN
    RAISE EXCEPTION 'Assessment date cannot be more than 2 years in the past';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_assessment_data ON assessments;
CREATE TRIGGER trigger_validate_assessment_data
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assessment_data();

-- 8. Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_date ON assessments(trainer_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_date ON assessments(assessor_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date DESC);

-- 9. Add constraint to ensure trainer and assessor are different
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS check_trainer_assessor_different;
ALTER TABLE assessments
  ADD CONSTRAINT check_trainer_assessor_different
  CHECK (trainer_id != assessor_id);

-- 10. Add constraint to ensure trainer role is 'trainer'
CREATE OR REPLACE FUNCTION validate_assessment_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure trainer is actually a trainer
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.trainer_id
    AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Target user must be a trainer';
  END IF;
  
  -- Ensure assessor is a manager or admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.assessor_id
    AND role IN ('manager', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only managers and admins can submit assessments';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_assessment_roles ON assessments;
CREATE TRIGGER trigger_validate_assessment_roles
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assessment_roles();

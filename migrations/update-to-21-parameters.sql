-- Migration: Update Assessment System to 21 Parameters in 5 Categories
-- Date: 2026-01-26
-- Description: Replaces 6 generic parameters with 21 detailed parameters organized into 5 categories

-- ============================================================================
-- STEP 1: Drop old 6-parameter columns
-- ============================================================================

ALTER TABLE assessments DROP COLUMN IF EXISTS trainers_readiness CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS trainers_readiness_comments CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS communication_skills CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS communication_skills_comments CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS domain_expertise CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS domain_expertise_comments CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS knowledge_displayed CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS knowledge_displayed_comments CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS people_management CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS people_management_comments CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS technical_skills CASCADE;
ALTER TABLE assessments DROP COLUMN IF EXISTS technical_skills_comments CASCADE;

-- ============================================================================
-- STEP 2: Add Category 1: Trainer Initial Readiness (5 parameters)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'logs_in_early') THEN
    ALTER TABLE assessments ADD COLUMN logs_in_early INTEGER CHECK (logs_in_early BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'logs_in_early_comments') THEN
    ALTER TABLE assessments ADD COLUMN logs_in_early_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'video_always_on') THEN
    ALTER TABLE assessments ADD COLUMN video_always_on INTEGER CHECK (video_always_on BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'video_always_on_comments') THEN
    ALTER TABLE assessments ADD COLUMN video_always_on_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'minimal_disturbance') THEN
    ALTER TABLE assessments ADD COLUMN minimal_disturbance INTEGER CHECK (minimal_disturbance BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'minimal_disturbance_comments') THEN
    ALTER TABLE assessments ADD COLUMN minimal_disturbance_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'presentable_prompt') THEN
    ALTER TABLE assessments ADD COLUMN presentable_prompt INTEGER CHECK (presentable_prompt BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'presentable_prompt_comments') THEN
    ALTER TABLE assessments ADD COLUMN presentable_prompt_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'ready_with_tools') THEN
    ALTER TABLE assessments ADD COLUMN ready_with_tools INTEGER CHECK (ready_with_tools BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'ready_with_tools_comments') THEN
    ALTER TABLE assessments ADD COLUMN ready_with_tools_comments TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add Category 2: Trainer Expertise & Delivery (5 parameters)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'adequate_knowledge') THEN
    ALTER TABLE assessments ADD COLUMN adequate_knowledge INTEGER CHECK (adequate_knowledge BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'adequate_knowledge_comments') THEN
    ALTER TABLE assessments ADD COLUMN adequate_knowledge_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'simplifies_topics') THEN
    ALTER TABLE assessments ADD COLUMN simplifies_topics INTEGER CHECK (simplifies_topics BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'simplifies_topics_comments') THEN
    ALTER TABLE assessments ADD COLUMN simplifies_topics_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'encourages_participation') THEN
    ALTER TABLE assessments ADD COLUMN encourages_participation INTEGER CHECK (encourages_participation BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'encourages_participation_comments') THEN
    ALTER TABLE assessments ADD COLUMN encourages_participation_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'handles_questions') THEN
    ALTER TABLE assessments ADD COLUMN handles_questions INTEGER CHECK (handles_questions BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'handles_questions_comments') THEN
    ALTER TABLE assessments ADD COLUMN handles_questions_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'provides_context') THEN
    ALTER TABLE assessments ADD COLUMN provides_context INTEGER CHECK (provides_context BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'provides_context_comments') THEN
    ALTER TABLE assessments ADD COLUMN provides_context_comments TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add Category 3: Participant Engagement & Interaction (4 parameters)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'maintains_attention') THEN
    ALTER TABLE assessments ADD COLUMN maintains_attention INTEGER CHECK (maintains_attention BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'maintains_attention_comments') THEN
    ALTER TABLE assessments ADD COLUMN maintains_attention_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'uses_interactive_tools') THEN
    ALTER TABLE assessments ADD COLUMN uses_interactive_tools INTEGER CHECK (uses_interactive_tools BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'uses_interactive_tools_comments') THEN
    ALTER TABLE assessments ADD COLUMN uses_interactive_tools_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'assesses_learning') THEN
    ALTER TABLE assessments ADD COLUMN assesses_learning INTEGER CHECK (assesses_learning BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'assesses_learning_comments') THEN
    ALTER TABLE assessments ADD COLUMN assesses_learning_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'clear_speech') THEN
    ALTER TABLE assessments ADD COLUMN clear_speech INTEGER CHECK (clear_speech BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'clear_speech_comments') THEN
    ALTER TABLE assessments ADD COLUMN clear_speech_comments TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add Category 4: Communication Skills (3 parameters)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'minimal_grammar_errors') THEN
    ALTER TABLE assessments ADD COLUMN minimal_grammar_errors INTEGER CHECK (minimal_grammar_errors BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'minimal_grammar_errors_comments') THEN
    ALTER TABLE assessments ADD COLUMN minimal_grammar_errors_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'professional_tone') THEN
    ALTER TABLE assessments ADD COLUMN professional_tone INTEGER CHECK (professional_tone BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'professional_tone_comments') THEN
    ALTER TABLE assessments ADD COLUMN professional_tone_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'manages_teams_well') THEN
    ALTER TABLE assessments ADD COLUMN manages_teams_well INTEGER CHECK (manages_teams_well BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'manages_teams_well_comments') THEN
    ALTER TABLE assessments ADD COLUMN manages_teams_well_comments TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add Category 5: Technical Acumen (4 parameters)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'efficient_tool_switching') THEN
    ALTER TABLE assessments ADD COLUMN efficient_tool_switching INTEGER CHECK (efficient_tool_switching BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'efficient_tool_switching_comments') THEN
    ALTER TABLE assessments ADD COLUMN efficient_tool_switching_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'audio_video_clarity') THEN
    ALTER TABLE assessments ADD COLUMN audio_video_clarity INTEGER CHECK (audio_video_clarity BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'audio_video_clarity_comments') THEN
    ALTER TABLE assessments ADD COLUMN audio_video_clarity_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'session_recording') THEN
    ALTER TABLE assessments ADD COLUMN session_recording INTEGER CHECK (session_recording BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'session_recording_comments') THEN
    ALTER TABLE assessments ADD COLUMN session_recording_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'survey_assignment') THEN
    ALTER TABLE assessments ADD COLUMN survey_assignment INTEGER CHECK (survey_assignment BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'survey_assignment_comments') THEN
    ALTER TABLE assessments ADD COLUMN survey_assignment_comments TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Add constraints for comment validation (min 20 characters when rating exists)
-- ============================================================================

-- Note: We'll handle comment validation in the application layer
-- Database constraints for comments would require triggers, which we'll skip for now
-- Application will enforce: if rating > 0, then comment length >= 20

-- ============================================================================
-- STEP 8: Create performance indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessments_21params ON assessments (trainer_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_date ON assessments (trainer_id, assessment_date DESC);

-- ============================================================================
-- STEP 9: Update average_score calculation (if using database function)
-- ============================================================================

-- Note: average_score column calculation will be handled in application layer
-- The new calculation will average all 21 parameters instead of 6

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all columns were added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'assessments' 
-- AND column_name LIKE '%logs_in_early%' OR column_name LIKE '%adequate_knowledge%'
-- ORDER BY column_name;

-- Count total parameter columns (should be 21 rating + 21 comment = 42 new columns):
-- SELECT COUNT(*) 
-- FROM information_schema.columns 
-- WHERE table_name = 'assessments' 
-- AND (column_name LIKE '%_comments' OR column_name IN (
--   'logs_in_early', 'video_always_on', 'minimal_disturbance', 'presentable_prompt', 'ready_with_tools',
--   'adequate_knowledge', 'simplifies_topics', 'encourages_participation', 'handles_questions', 'provides_context',
--   'maintains_attention', 'uses_interactive_tools', 'assesses_learning', 'clear_speech',
--   'minimal_grammar_errors', 'professional_tone', 'manages_teams_well',
--   'efficient_tool_switching', 'audio_video_clarity', 'session_recording', 'survey_assignment'
-- ));

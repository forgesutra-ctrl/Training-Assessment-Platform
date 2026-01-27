-- Verification Queries for 21-Parameter Migration
-- Run these queries to verify the migration completed successfully

-- ============================================================================
-- 1. Verify all 21 rating columns exist
-- ============================================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN (
  'logs_in_early', 'video_always_on', 'minimal_disturbance', 'presentable_prompt', 'ready_with_tools',
  'adequate_knowledge', 'simplifies_topics', 'encourages_participation', 'handles_questions', 'provides_context',
  'maintains_attention', 'uses_interactive_tools', 'assesses_learning', 'clear_speech',
  'minimal_grammar_errors', 'professional_tone', 'manages_teams_well',
  'efficient_tool_switching', 'audio_video_clarity', 'session_recording', 'survey_assignment'
)
ORDER BY column_name;

-- Expected: 21 rows

-- ============================================================================
-- 2. Verify all 21 comment columns exist
-- ============================================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN (
  'logs_in_early_comments', 'video_always_on_comments', 'minimal_disturbance_comments', 
  'presentable_prompt_comments', 'ready_with_tools_comments',
  'adequate_knowledge_comments', 'simplifies_topics_comments', 'encourages_participation_comments', 
  'handles_questions_comments', 'provides_context_comments',
  'maintains_attention_comments', 'uses_interactive_tools_comments', 'assesses_learning_comments', 
  'clear_speech_comments',
  'minimal_grammar_errors_comments', 'professional_tone_comments', 'manages_teams_well_comments',
  'efficient_tool_switching_comments', 'audio_video_clarity_comments', 'session_recording_comments', 
  'survey_assignment_comments'
)
ORDER BY column_name;

-- Expected: 21 rows

-- ============================================================================
-- 3. Verify old 6-parameter columns are removed
-- ============================================================================
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN (
  'trainers_readiness', 'trainers_readiness_comments',
  'communication_skills', 'communication_skills_comments',
  'domain_expertise', 'domain_expertise_comments',
  'knowledge_displayed', 'knowledge_displayed_comments',
  'people_management', 'people_management_comments',
  'technical_skills', 'technical_skills_comments'
);

-- Expected: 0 rows (all old columns should be removed)

-- ============================================================================
-- 4. Count total new parameter columns (should be 42: 21 ratings + 21 comments)
-- ============================================================================
SELECT COUNT(*) as total_new_columns
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND (
  column_name IN (
    'logs_in_early', 'video_always_on', 'minimal_disturbance', 'presentable_prompt', 'ready_with_tools',
    'adequate_knowledge', 'simplifies_topics', 'encourages_participation', 'handles_questions', 'provides_context',
    'maintains_attention', 'uses_interactive_tools', 'assesses_learning', 'clear_speech',
    'minimal_grammar_errors', 'professional_tone', 'manages_teams_well',
    'efficient_tool_switching', 'audio_video_clarity', 'session_recording', 'survey_assignment'
  )
  OR column_name IN (
    'logs_in_early_comments', 'video_always_on_comments', 'minimal_disturbance_comments', 
    'presentable_prompt_comments', 'ready_with_tools_comments',
    'adequate_knowledge_comments', 'simplifies_topics_comments', 'encourages_participation_comments', 
    'handles_questions_comments', 'provides_context_comments',
    'maintains_attention_comments', 'uses_interactive_tools_comments', 'assesses_learning_comments', 
    'clear_speech_comments',
    'minimal_grammar_errors_comments', 'professional_tone_comments', 'manages_teams_well_comments',
    'efficient_tool_switching_comments', 'audio_video_clarity_comments', 'session_recording_comments', 
    'survey_assignment_comments'
  )
);

-- Expected: 42 rows

-- ============================================================================
-- 5. Verify indexes were created
-- ============================================================================
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'assessments' 
AND indexname IN ('idx_assessments_21params', 'idx_assessments_trainer_date');

-- Expected: 2 rows

-- ============================================================================
-- 6. Check constraint on rating columns (should be BETWEEN 1 AND 5)
-- ============================================================================
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'assessments'::regclass
AND conname LIKE '%logs_in_early%' OR conname LIKE '%adequate_knowledge%'
LIMIT 5;

-- Expected: Should show CHECK constraints with "BETWEEN 1 AND 5"

-- ============================================================================
-- 7. Sample query to test inserting a new assessment (dry run - won't insert)
-- ============================================================================
-- This query structure shows what a new assessment insert would look like:
/*
INSERT INTO assessments (
  trainer_id, assessor_id, assessment_date, 
  logs_in_early, logs_in_early_comments,
  video_always_on, video_always_on_comments,
  -- ... all 21 parameters ...
  average_score
) VALUES (
  'trainer-uuid', 'manager-uuid', CURRENT_DATE,
  4, 'Trainer logged in 5 minutes early and was ready.',
  5, 'Video was on throughout the entire session.',
  -- ... all 21 parameter values ...
  4.2
);
*/

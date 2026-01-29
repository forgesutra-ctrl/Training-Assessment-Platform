-- ============================================================================
-- Fix triggers for 21-parameter assessments
-- ============================================================================
-- Run this AFTER migrations/update-to-21-parameters.sql
-- Your assessments table already has 21 parameter columns; triggers still
-- referenced the old 6 columns (trainers_readiness, etc.), causing:
--   "record \"new\" has no field \"trainers_readiness\""
-- This script updates all trigger functions to use the 21-parameter schema.
-- ============================================================================

-- 21 rating columns (no _comments)
-- Category 1: logs_in_early, video_always_on, minimal_disturbance, presentable_prompt, ready_with_tools
-- Category 2: adequate_knowledge, simplifies_topics, encourages_participation, handles_questions, provides_context
-- Category 3: maintains_attention, uses_interactive_tools, assesses_learning, clear_speech
-- Category 4: minimal_grammar_errors, professional_tone, manages_teams_well
-- Category 5: efficient_tool_switching, audio_video_clarity, session_recording, survey_assignment

-- ============================================================================
-- 1. calculate_assessment_average(UUID) - used by views/reports
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_assessment_average(assessment_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $avg_func$
DECLARE
    avg_score NUMERIC;
BEGIN
    SELECT (
        COALESCE(logs_in_early, 0) + COALESCE(video_always_on, 0) + COALESCE(minimal_disturbance, 0)
        + COALESCE(presentable_prompt, 0) + COALESCE(ready_with_tools, 0)
        + COALESCE(adequate_knowledge, 0) + COALESCE(simplifies_topics, 0) + COALESCE(encourages_participation, 0)
        + COALESCE(handles_questions, 0) + COALESCE(provides_context, 0)
        + COALESCE(maintains_attention, 0) + COALESCE(uses_interactive_tools, 0) + COALESCE(assesses_learning, 0)
        + COALESCE(clear_speech, 0)
        + COALESCE(minimal_grammar_errors, 0) + COALESCE(professional_tone, 0) + COALESCE(manages_teams_well, 0)
        + COALESCE(efficient_tool_switching, 0) + COALESCE(audio_video_clarity, 0) + COALESCE(session_recording, 0)
        + COALESCE(survey_assignment, 0)
    ) / 21.0
    INTO avg_score
    FROM assessments
    WHERE id = assessment_uuid;

    RETURN ROUND(COALESCE(avg_score, 0), 2);
END;
$avg_func$;

-- ============================================================================
-- 2. validate_assessment_data() - require all 21 rating fields
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_assessment_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $validate_func$
BEGIN
    IF NEW.logs_in_early IS NULL OR NEW.video_always_on IS NULL OR NEW.minimal_disturbance IS NULL
       OR NEW.presentable_prompt IS NULL OR NEW.ready_with_tools IS NULL
       OR NEW.adequate_knowledge IS NULL OR NEW.simplifies_topics IS NULL OR NEW.encourages_participation IS NULL
       OR NEW.handles_questions IS NULL OR NEW.provides_context IS NULL
       OR NEW.maintains_attention IS NULL OR NEW.uses_interactive_tools IS NULL OR NEW.assesses_learning IS NULL
       OR NEW.clear_speech IS NULL
       OR NEW.minimal_grammar_errors IS NULL OR NEW.professional_tone IS NULL OR NEW.manages_teams_well IS NULL
       OR NEW.efficient_tool_switching IS NULL OR NEW.audio_video_clarity IS NULL OR NEW.session_recording IS NULL
       OR NEW.survey_assignment IS NULL THEN
        RAISE EXCEPTION 'All 21 rating fields are required';
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

-- ============================================================================
-- 3. audit_assessment_submission() - log average from 21 params
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_assessment_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $audit_submit_func$
DECLARE
    avg_score NUMERIC;
BEGIN
    avg_score := (
        COALESCE(NEW.logs_in_early, 0) + COALESCE(NEW.video_always_on, 0) + COALESCE(NEW.minimal_disturbance, 0)
        + COALESCE(NEW.presentable_prompt, 0) + COALESCE(NEW.ready_with_tools, 0)
        + COALESCE(NEW.adequate_knowledge, 0) + COALESCE(NEW.simplifies_topics, 0) + COALESCE(NEW.encourages_participation, 0)
        + COALESCE(NEW.handles_questions, 0) + COALESCE(NEW.provides_context, 0)
        + COALESCE(NEW.maintains_attention, 0) + COALESCE(NEW.uses_interactive_tools, 0) + COALESCE(NEW.assesses_learning, 0)
        + COALESCE(NEW.clear_speech, 0)
        + COALESCE(NEW.minimal_grammar_errors, 0) + COALESCE(NEW.professional_tone, 0) + COALESCE(NEW.manages_teams_well, 0)
        + COALESCE(NEW.efficient_tool_switching, 0) + COALESCE(NEW.audio_video_clarity, 0) + COALESCE(NEW.session_recording, 0)
        + COALESCE(NEW.survey_assignment, 0)
    ) / 21.0;

    PERFORM log_audit_action(
        NEW.assessor_id,
        'assessment_submitted',
        'assessment',
        NEW.id,
        jsonb_build_object(
            'trainer_id', NEW.trainer_id,
            'assessment_date', NEW.assessment_date,
            'average_score', ROUND(avg_score, 2)
        ),
        NULL
    );
    RETURN NEW;
END;
$audit_submit_func$;

-- ============================================================================
-- 4. award_assessment_xp() - compute average from 21 params (gamification)
-- ============================================================================
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
        COALESCE(NEW.logs_in_early, 0) + COALESCE(NEW.video_always_on, 0) + COALESCE(NEW.minimal_disturbance, 0)
        + COALESCE(NEW.presentable_prompt, 0) + COALESCE(NEW.ready_with_tools, 0)
        + COALESCE(NEW.adequate_knowledge, 0) + COALESCE(NEW.simplifies_topics, 0) + COALESCE(NEW.encourages_participation, 0)
        + COALESCE(NEW.handles_questions, 0) + COALESCE(NEW.provides_context, 0)
        + COALESCE(NEW.maintains_attention, 0) + COALESCE(NEW.uses_interactive_tools, 0) + COALESCE(NEW.assesses_learning, 0)
        + COALESCE(NEW.clear_speech, 0)
        + COALESCE(NEW.minimal_grammar_errors, 0) + COALESCE(NEW.professional_tone, 0) + COALESCE(NEW.manages_teams_well, 0)
        + COALESCE(NEW.efficient_tool_switching, 0) + COALESCE(NEW.audio_video_clarity, 0) + COALESCE(NEW.session_recording, 0)
        + COALESCE(NEW.survey_assignment, 0)
    ) / 21.0;

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
        'Assessment received: ' || ROUND(avg_score, 2)::TEXT || '/5.0'
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
-- If audit_logs or user_xp / xp_history don't exist, the above may fail.
-- Optional: drop triggers that call missing dependencies, then re-create after
-- running gamification/audit scripts. For a minimal fix we only replace the
-- functions; triggers stay as-is.
-- ============================================================================
-- Done. Re-run: npm run seed
-- ============================================================================

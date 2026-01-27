-- ============================================================================
-- 21-Parameter Assessment System - Test Data Seed Script
-- ============================================================================
-- This script seeds realistic test data for:
--   - 1 admin
--   - 2 managers
--   - 6 trainers
--   - Multiple assessments that populate ALL 21 parameters (ratings + comments)
--
-- ⚠️  CRITICAL: You MUST create auth users FIRST before running this script!
--
-- STEP-BY-STEP:
-- 1) In Supabase Dashboard → Authentication → Users, create these users
--    (or reuse your existing ones) and copy their UUIDs:
--       admin1@test.com      → Admin User
--       manager1@test.com    → Manager One
--       manager2@test.com    → Manager Two
--       trainer1@test.com    → Trainer Alpha
--       trainer2@test.com    → Trainer Beta
--       trainer3@test.com    → Trainer Gamma
--       trainer4@test.com    → Trainer Delta
--       trainer5@test.com    → Trainer Epsilon
--       trainer6@test.com    → Trainer Zeta
--
-- 2) Replace the placeholder UUIDs below with real auth.users IDs:
--       ADMIN_UUID_1    → admin1@test.com
--       MANAGER_UUID_1  → manager1@test.com
--       MANAGER_UUID_2  → manager2@test.com
--       TRAINER_UUID_1  → trainer1@test.com
--       TRAINER_UUID_2  → trainer2@test.com
--       TRAINER_UUID_3  → trainer3@test.com
--       TRAINER_UUID_4  → trainer4@test.com
--       TRAINER_UUID_5  → trainer5@test.com
--       TRAINER_UUID_6  → trainer6@test.com
--
--    Use Find & Replace so you don’t miss any.
--
-- 3) Run this entire script in the Supabase SQL editor.
--    It is mostly idempotent (ON CONFLICT on primary keys).
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Teams
-- ============================================================================

INSERT INTO teams (id, team_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sales Training Team'),
  ('22222222-2222-2222-2222-222222222222', 'Technical Training Team')
ON CONFLICT (id) DO UPDATE SET team_name = EXCLUDED.team_name;


-- ============================================================================
-- STEP 2: Create Profiles (Admin, Managers, Trainers)
-- ============================================================================

-- Admin
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES
  ('ADMIN_UUID_1', 'Admin User', 'admin', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  team_id = EXCLUDED.team_id,
  reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Managers
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES
  ('MANAGER_UUID_1', 'Manager One', 'manager', '11111111-1111-1111-1111-111111111111', NULL),
  ('MANAGER_UUID_2', 'Manager Two', 'manager', '22222222-2222-2222-2222-222222222222', NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  team_id = EXCLUDED.team_id,
  reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Trainers (3 per team, reporting to managers above)
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES
  ('TRAINER_UUID_1', 'Trainer Alpha',  'trainer', '11111111-1111-1111-1111-111111111111', 'MANAGER_UUID_1'),
  ('TRAINER_UUID_2', 'Trainer Beta',   'trainer', '11111111-1111-1111-1111-111111111111', 'MANAGER_UUID_1'),
  ('TRAINER_UUID_3', 'Trainer Gamma',  'trainer', '11111111-1111-1111-1111-111111111111', 'MANAGER_UUID_1'),
  ('TRAINER_UUID_4', 'Trainer Delta',  'trainer', '22222222-2222-2222-2222-222222222222', 'MANAGER_UUID_2'),
  ('TRAINER_UUID_5', 'Trainer Epsilon','trainer', '22222222-2222-2222-2222-222222222222', 'MANAGER_UUID_2'),
  ('TRAINER_UUID_6', 'Trainer Zeta',   'trainer', '22222222-2222-2222-2222-222222222222', 'MANAGER_UUID_2')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  team_id = EXCLUDED.team_id,
  reporting_manager_id = EXCLUDED.reporting_manager_id;


-- ============================================================================
-- STEP 3: Helper: Insert a FULL 21-parameter assessment
-- ============================================================================
-- NOTE: This uses the new 21 parameters:
--   Category 1: logs_in_early, video_always_on, minimal_disturbance,
--               presentable_prompt, ready_with_tools
--   Category 2: adequate_knowledge, simplifies_topics, encourages_participation,
--               handles_questions, provides_context
--   Category 3: maintains_attention, uses_interactive_tools, assesses_learning,
--               clear_speech
--   Category 4: minimal_grammar_errors, professional_tone, manages_teams_well
--   Category 5: efficient_tool_switching, audio_video_clarity,
--               session_recording, survey_assignment
--
-- All comments are written to be > 20 chars so your frontend validation passes.
-- ============================================================================

-- Assessment 1: Manager One → Trainer Alpha (very strong performance)
INSERT INTO assessments (
  trainer_id, assessor_id, assessment_date,
  logs_in_early, logs_in_early_comments,
  video_always_on, video_always_on_comments,
  minimal_disturbance, minimal_disturbance_comments,
  presentable_prompt, presentable_prompt_comments,
  ready_with_tools, ready_with_tools_comments,

  adequate_knowledge, adequate_knowledge_comments,
  simplifies_topics, simplifies_topics_comments,
  encourages_participation, encourages_participation_comments,
  handles_questions, handles_questions_comments,
  provides_context, provides_context_comments,

  maintains_attention, maintains_attention_comments,
  uses_interactive_tools, uses_interactive_tools_comments,
  assesses_learning, assesses_learning_comments,
  clear_speech, clear_speech_comments,

  minimal_grammar_errors, minimal_grammar_errors_comments,
  professional_tone, professional_tone_comments,
  manages_teams_well, manages_teams_well_comments,

  efficient_tool_switching, efficient_tool_switching_comments,
  audio_video_clarity, audio_video_clarity_comments,
  session_recording, session_recording_comments,
  survey_assignment, survey_assignment_comments,

  overall_comments
)
VALUES (
  'TRAINER_UUID_1',
  'MANAGER_UUID_1',
  CURRENT_DATE - INTERVAL '7 days',

  5, 'Trainer logged in early and was fully set up before participants joined.',
  5, 'Camera stayed on throughout and helped maintain strong presence and connection.',
  5, 'Background was quiet and distraction free for the entire training block.',
  5, 'Trainer looked professional and started the session exactly on time.',
  5, 'All tools and slides were ready with no fumbling or delays at any point.',

  5, 'Demonstrated excellent subject knowledge with confident, accurate explanations.',
  5, 'Broke complex topics into simple, memorable chunks for every participant.',
  5, 'Frequently invited input and kept everyone actively contributing to the session.',
  5, 'Handled all questions calmly and clearly, even unexpected edge cases.',
  5, 'Connected content to real business scenarios and current project needs.',

  5, 'Kept attention high from start to finish using pace, stories, and variety.',
  5, 'Used polls, quizzes, and chat activities that kept learners fully engaged.',
  5, 'Regularly checked understanding and adjusted pace based on participant responses.',
  5, 'Spoke clearly with a comfortable speed and excellent pronunciation throughout.',

  5, 'No noticeable grammar issues; language was clear and easy to follow.',
  5, 'Tone stayed professional, energetic, and encouraging for the entire session.',
  5, 'Managed the virtual room smoothly, including breakout groups and chat traffic.',

  5, 'Switched between slides, tools, and demos with fluid, confident transitions.',
  5, 'Audio and video remained crisp and stable from start to finish of the session.',
  5, 'Recording was started promptly and confirmed to participants right away.',
  5, 'End of session survey was launched smoothly and responses were briefly reviewed.',

  'Outstanding delivery across all dimensions. This session is an excellent benchmark for others.'
)
ON CONFLICT DO NOTHING;


-- Assessment 2: Manager One → Trainer Beta (mixed strengths and growth areas)
INSERT INTO assessments (
  trainer_id, assessor_id, assessment_date,
  logs_in_early, logs_in_early_comments,
  video_always_on, video_always_on_comments,
  minimal_disturbance, minimal_disturbance_comments,
  presentable_prompt, presentable_prompt_comments,
  ready_with_tools, ready_with_tools_comments,

  adequate_knowledge, adequate_knowledge_comments,
  simplifies_topics, simplifies_topics_comments,
  encourages_participation, encourages_participation_comments,
  handles_questions, handles_questions_comments,
  provides_context, provides_context_comments,

  maintains_attention, maintains_attention_comments,
  uses_interactive_tools, uses_interactive_tools_comments,
  assesses_learning, assesses_learning_comments,
  clear_speech, clear_speech_comments,

  minimal_grammar_errors, minimal_grammar_errors_comments,
  professional_tone, professional_tone_comments,
  manages_teams_well, manages_teams_well_comments,

  efficient_tool_switching, efficient_tool_switching_comments,
  audio_video_clarity, audio_video_clarity_comments,
  session_recording, session_recording_comments,
  survey_assignment, survey_assignment_comments,

  overall_comments
)
VALUES (
  'TRAINER_UUID_2',
  'MANAGER_UUID_1',
  CURRENT_DATE - INTERVAL '14 days',

  4, 'Joined a few minutes early and completed most of the setup in advance.',
  4, 'Video was on for most of the session with only brief off-camera moments.',
  4, 'Minor background noise at times but nothing that blocked understanding.',
  4, 'Looked presentable and maintained a friendly, professional appearance.',
  4, 'Slides and tools were ready; only one short delay when switching content.',

  4, 'Good knowledge of the core content with a few deeper questions deferred.',
  3, 'Some complex ideas could be simplified further for new participants.',
  4, 'Encouraged participation but a few quieter learners could be drawn in more.',
  4, 'Answered most questions clearly and followed up where extra detail was needed.',
  3, 'Provided some business context but could connect more to current projects.',

  4, 'Maintained interest well for most of the session with only slight dips.',
  3, 'Used a poll and one activity; could add one more interactive exercise.',
  4, 'Checked understanding at key milestones and corrected misconceptions.',
  4, 'Generally clear speech with only occasional pacing that was a bit fast.',

  4, 'Very few grammar issues; overall language quality was more than acceptable.',
  4, 'Tone stayed professional and friendly, with occasional drops in energy.',
  3, 'Handled Teams tools adequately but could be more proactive in managing chat.',

  4, 'Switched between tools reasonably well with only one slightly awkward handoff.',
  4, 'Audio and video quality were strong with only a brief connection glitch.',
  3, 'Recording started a few minutes late but captured the majority of content.',
  3, 'Survey was mentioned verbally but link could be highlighted more clearly.',

  'Solid session with clear strengths. Focus improvement on simplifying explanations and adding one more interactive element.'
)
ON CONFLICT DO NOTHING;


-- Assessment 3: Manager Two → Trainer Delta (technical expert, needs engagement focus)
INSERT INTO assessments (
  trainer_id, assessor_id, assessment_date,
  logs_in_early, logs_in_early_comments,
  video_always_on, video_always_on_comments,
  minimal_disturbance, minimal_disturbance_comments,
  presentable_prompt, presentable_prompt_comments,
  ready_with_tools, ready_with_tools_comments,

  adequate_knowledge, adequate_knowledge_comments,
  simplifies_topics, simplifies_topics_comments,
  encourages_participation, encourages_participation_comments,
  handles_questions, handles_questions_comments,
  provides_context, provides_context_comments,

  maintains_attention, maintains_attention_comments,
  uses_interactive_tools, uses_interactive_tools_comments,
  assesses_learning, assesses_learning_comments,
  clear_speech, clear_speech_comments,

  minimal_grammar_errors, minimal_grammar_errors_comments,
  professional_tone, professional_tone_comments,
  manages_teams_well, manages_teams_well_comments,

  efficient_tool_switching, efficient_tool_switching_comments,
  audio_video_clarity, audio_video_clarity_comments,
  session_recording, session_recording_comments,
  survey_assignment, survey_assignment_comments,

  overall_comments
)
VALUES (
  'TRAINER_UUID_4',
  'MANAGER_UUID_2',
  CURRENT_DATE - INTERVAL '5 days',

  3, 'Joined on time but setup extended slightly into the first few minutes.',
  3, 'Video was on during explanations but occasionally turned off during demos.',
  4, 'Environment was generally quiet with one short interruption.',
  3, 'Looked professional but opening felt a bit rushed and less welcoming.',
  4, 'Had most tools ready; a couple of links had to be located live.',

  5, 'Extremely strong technical and domain knowledge; clear subject expert.',
  3, 'Explanations were accurate but could be simplified for new learners.',
  3, 'Invited questions but did not always directly encourage quieter voices.',
  4, 'Handled questions technically very well with deep, detailed answers.',
  4, 'Provided strong technical context and architecture level explanations.',

  3, 'Attention dipped in the middle section; content was dense and detailed.',
  2, 'No formal polls or activities; could strongly benefit from adding them.',
  3, 'Checked understanding a couple of times but could do this more regularly.',
  4, 'Speech was clear and steady, though occasionally very technical in wording.',

  4, 'Language was generally clean with only minor phrasing issues.',
  4, 'Tone stayed calm and professional but could use a bit more warmth.',
  3, 'Managed the room acceptably but could better balance fast and slower learners.',

  5, 'Tool switching was extremely efficient; moved between complex systems smoothly.',
  5, 'Audio and video were excellent and stable even during heavy screen sharing.',
  4, 'Recording was started after the intro, missing only a short welcome segment.',
  3, 'Survey was posted in chat but not strongly highlighted or explained.',

  'Brilliant technical depth and very strong demos. Next step is to invest in engagement tools and simpler explanations for junior audiences.'
)
ON CONFLICT DO NOTHING;


-- You can add more assessments following the same pattern for:
--   TRAINER_UUID_3, TRAINER_UUID_5, TRAINER_UUID_6
-- assessed by MANAGER_UUID_1 or MANAGER_UUID_2 (not their direct manager
-- if your RLS direct-report rule is enforced).

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================


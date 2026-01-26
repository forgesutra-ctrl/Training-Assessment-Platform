-- ============================================================================
-- Training Assessment System - Test Data Seed Script
-- ============================================================================
-- This script creates test data for the training assessment system.
-- 
-- ⚠️  CRITICAL: You MUST create auth users FIRST before running this script!
-- 
-- STEP-BY-STEP INSTRUCTIONS:
-- 
-- 1. Create 6 auth users in Supabase Dashboard:
--    - Go to: Authentication -> Users -> Add User -> Create new user
--    - Create these users (password: Test@123456 for all):
--      * manager1@test.com (Sarah Johnson)
--      * manager2@test.com (John Smith)
--      * trainer1@test.com (Alice Williams)
--      * trainer2@test.com (Bob Davis)
--      * trainer3@test.com (Carol Brown)
--      * trainer4@test.com (David Miller)
--    - Make sure to check "Auto Confirm User" for each
-- 
-- 2. Get the User IDs:
--    - Run the query in get-user-ids.sql OR run this:
--      SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
--    - Copy all 6 user IDs
-- 
-- 3. Replace UUIDs in this script:
--    - Find and replace these placeholder UUIDs with actual IDs:
--      aaaaaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa -> Sarah Johnson's ID
--      bbbbbbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb -> John Smith's ID
--      cccccccccccc-cccc-cccc-cccc-cccccccccccc -> Alice Williams's ID
--      dddddddddddd-dddd-dddd-dddd-dddddddddddd -> Bob Davis's ID
--      eeeeeeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee -> Carol Brown's ID
--      ffffffffffff-ffff-ffff-ffff-ffffffffffff -> David Miller's ID
--    - Use Find & Replace (Ctrl+H) to replace all at once
-- 
-- 4. Run this entire script
-- 
-- ============================================================================

-- Step 1: Create Teams (idempotent - safe to run multiple times)
INSERT INTO teams (id, team_name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Sales Team'),
    ('22222222-2222-2222-2222-222222222222', 'Marketing Team')
ON CONFLICT (id) DO UPDATE SET
    team_name = EXCLUDED.team_name;

-- ============================================================================
-- Step 2: Replace these UUIDs with actual auth user IDs
-- ============================================================================
-- Get your user IDs by running this query first:
-- SELECT id, email FROM auth.users ORDER BY email;
-- ============================================================================

-- IMPORTANT: Replace these placeholder UUIDs with actual user IDs from auth.users
-- Manager 1: Sarah Johnson (manager1@test.com)
-- Manager 2: John Smith (manager2@test.com)
-- Trainer 1: Alice Williams (trainer1@test.com)
-- Trainer 2: Bob Davis (trainer2@test.com)
-- Trainer 3: Carol Brown (trainer3@test.com)
-- Trainer 4: David Miller (trainer4@test.com)

-- Step 3: Create Manager Profiles
-- Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with Sarah Johnson's actual user ID
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sarah Johnson', 'manager', '11111111-1111-1111-1111-111111111111', NULL)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' with John Smith's actual user ID
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'John Smith', 'manager', '22222222-2222-2222-2222-222222222222', NULL)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Step 4: Create Trainer Profiles
-- Replace 'cccccccc-cccc-cccc-cccc-cccccccccccc' with Alice Williams's actual user ID
-- Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with Sarah Johnson's actual user ID (manager1_id)
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alice Williams', 'trainer', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Replace 'dddddddd-dddd-dddd-dddd-dddddddddddd' with Bob Davis's actual user ID
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bob Davis', 'trainer', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Replace 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' with Carol Brown's actual user ID
-- Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' with John Smith's actual user ID (manager2_id)
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Carol Brown', 'trainer', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- Replace 'ffffffff-ffff-ffff-ffff-ffffffffffff' with David Miller's actual user ID
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'David Miller', 'trainer', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;

-- ============================================================================
-- Step 5: Create Sample Assessments
-- ============================================================================
-- Note: Make sure to replace the UUIDs in these INSERT statements too!
-- ============================================================================

-- Assessment 1: Sarah Johnson assessing Carol Brown (cross-team)
-- Replace 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' with Carol Brown's user ID (trainer3_id)
-- Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with Sarah Johnson's user ID (manager1_id)
INSERT INTO assessments (
    trainer_id, assessor_id, assessment_date,
    trainers_readiness, trainers_readiness_comments,
    communication_skills, communication_skills_comments,
    domain_expertise, domain_expertise_comments,
    knowledge_displayed, knowledge_displayed_comments,
    people_management, people_management_comments,
    technical_skills, technical_skills_comments,
    overall_comments
)
VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    CURRENT_DATE - INTERVAL '15 days',
    4, 'Carol demonstrated excellent preparation for the training session. All materials were well-organized and she arrived early to set up. The session flow was clearly planned and executed smoothly.',
    5, 'Outstanding communication skills. Carol explained complex concepts in a clear and engaging manner. She maintained excellent eye contact and used appropriate body language throughout. Participants were fully engaged.',
    4, 'Strong domain expertise demonstrated. Carol showed deep understanding of the subject matter and was able to answer all questions confidently. She provided relevant examples from real-world scenarios.',
    5, 'Carol displayed exceptional knowledge throughout the session. She seamlessly integrated advanced concepts and provided valuable insights. Her ability to connect theory with practice was impressive.',
    4, 'Good people management skills. Carol effectively managed the group dynamics and ensured all participants were included. She handled questions professionally and maintained a positive learning environment.',
    4, 'Proficient with technical tools. Carol navigated the platform smoothly and used screen sharing effectively. Minor improvements could be made in managing breakout rooms, but overall technical competence was solid.',
    'Overall, Carol delivered an excellent training session. Her preparation, communication, and subject matter expertise were outstanding. The participants provided very positive feedback. I would recommend her for advanced training sessions.'
)
ON CONFLICT DO NOTHING;

-- Assessment 2: Sarah Johnson assessing David Miller (cross-team)
-- Replace 'ffffffff-ffff-ffff-ffff-ffffffffffff' with David Miller's user ID (trainer4_id)
-- Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with Sarah Johnson's user ID (manager1_id)
INSERT INTO assessments (
    trainer_id, assessor_id, assessment_date,
    trainers_readiness, trainers_readiness_comments,
    communication_skills, communication_skills_comments,
    domain_expertise, domain_expertise_comments,
    knowledge_displayed, knowledge_displayed_comments,
    people_management, people_management_comments,
    technical_skills, technical_skills_comments,
    overall_comments
)
VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    CURRENT_DATE - INTERVAL '10 days',
    3, 'David was adequately prepared for the session. Most materials were ready, though there were a few minor delays in accessing some resources. Overall preparation was satisfactory but could be improved.',
    4, 'Good communication skills. David spoke clearly and at an appropriate pace. He explained concepts well and used visual aids effectively. Some participants mentioned they would appreciate more interactive elements.',
    3, 'Solid domain knowledge with room for growth. David demonstrated good understanding of the core concepts but struggled slightly with some advanced questions. He handled this professionally by noting he would follow up.',
    4, 'David displayed good knowledge throughout the session. He was able to explain most concepts clearly and provided relevant examples. His presentation was well-structured and easy to follow.',
    3, 'Adequate people management. David maintained a professional atmosphere and tried to engage all participants. However, some quieter participants may have needed more encouragement to participate actively.',
    5, 'Excellent technical skills. David demonstrated mastery of all technical tools. His screen sharing was flawless, and he managed all technical aspects smoothly. This was a clear strength of his presentation.',
    'David delivered a solid training session with particular strength in technical execution. His communication and domain knowledge were good, with opportunities for improvement in preparation and people management. Overall, a satisfactory performance with clear potential for growth.'
)
ON CONFLICT DO NOTHING;

-- Assessment 3: John Smith assessing Alice Williams (cross-team)
-- Replace 'cccccccc-cccc-cccc-cccc-cccccccccccc' with Alice Williams's user ID (trainer1_id)
-- Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' with John Smith's user ID (manager2_id)
INSERT INTO assessments (
    trainer_id, assessor_id, assessment_date,
    trainers_readiness, trainers_readiness_comments,
    communication_skills, communication_skills_comments,
    domain_expertise, domain_expertise_comments,
    knowledge_displayed, knowledge_displayed_comments,
    people_management, people_management_comments,
    technical_skills, technical_skills_comments,
    overall_comments
)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
    CURRENT_DATE - INTERVAL '7 days',
    5, 'Alice was exceptionally well-prepared. She had all materials ready well in advance and even prepared backup resources. The session structure was clear and well-thought-out. Excellent preparation demonstrated.',
    5, 'Exceptional communication skills. Alice has a natural ability to connect with her audience. Her explanations were clear, engaging, and appropriately paced. She used storytelling effectively to illustrate key points.',
    5, 'Outstanding domain expertise. Alice demonstrated deep and comprehensive knowledge of the subject. She answered all questions with confidence and provided additional valuable insights beyond the core curriculum.',
    5, 'Alice displayed exceptional knowledge throughout. She seamlessly integrated advanced concepts and real-world applications. Her ability to make complex topics accessible was particularly impressive.',
    5, 'Excellent people management. Alice created an inclusive and engaging learning environment. She effectively managed group dynamics, encouraged participation from all attendees, and handled questions with grace and professionalism.',
    4, 'Very good technical skills. Alice navigated the platform effectively and used all tools appropriately. There were minor moments where transitions could have been smoother, but overall technical execution was strong.',
    'Alice delivered an outstanding training session that exceeded expectations. Her preparation, communication, and expertise were exceptional. Participants provided overwhelmingly positive feedback. Alice is clearly a top-tier trainer and I would highly recommend her for any training assignment.'
)
ON CONFLICT DO NOTHING;

-- Assessment 4: John Smith assessing Bob Davis (cross-team)
-- Replace 'dddddddd-dddd-dddd-dddd-dddddddddddd' with Bob Davis's user ID (trainer2_id)
-- Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' with John Smith's user ID (manager2_id)
INSERT INTO assessments (
    trainer_id, assessor_id, assessment_date,
    trainers_readiness, trainers_readiness_comments,
    communication_skills, communication_skills_comments,
    domain_expertise, domain_expertise_comments,
    knowledge_displayed, knowledge_displayed_comments,
    people_management, people_management_comments,
    technical_skills, technical_skills_comments,
    overall_comments
)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd', 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
    CURRENT_DATE - INTERVAL '3 days',
    4, 'Bob was well-prepared for the session. Materials were organized and he arrived on time. The session structure was clear, though some additional preparation for potential questions would have been beneficial.',
    4, 'Good communication skills. Bob spoke clearly and maintained good engagement with the audience. He explained concepts effectively and used examples well. Some participants suggested more visual aids could enhance the presentation.',
    4, 'Strong domain knowledge demonstrated. Bob showed good understanding of the subject matter and was able to address most questions confidently. He provided relevant examples and connected concepts well.',
    4, 'Bob displayed solid knowledge throughout the session. He explained concepts clearly and provided good examples. His presentation was well-organized and easy to follow for participants at various skill levels.',
    4, 'Good people management skills. Bob maintained a positive learning environment and encouraged participation. He handled questions professionally and ensured all participants felt included in the discussion.',
    3, 'Adequate technical skills. Bob managed the basic technical requirements well, though there were a few minor technical hiccups with screen sharing. With some additional practice, technical execution could be improved.',
    'Bob delivered a good training session with solid performance across most areas. His communication and domain knowledge were strong. The main area for improvement is technical execution, but overall he provided value to the participants.'
)
ON CONFLICT DO NOTHING;

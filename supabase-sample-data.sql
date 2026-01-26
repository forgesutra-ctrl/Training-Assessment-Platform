-- ============================================================================
-- Sample Data Insertion Script
-- ============================================================================
-- Run this AFTER creating users in Supabase Auth
-- Replace the UUIDs below with actual user IDs from auth.users table
-- ============================================================================

-- Step 1: Get your user IDs from Supabase Auth
-- Go to: Authentication → Users → Copy the UUIDs

-- Step 2: Update the UUIDs below, then run this script

-- Example: Insert profiles (replace UUIDs with actual auth.users IDs)
/*
INSERT INTO profiles (id, full_name, role, team_id, reporting_manager_id) VALUES
    -- Admins (replace 'admin-uuid-1' with actual UUID)
    ('admin-uuid-1', 'Admin User', 'admin', NULL, NULL),
    
    -- Managers (replace UUIDs with actual manager user IDs)
    ('manager-uuid-1', 'John Manager', 'manager', 
     '00000000-0000-0000-0000-000000000001', NULL),
    ('manager-uuid-2', 'Jane Manager', 'manager', 
     '00000000-0000-0000-0000-000000000002', NULL),
    ('manager-uuid-3', 'Bob Manager', 'manager', 
     '00000000-0000-0000-0000-000000000001', NULL),
    
    -- Trainers (replace UUIDs with actual trainer user IDs)
    ('trainer-uuid-1', 'Alice Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000001', 'manager-uuid-1'),
    ('trainer-uuid-2', 'Charlie Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000001', 'manager-uuid-1'),
    ('trainer-uuid-3', 'David Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000001', 'manager-uuid-3'),
    ('trainer-uuid-4', 'Eve Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000002', 'manager-uuid-2'),
    ('trainer-uuid-5', 'Frank Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000002', 'manager-uuid-2'),
    ('trainer-uuid-6', 'Grace Trainer', 'trainer', 
     '00000000-0000-0000-0000-000000000002', 'manager-uuid-2')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    reporting_manager_id = EXCLUDED.reporting_manager_id;
*/

-- Step 3: Insert sample assessments (replace UUIDs with actual profile IDs)
/*
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
    -- Assessment 1: Manager 1 assessing Trainer 4 (different manager, allowed)
    ('trainer-uuid-4', 'manager-uuid-1', CURRENT_DATE - INTERVAL '30 days',
     4, 'Good preparation and organization. Materials were well-structured.',
     5, 'Excellent communication skills. Clear explanations and engaging delivery.',
     4, 'Strong domain knowledge demonstrated throughout the session.',
     5, 'Demonstrated deep understanding of complex topics.',
     3, 'Needs improvement in team management and delegation.',
     4, 'Solid technical foundation with good practical examples.',
     'Overall strong performance with room for growth in people management. Continue developing leadership skills.'),
    
    -- Assessment 2: Manager 2 assessing Trainer 5 (her direct report - will be blocked by trigger)
    -- This will FAIL due to RLS trigger - Manager 2 cannot assess Trainer 5 who reports to her
    -- ('trainer-uuid-5', 'manager-uuid-2', CURRENT_DATE - INTERVAL '25 days', ...),
    
    -- Assessment 3: Manager 2 assessing Trainer 1 (different manager, allowed)
    ('trainer-uuid-1', 'manager-uuid-2', CURRENT_DATE - INTERVAL '20 days',
     5, 'Outstanding readiness. All materials prepared in advance.',
     4, 'Clear and effective communication with good pacing.',
     5, 'Expert level domain expertise. Answered all questions confidently.',
     5, 'Exceptional knowledge display. Used real-world examples effectively.',
     4, 'Good people management skills. Engaged all participants.',
     5, 'Advanced technical capabilities. Demonstrated complex concepts clearly.',
     'Excellent trainer with comprehensive skills. Highly recommended for advanced training sessions.'),
    
    -- Assessment 4: Manager 3 assessing Trainer 2 (different manager, allowed)
    ('trainer-uuid-2', 'manager-uuid-3', CURRENT_DATE - INTERVAL '15 days',
     3, 'Adequate preparation. Could benefit from more detailed materials.',
     4, 'Good communication but could improve engagement techniques.',
     3, 'Basic domain knowledge. Needs to deepen expertise in some areas.',
     3, 'Satisfactory knowledge display. Some concepts could be explained better.',
     4, 'Good team interaction. Maintained positive atmosphere.',
     4, 'Competent technical skills. Handled questions well.',
     'Solid performance, continuing to develop. Recommend additional training in domain expertise.');
*/

-- ============================================================================
-- QUICK QUERY: Get all user IDs from auth.users
-- ============================================================================
-- Run this to see all your user IDs:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- ============================================================================
-- QUICK QUERY: Verify your data
-- ============================================================================
-- After inserting, verify with:
-- SELECT * FROM profiles ORDER BY role, full_name;
-- SELECT * FROM assessments ORDER BY assessment_date DESC;
-- SELECT * FROM assessment_summary ORDER BY assessment_date DESC;

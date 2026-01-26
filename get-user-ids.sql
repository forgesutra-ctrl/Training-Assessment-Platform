-- ============================================================================
-- Helper Query: Get All User IDs
-- ============================================================================
-- Run this FIRST to get all your auth user IDs
-- Then copy the IDs and update them in seed-test-data.sql
-- ============================================================================

SELECT 
    id,
    email,
    CASE 
        WHEN email = 'manager1@test.com' THEN 'Sarah Johnson (Manager 1)'
        WHEN email = 'manager2@test.com' THEN 'John Smith (Manager 2)'
        WHEN email = 'trainer1@test.com' THEN 'Alice Williams (Trainer 1)'
        WHEN email = 'trainer2@test.com' THEN 'Bob Davis (Trainer 2)'
        WHEN email = 'trainer3@test.com' THEN 'Carol Brown (Trainer 3)'
        WHEN email = 'trainer4@test.com' THEN 'David Miller (Trainer 4)'
        ELSE email
    END as user_name
FROM auth.users 
WHERE email IN (
    'manager1@test.com',
    'manager2@test.com',
    'trainer1@test.com',
    'trainer2@test.com',
    'trainer3@test.com',
    'trainer4@test.com'
)
ORDER BY email;

-- ============================================================================
-- Copy the IDs from the results above and use them to replace:
-- ============================================================================
-- manager1@test.com (Sarah Johnson) -> Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- manager2@test.com (John Smith) -> Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
-- trainer1@test.com (Alice Williams) -> Replace 'cccccccc-cccc-cccc-cccc-cccccccccccc'
-- trainer2@test.com (Bob Davis) -> Replace 'dddddddd-dddd-dddd-dddd-dddddddddddd'
-- trainer3@test.com (Carol Brown) -> Replace 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
-- trainer4@test.com (David Miller) -> Replace 'ffffffff-ffff-ffff-ffff-ffffffffffff'
-- ============================================================================

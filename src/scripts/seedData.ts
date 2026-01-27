/**
 * Automated Seed Data Script
 * 
 * This script automatically creates all test data including:
 * - Auth users
 * - Teams
 * - Profiles
 * - Sample assessments
 * 
 * To run: npm run seed
 * 
 * NOTE: This requires VITE_SUPABASE_SERVICE_ROLE_KEY in .env
 * Get it from: Supabase Dashboard -> Settings -> API -> service_role key
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file manually (simple approach)
try {
  const envPath = resolve(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=')
    if (key && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
} catch (error) {
  // .env file might not exist, that's okay
}

// Get credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please add to .env:')
  console.error('  VITE_SUPABASE_URL=your_url')
  console.error('  VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\nGet service_role_key from: Supabase Dashboard -> Settings -> API')
  process.exit(1)
}

// Create admin client (with service_role_key for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface UserData {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'manager' | 'trainer'
  teamName?: string
  reportingManagerEmail?: string
}

const users: UserData[] = [
  {
    email: 'admin1@test.com',
    password: 'Test@123456',
    fullName: 'Admin User',
    role: 'admin',
  },
  {
    email: 'manager1@test.com',
    password: 'Test@123456',
    fullName: 'Manager One',
    role: 'manager',
    teamName: 'Sales Training Team',
  },
  {
    email: 'manager2@test.com',
    password: 'Test@123456',
    fullName: 'Manager Two',
    role: 'manager',
    teamName: 'Technical Training Team',
  },
  {
    email: 'trainer1@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Alpha',
    role: 'trainer',
    teamName: 'Sales Training Team',
    reportingManagerEmail: 'manager1@test.com',
  },
  {
    email: 'trainer2@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Beta',
    role: 'trainer',
    teamName: 'Sales Training Team',
    reportingManagerEmail: 'manager1@test.com',
  },
  {
    email: 'trainer3@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Gamma',
    role: 'trainer',
    teamName: 'Sales Training Team',
    reportingManagerEmail: 'manager1@test.com',
  },
  {
    email: 'trainer4@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Delta',
    role: 'trainer',
    teamName: 'Technical Training Team',
    reportingManagerEmail: 'manager2@test.com',
  },
  {
    email: 'trainer5@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Epsilon',
    role: 'trainer',
    teamName: 'Technical Training Team',
    reportingManagerEmail: 'manager2@test.com',
  },
  {
    email: 'trainer6@test.com',
    password: 'Test@123456',
    fullName: 'Trainer Zeta',
    role: 'trainer',
    teamName: 'Technical Training Team',
    reportingManagerEmail: 'manager2@test.com',
  },
]

async function createTeams() {
  console.log('\n📦 Creating teams...')
  
  const teams = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sales Training Team' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Technical Training Team' },
  ]

  for (const team of teams) {
    const { error } = await supabaseAdmin
      .from('teams')
      .upsert({ id: team.id, team_name: team.name }, { onConflict: 'id' })

    if (error) {
      console.error(`  ❌ Failed to create team ${team.name}:`, error.message)
    } else {
      console.log(`  ✅ Created team: ${team.name}`)
    }
  }
}

async function createAuthUser(email: string, password: string) {
  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === email)

  if (existingUser) {
    console.log(`  ⚠️  User ${email} already exists, skipping creation`)
    return existingUser.id
  }

  // Create new user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create user ${email}: ${error.message}`)
  }

  console.log(`  ✅ Created auth user: ${email}`)
  return data.user.id
}

async function createProfile(
  userId: string,
  fullName: string,
  role: 'admin' | 'manager' | 'trainer',
  teamId: string | null,
  reportingManagerId: string | null
) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName,
        role,
        team_id: teamId,
        reporting_manager_id: reportingManagerId,
      },
      { onConflict: 'id' }
    )

  if (error) {
    throw new Error(`Failed to create profile for ${fullName}: ${error.message}`)
  }

  console.log(`  ✅ Created profile: ${fullName} (${role})`)
}

async function createUsers() {
  console.log('\n👥 Creating users and profiles...')

  const userIdMap = new Map<string, string>() // email -> userId
  const managerEmailToId = new Map<string, string>() // manager email -> userId

  // First, create admin
  for (const user of users) {
    if (user.role === 'admin') {
      try {
        const userId = await createAuthUser(user.email, user.password)
        userIdMap.set(user.email, userId)
        await createProfile(userId, user.fullName, user.role, null, null)
      } catch (error: any) {
        console.error(`  ❌ Error creating admin ${user.email}:`, error.message)
      }
    }
  }

  // Then, create all managers
  for (const user of users) {
    if (user.role === 'manager') {
      try {
        const userId = await createAuthUser(user.email, user.password)
        userIdMap.set(user.email, userId)
        managerEmailToId.set(user.email, userId)

        const teamId =
          user.teamName === 'Sales Training Team'
            ? '11111111-1111-1111-1111-111111111111'
            : '22222222-2222-2222-2222-222222222222'

        await createProfile(userId, user.fullName, user.role, teamId, null)
      } catch (error: any) {
        console.error(`  ❌ Error creating manager ${user.email}:`, error.message)
      }
    }
  }

  // Finally, create all trainers
  for (const user of users) {
    if (user.role === 'trainer') {
      try {
        const userId = await createAuthUser(user.email, user.password)
        userIdMap.set(user.email, userId)

        const teamId =
          user.teamName === 'Sales Training Team'
            ? '11111111-1111-1111-1111-111111111111'
            : '22222222-2222-2222-2222-222222222222'

        const reportingManagerId = user.reportingManagerEmail
          ? managerEmailToId.get(user.reportingManagerEmail) || null
          : null

        await createProfile(userId, user.fullName, user.role, teamId, reportingManagerId)
      } catch (error: any) {
        console.error(`  ❌ Error creating trainer ${user.email}:`, error.message)
      }
    }
  }

  return userIdMap
}

async function createAssessments(userIdMap: Map<string, string>) {
  console.log('\n📝 Creating sample assessments with 21 parameters...')

  const manager1Id = userIdMap.get('manager1@test.com')!
  const manager2Id = userIdMap.get('manager2@test.com')!
  const trainer1Id = userIdMap.get('trainer1@test.com')!
  const trainer4Id = userIdMap.get('trainer4@test.com')!
  const trainer5Id = userIdMap.get('trainer5@test.com')!

  // Assessment 1: Manager One (Sales) → Trainer Delta (Technical) - CROSS TEAM
  const assessment1 = {
    trainer_id: trainer4Id,
    assessor_id: manager1Id,
    assessment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    // Category 1: Trainer Initial Readiness
    logs_in_early: 5,
    logs_in_early_comments: 'Trainer logged in early and was fully set up before participants joined.',
    video_always_on: 5,
    video_always_on_comments: 'Camera stayed on throughout and helped maintain strong presence and connection.',
    minimal_disturbance: 5,
    minimal_disturbance_comments: 'Background was quiet and distraction free for the entire training block.',
    presentable_prompt: 5,
    presentable_prompt_comments: 'Trainer looked professional and started the session exactly on time.',
    ready_with_tools: 5,
    ready_with_tools_comments: 'All tools and slides were ready with no fumbling or delays at any point.',
    // Category 2: Trainer Expertise & Delivery
    adequate_knowledge: 5,
    adequate_knowledge_comments: 'Demonstrated excellent subject knowledge with confident, accurate explanations.',
    simplifies_topics: 5,
    simplifies_topics_comments: 'Broke complex topics into simple, memorable chunks for every participant.',
    encourages_participation: 5,
    encourages_participation_comments: 'Frequently invited input and kept everyone actively contributing to the session.',
    handles_questions: 5,
    handles_questions_comments: 'Handled all questions calmly and clearly, even unexpected edge cases.',
    provides_context: 5,
    provides_context_comments: 'Connected content to real business scenarios and current project needs.',
    // Category 3: Participant Engagement & Interaction
    maintains_attention: 5,
    maintains_attention_comments: 'Kept attention high from start to finish using pace, stories, and variety.',
    uses_interactive_tools: 5,
    uses_interactive_tools_comments: 'Used polls, quizzes, and chat activities that kept learners fully engaged.',
    assesses_learning: 5,
    assesses_learning_comments: 'Regularly checked understanding and adjusted pace based on participant responses.',
    clear_speech: 5,
    clear_speech_comments: 'Spoke clearly with a comfortable speed and excellent pronunciation throughout.',
    // Category 4: Communication Skills
    minimal_grammar_errors: 5,
    minimal_grammar_errors_comments: 'No noticeable grammar issues; language was clear and easy to follow.',
    professional_tone: 5,
    professional_tone_comments: 'Tone stayed professional, energetic, and encouraging for the entire session.',
    manages_teams_well: 5,
    manages_teams_well_comments: 'Managed the virtual room smoothly, including breakout groups and chat traffic.',
    // Category 5: Technical Acumen
    efficient_tool_switching: 5,
    efficient_tool_switching_comments: 'Switched between slides, tools, and demos with fluid, confident transitions.',
    audio_video_clarity: 5,
    audio_video_clarity_comments: 'Audio and video remained crisp and stable from start to finish of the session.',
    session_recording: 5,
    session_recording_comments: 'Recording was started promptly and confirmed to participants right away.',
    survey_assignment: 5,
    survey_assignment_comments: 'End of session survey was launched smoothly and responses were briefly reviewed.',
    overall_comments: 'Outstanding delivery across all dimensions. This session is an excellent benchmark for others.',
  }

  // Assessment 2: Manager One (Sales) → Trainer Epsilon (Technical) - CROSS TEAM
  const assessment2 = {
    trainer_id: trainer5Id,
    assessor_id: manager1Id,
    assessment_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    logs_in_early: 4,
    logs_in_early_comments: 'Joined a few minutes early and completed most of the setup in advance.',
    video_always_on: 4,
    video_always_on_comments: 'Video was on for most of the session with only brief off-camera moments.',
    minimal_disturbance: 4,
    minimal_disturbance_comments: 'Minor background noise at times but nothing that blocked understanding.',
    presentable_prompt: 4,
    presentable_prompt_comments: 'Looked presentable and maintained a friendly, professional appearance.',
    ready_with_tools: 4,
    ready_with_tools_comments: 'Slides and tools were ready; only one short delay when switching content.',
    adequate_knowledge: 4,
    adequate_knowledge_comments: 'Good knowledge of the core content with a few deeper questions deferred.',
    simplifies_topics: 3,
    simplifies_topics_comments: 'Some complex ideas could be simplified further for new participants.',
    encourages_participation: 4,
    encourages_participation_comments: 'Encouraged participation but a few quieter learners could be drawn in more.',
    handles_questions: 4,
    handles_questions_comments: 'Answered most questions clearly and followed up where extra detail was needed.',
    provides_context: 3,
    provides_context_comments: 'Provided some business context but could connect more to current projects.',
    maintains_attention: 4,
    maintains_attention_comments: 'Maintained interest well for most of the session with only slight dips.',
    uses_interactive_tools: 3,
    uses_interactive_tools_comments: 'Used a poll and one activity; could add one more interactive exercise.',
    assesses_learning: 4,
    assesses_learning_comments: 'Checked understanding at key milestones and corrected misconceptions.',
    clear_speech: 4,
    clear_speech_comments: 'Generally clear speech with only occasional pacing that was a bit fast.',
    minimal_grammar_errors: 4,
    minimal_grammar_errors_comments: 'Very few grammar issues; overall language quality was more than acceptable.',
    professional_tone: 4,
    professional_tone_comments: 'Tone stayed professional and friendly, with occasional drops in energy.',
    manages_teams_well: 3,
    manages_teams_well_comments: 'Handled Teams tools adequately but could be more proactive in managing chat.',
    efficient_tool_switching: 4,
    efficient_tool_switching_comments: 'Switched between tools reasonably well with only one slightly awkward handoff.',
    audio_video_clarity: 4,
    audio_video_clarity_comments: 'Audio and video quality were strong with only a brief connection glitch.',
    session_recording: 3,
    session_recording_comments: 'Recording started a few minutes late but captured the majority of content.',
    survey_assignment: 3,
    survey_assignment_comments: 'Survey was mentioned verbally but link could be highlighted more clearly.',
    overall_comments: 'Solid session with clear strengths. Focus improvement on simplifying explanations and adding one more interactive element.',
  }

  // Assessment 3: Manager Two (Technical) → Trainer Alpha (Sales) - CROSS TEAM
  const assessment3 = {
    trainer_id: trainer1Id,
    assessor_id: manager2Id,
    assessment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    logs_in_early: 3,
    logs_in_early_comments: 'Joined on time but setup extended slightly into the first few minutes.',
    video_always_on: 3,
    video_always_on_comments: 'Video was on during explanations but occasionally turned off during demos.',
    minimal_disturbance: 4,
    minimal_disturbance_comments: 'Environment was generally quiet with one short interruption.',
    presentable_prompt: 3,
    presentable_prompt_comments: 'Looked professional but opening felt a bit rushed and less welcoming.',
    ready_with_tools: 4,
    ready_with_tools_comments: 'Had most tools ready; a couple of links had to be located live.',
    adequate_knowledge: 5,
    adequate_knowledge_comments: 'Extremely strong technical and domain knowledge; clear subject expert.',
    simplifies_topics: 3,
    simplifies_topics_comments: 'Explanations were accurate but could be simplified for new learners.',
    encourages_participation: 3,
    encourages_participation_comments: 'Invited questions but did not always directly encourage quieter voices.',
    handles_questions: 4,
    handles_questions_comments: 'Handled questions technically very well with deep, detailed answers.',
    provides_context: 4,
    provides_context_comments: 'Provided strong technical context and architecture level explanations.',
    maintains_attention: 3,
    maintains_attention_comments: 'Attention dipped in the middle section; content was dense and detailed.',
    uses_interactive_tools: 2,
    uses_interactive_tools_comments: 'No formal polls or activities; could strongly benefit from adding them.',
    assesses_learning: 3,
    assesses_learning_comments: 'Checked understanding a couple of times but could do this more regularly.',
    clear_speech: 4,
    clear_speech_comments: 'Speech was clear and steady, though occasionally very technical in wording.',
    minimal_grammar_errors: 4,
    minimal_grammar_errors_comments: 'Language was generally clean with only minor phrasing issues.',
    professional_tone: 4,
    professional_tone_comments: 'Tone stayed calm and professional but could use a bit more warmth.',
    manages_teams_well: 3,
    manages_teams_well_comments: 'Managed the room acceptably but could better balance fast and slower learners.',
    efficient_tool_switching: 5,
    efficient_tool_switching_comments: 'Tool switching was extremely efficient; moved between complex systems smoothly.',
    audio_video_clarity: 5,
    audio_video_clarity_comments: 'Audio and video were excellent and stable even during heavy screen sharing.',
    session_recording: 4,
    session_recording_comments: 'Recording was started after the intro, missing only a short welcome segment.',
    survey_assignment: 3,
    survey_assignment_comments: 'Survey was posted in chat but not strongly highlighted or explained.',
    overall_comments: 'Brilliant technical depth and very strong demos. Next step is to invest in engagement tools and simpler explanations for junior audiences.',
  }

  const assessments = [assessment1, assessment2, assessment3]

  for (const assessment of assessments) {
    const { error } = await supabaseAdmin.from('assessments').insert(assessment)

    if (error) {
      // Check if it's a duplicate (safe to ignore)
      if (error.code === '23505') {
        console.log(`  ⚠️  Assessment already exists, skipping`)
      } else {
        console.error(`  ❌ Failed to create assessment:`, error.message)
      }
    } else {
      console.log(`  ✅ Created assessment with all 21 parameters`)
    }
  }
}

async function main() {
  console.log('🚀 Starting seed data script...')
  console.log('=' .repeat(50))

  try {
    // Step 1: Create teams
    await createTeams()

    // Step 2: Create users and profiles
    const userIdMap = await createUsers()

    // Step 3: Create assessments
    await createAssessments(userIdMap)

    console.log('\n' + '='.repeat(50))
    console.log('✅ Seed data creation completed successfully!')
    console.log('\n📊 Summary:')
    console.log('  - 2 Teams created')
    console.log('  - 9 Users created (1 admin, 2 managers, 6 trainers)')
    console.log('  - 9 Profiles created')
    console.log('  - 3 Assessments created (with all 21 parameters)')
    console.log('\n🔐 Test Credentials:')
    console.log('  All users have password: Test@123456')
    console.log('  - admin1@test.com (Admin User)')
    console.log('  - manager1@test.com (Manager One)')
    console.log('  - manager2@test.com (Manager Two)')
    console.log('  - trainer1@test.com (Trainer Alpha)')
    console.log('  - trainer2@test.com (Trainer Beta)')
    console.log('  - trainer3@test.com (Trainer Gamma)')
    console.log('  - trainer4@test.com (Trainer Delta)')
    console.log('  - trainer5@test.com (Trainer Epsilon)')
    console.log('  - trainer6@test.com (Trainer Zeta)')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()

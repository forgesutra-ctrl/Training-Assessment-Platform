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

/** One full 21-parameter assessment row for seed (all fields required for DB) */
type SeedAssessmentRow = {
  trainer_id: string
  assessor_id: string
  assessment_date: string
  logs_in_early: number
  logs_in_early_comments: string
  video_always_on: number
  video_always_on_comments: string
  minimal_disturbance: number
  minimal_disturbance_comments: string
  presentable_prompt: number
  presentable_prompt_comments: string
  ready_with_tools: number
  ready_with_tools_comments: string
  adequate_knowledge: number
  adequate_knowledge_comments: string
  simplifies_topics: number
  simplifies_topics_comments: string
  encourages_participation: number
  encourages_participation_comments: string
  handles_questions: number
  handles_questions_comments: string
  provides_context: number
  provides_context_comments: string
  maintains_attention: number
  maintains_attention_comments: string
  uses_interactive_tools: number
  uses_interactive_tools_comments: string
  assesses_learning: number
  assesses_learning_comments: string
  clear_speech: number
  clear_speech_comments: string
  minimal_grammar_errors: number
  minimal_grammar_errors_comments: string
  professional_tone: number
  professional_tone_comments: string
  manages_teams_well: number
  manages_teams_well_comments: string
  efficient_tool_switching: number
  efficient_tool_switching_comments: string
  audio_video_clarity: number
  audio_video_clarity_comments: string
  session_recording: number
  session_recording_comments: string
  survey_assignment: number
  survey_assignment_comments: string
  overall_comments: string
}

/** Build one assessment row. Variant: high (5s), mixed (3–4), low (2–3). Overall comment always ≥20 chars. */
function buildAssessmentRow(
  trainerId: string,
  assessorId: string,
  assessmentDate: string,
  variant: 'high' | 'mixed' | 'low'
): SeedAssessmentRow {
  const c = (v: number, comment: string) => ({ v, comment })
  const high = (comment: string) => c(5, comment)
  const mid = (comment: string) => c(4, comment)
  const low = (comment: string) => c(3, comment)
  const low2 = (comment: string) => c(2, comment)

  let cat1 = [high('Trainer logged in early and was fully set up before participants joined.'), high('Camera stayed on throughout and helped maintain strong presence and connection.'), high('Background was quiet and distraction free for the entire training block.'), high('Trainer looked professional and started the session exactly on time.'), high('All tools and slides were ready with no fumbling or delays at any point.')]
  let cat2 = [high('Demonstrated excellent subject knowledge with confident, accurate explanations.'), high('Broke complex topics into simple, memorable chunks for every participant.'), high('Frequently invited input and kept everyone actively contributing to the session.'), high('Handled all questions calmly and clearly, even unexpected edge cases.'), high('Connected content to real business scenarios and current project needs.')]
  let cat3 = [high('Kept attention high from start to finish using pace, stories, and variety.'), high('Used polls, quizzes, and chat activities that kept learners fully engaged.'), high('Regularly checked understanding and adjusted pace based on participant responses.'), high('Spoke clearly with a comfortable speed and excellent pronunciation throughout.')]
  let cat4 = [high('No noticeable grammar issues; language was clear and easy to follow.'), high('Tone stayed professional, energetic, and encouraging for the entire session.'), high('Managed the virtual room smoothly, including breakout groups and chat traffic.')]
  let cat5 = [high('Switched between slides, tools, and demos with fluid, confident transitions.'), high('Audio and video remained crisp and stable from start to finish of the session.'), high('Recording was started promptly and confirmed to participants right away.'), high('End of session survey was launched smoothly and responses were briefly reviewed.')]
  let overall = 'Outstanding delivery across all dimensions. This session is an excellent benchmark for others.'

  if (variant === 'mixed') {
    cat1 = [mid('Joined a few minutes early and completed most of the setup in advance.'), mid('Video was on for most of the session with only brief off-camera moments.'), mid('Minor background noise at times but nothing that blocked understanding.'), mid('Looked presentable and maintained a friendly, professional appearance.'), mid('Slides and tools were ready; only one short delay when switching content.')]
    cat2 = [mid('Good knowledge of the core content with a few deeper questions deferred.'), low('Some complex ideas could be simplified further for new participants.'), mid('Encouraged participation but a few quieter learners could be drawn in more.'), mid('Answered most questions clearly and followed up where extra detail was needed.'), low('Provided some business context but could connect more to current projects.')]
    cat3 = [mid('Maintained interest well for most of the session with only slight dips.'), low('Used a poll and one activity; could add one more interactive exercise.'), mid('Checked understanding at key milestones and corrected misconceptions.'), mid('Generally clear speech with only occasional pacing that was a bit fast.')]
    cat4 = [mid('Very few grammar issues; overall language quality was more than acceptable.'), mid('Tone stayed professional and friendly, with occasional drops in energy.'), low('Handled Teams tools adequately but could be more proactive in managing chat.')]
    cat5 = [mid('Switched between tools reasonably well with only one slightly awkward handoff.'), mid('Audio and video quality were strong with only a brief connection glitch.'), low('Recording started a few minutes late but captured the majority of content.'), low('Survey was mentioned verbally but link could be highlighted more clearly.')]
    overall = 'Solid session with clear strengths. Focus improvement on simplifying explanations and adding one more interactive element.'
  } else if (variant === 'low') {
    cat1 = [low('Joined on time but setup extended slightly into the first few minutes.'), low('Video was on during explanations but occasionally turned off during demos.'), mid('Environment was generally quiet with one short interruption.'), low('Looked professional but opening felt a bit rushed and less welcoming.'), mid('Had most tools ready; a couple of links had to be located live.')]
    cat2 = [high('Extremely strong technical and domain knowledge; clear subject expert.'), low('Explanations were accurate but could be simplified for new learners.'), low('Invited questions but did not always directly encourage quieter voices.'), mid('Handled questions technically very well with deep, detailed answers.'), mid('Provided strong technical context and architecture level explanations.')]
    cat3 = [low('Attention dipped in the middle section; content was dense and detailed.'), low2('No formal polls or activities; could strongly benefit from adding them.'), low('Checked understanding a couple of times but could do this more regularly.'), mid('Speech was clear and steady, though occasionally very technical in wording.')]
    cat4 = [mid('Language was generally clean with only minor phrasing issues.'), mid('Tone stayed calm and professional but could use a bit more warmth.'), low('Managed the room acceptably but could better balance fast and slower learners.')]
    cat5 = [high('Tool switching was extremely efficient; moved between complex systems smoothly.'), high('Audio and video were excellent and stable even during heavy screen sharing.'), mid('Recording was started after the intro, missing only a short welcome segment.'), low('Survey was posted in chat but not strongly highlighted or explained.')]
    overall = 'Brilliant technical depth and very strong demos. Next step is to invest in engagement tools and simpler explanations for junior audiences.'
  }

  return {
    trainer_id: trainerId,
    assessor_id: assessorId,
    assessment_date: assessmentDate,
    logs_in_early: cat1[0].v,
    logs_in_early_comments: cat1[0].comment,
    video_always_on: cat1[1].v,
    video_always_on_comments: cat1[1].comment,
    minimal_disturbance: cat1[2].v,
    minimal_disturbance_comments: cat1[2].comment,
    presentable_prompt: cat1[3].v,
    presentable_prompt_comments: cat1[3].comment,
    ready_with_tools: cat1[4].v,
    ready_with_tools_comments: cat1[4].comment,
    adequate_knowledge: cat2[0].v,
    adequate_knowledge_comments: cat2[0].comment,
    simplifies_topics: cat2[1].v,
    simplifies_topics_comments: cat2[1].comment,
    encourages_participation: cat2[2].v,
    encourages_participation_comments: cat2[2].comment,
    handles_questions: cat2[3].v,
    handles_questions_comments: cat2[3].comment,
    provides_context: cat2[4].v,
    provides_context_comments: cat2[4].comment,
    maintains_attention: cat3[0].v,
    maintains_attention_comments: cat3[0].comment,
    uses_interactive_tools: cat3[1].v,
    uses_interactive_tools_comments: cat3[1].comment,
    assesses_learning: cat3[2].v,
    assesses_learning_comments: cat3[2].comment,
    clear_speech: cat3[3].v,
    clear_speech_comments: cat3[3].comment,
    minimal_grammar_errors: cat4[0].v,
    minimal_grammar_errors_comments: cat4[0].comment,
    professional_tone: cat4[1].v,
    professional_tone_comments: cat4[1].comment,
    manages_teams_well: cat4[2].v,
    manages_teams_well_comments: cat4[2].comment,
    efficient_tool_switching: cat5[0].v,
    efficient_tool_switching_comments: cat5[0].comment,
    audio_video_clarity: cat5[1].v,
    audio_video_clarity_comments: cat5[1].comment,
    session_recording: cat5[2].v,
    session_recording_comments: cat5[2].comment,
    survey_assignment: cat5[3].v,
    survey_assignment_comments: cat5[3].comment,
    overall_comments: overall,
  }
}

async function createAssessments(userIdMap: Map<string, string>) {
  console.log('\n📝 Creating one year of assessments (21 parameters, all eligible pairs)...')

  const manager1Id = userIdMap.get('manager1@test.com')!
  const manager2Id = userIdMap.get('manager2@test.com')!
  const trainer1Id = userIdMap.get('trainer1@test.com')!
  const trainer2Id = userIdMap.get('trainer2@test.com')!
  const trainer3Id = userIdMap.get('trainer3@test.com')!
  const trainer4Id = userIdMap.get('trainer4@test.com')!
  const trainer5Id = userIdMap.get('trainer5@test.com')!
  const trainer6Id = userIdMap.get('trainer6@test.com')!

  // Eligible pairs: Manager 1 (Sales) can assess T4,T5,T6 (Technical). Manager 2 (Technical) can assess T1,T2,T3 (Sales).
  const pairs: [string, string][] = [
    [manager1Id, trainer4Id],
    [manager1Id, trainer5Id],
    [manager1Id, trainer6Id],
    [manager2Id, trainer1Id],
    [manager2Id, trainer2Id],
    [manager2Id, trainer3Id],
  ]

  const variants: ('high' | 'mixed' | 'low')[] = ['high', 'mixed', 'low']
  const now = new Date()
  const allRows: SeedAssessmentRow[] = []

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    let m = now.getMonth() - monthOffset
    let y = now.getFullYear()
    while (m < 0) {
      m += 12
      y -= 1
    }
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const day1 = Math.min(5, daysInMonth)
    const day2 = Math.min(18, daysInMonth)
    if (day1 === day2) {
      // ensure two different days
      const d2 = day2 >= daysInMonth - 1 ? day2 - 1 : day2 + 1
      const date1 = `${y}-${String(m + 1).padStart(2, '0')}-${String(day1).padStart(2, '0')}`
      const date2 = `${y}-${String(m + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
      for (let p = 0; p < pairs.length; p++) {
        const [assessorId, trainerId] = pairs[p]
        const v = variants[(monthOffset + p) % 3]
        allRows.push(buildAssessmentRow(trainerId, assessorId, date1, v))
        allRows.push(buildAssessmentRow(trainerId, assessorId, date2, v))
      }
    } else {
      const date1 = `${y}-${String(m + 1).padStart(2, '0')}-${String(day1).padStart(2, '0')}`
      const date2 = `${y}-${String(m + 1).padStart(2, '0')}-${String(day2).padStart(2, '0')}`
      for (let p = 0; p < pairs.length; p++) {
        const [assessorId, trainerId] = pairs[p]
        const v = variants[(monthOffset + p) % 3]
        allRows.push(buildAssessmentRow(trainerId, assessorId, date1, v))
        allRows.push(buildAssessmentRow(trainerId, assessorId, date2, v))
      }
    }
  }

  const BATCH = 30
  let inserted = 0
  let failed = 0
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH)
    const { error } = await supabaseAdmin.from('assessments').insert(batch)
    if (error) {
      for (const row of batch) {
        const { error: err } = await supabaseAdmin.from('assessments').insert(row)
        if (err) {
          failed++
          if (err.code !== '23505') console.error(`  ❌ Insert failed:`, err.message)
        } else inserted++
      }
    } else {
      inserted += batch.length
    }
  }
  console.log(`  ✅ Inserted ${inserted} assessments (12 months × 6 pairs × 2 per month).${failed > 0 ? ` ${failed} failed.` : ''}`)
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
    console.log('  - ~144 Assessments created (1 year: 12 months × 6 pairs × 2 per month, 21 parameters + overall_comments)')
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

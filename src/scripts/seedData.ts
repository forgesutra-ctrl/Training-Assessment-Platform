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
  role: 'manager' | 'trainer'
  teamName: string
  reportingManagerEmail?: string
}

const users: UserData[] = [
  {
    email: 'manager1@test.com',
    password: 'Test@123456',
    fullName: 'Sarah Johnson',
    role: 'manager',
    teamName: 'Sales Team',
  },
  {
    email: 'manager2@test.com',
    password: 'Test@123456',
    fullName: 'John Smith',
    role: 'manager',
    teamName: 'Marketing Team',
  },
  {
    email: 'trainer1@test.com',
    password: 'Test@123456',
    fullName: 'Alice Williams',
    role: 'trainer',
    teamName: 'Sales Team',
    reportingManagerEmail: 'manager1@test.com',
  },
  {
    email: 'trainer2@test.com',
    password: 'Test@123456',
    fullName: 'Bob Davis',
    role: 'trainer',
    teamName: 'Sales Team',
    reportingManagerEmail: 'manager1@test.com',
  },
  {
    email: 'trainer3@test.com',
    password: 'Test@123456',
    fullName: 'Carol Brown',
    role: 'trainer',
    teamName: 'Marketing Team',
    reportingManagerEmail: 'manager2@test.com',
  },
  {
    email: 'trainer4@test.com',
    password: 'Test@123456',
    fullName: 'David Miller',
    role: 'trainer',
    teamName: 'Marketing Team',
    reportingManagerEmail: 'manager2@test.com',
  },
]

async function createTeams() {
  console.log('\n📦 Creating teams...')
  
  const teams = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sales Team' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Marketing Team' },
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
  role: 'manager' | 'trainer',
  teamId: string,
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

  // First, create all managers
  for (const user of users) {
    if (user.role === 'manager') {
      try {
        const userId = await createAuthUser(user.email, user.password)
        userIdMap.set(user.email, userId)
        managerEmailToId.set(user.email, userId)

        const teamId =
          user.teamName === 'Sales Team'
            ? '11111111-1111-1111-1111-111111111111'
            : '22222222-2222-2222-2222-222222222222'

        await createProfile(userId, user.fullName, user.role, teamId, null)
      } catch (error: any) {
        console.error(`  ❌ Error creating manager ${user.email}:`, error.message)
      }
    }
  }

  // Then, create all trainers
  for (const user of users) {
    if (user.role === 'trainer') {
      try {
        const userId = await createAuthUser(user.email, user.password)
        userIdMap.set(user.email, userId)

        const teamId =
          user.teamName === 'Sales Team'
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
  console.log('\n📝 Creating sample assessments...')

  const manager1Id = userIdMap.get('manager1@test.com')!
  const manager2Id = userIdMap.get('manager2@test.com')!
  const trainer1Id = userIdMap.get('trainer1@test.com')!
  const trainer2Id = userIdMap.get('trainer2@test.com')!
  const trainer3Id = userIdMap.get('trainer3@test.com')!
  const trainer4Id = userIdMap.get('trainer4@test.com')!

  const assessments = [
    {
      trainer_id: trainer3Id,
      assessor_id: manager1Id,
      assessment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      trainers_readiness: 4,
      trainers_readiness_comments: 'Carol demonstrated excellent preparation for the training session. All materials were well-organized and she arrived early to set up. The session flow was clearly planned and executed smoothly.',
      communication_skills: 5,
      communication_skills_comments: 'Outstanding communication skills. Carol explained complex concepts in a clear and engaging manner. She maintained excellent eye contact and used appropriate body language throughout. Participants were fully engaged.',
      domain_expertise: 4,
      domain_expertise_comments: 'Strong domain expertise demonstrated. Carol showed deep understanding of the subject matter and was able to answer all questions confidently. She provided relevant examples from real-world scenarios.',
      knowledge_displayed: 5,
      knowledge_displayed_comments: 'Carol displayed exceptional knowledge throughout the session. She seamlessly integrated advanced concepts and provided valuable insights. Her ability to connect theory with practice was impressive.',
      people_management: 4,
      people_management_comments: 'Good people management skills. Carol effectively managed the group dynamics and ensured all participants were included. She handled questions professionally and maintained a positive learning environment.',
      technical_skills: 4,
      technical_skills_comments: 'Proficient with technical tools. Carol navigated the platform smoothly and used screen sharing effectively. Minor improvements could be made in managing breakout rooms, but overall technical competence was solid.',
      overall_comments: 'Overall, Carol delivered an excellent training session. Her preparation, communication, and subject matter expertise were outstanding. The participants provided very positive feedback. I would recommend her for advanced training sessions.',
    },
    {
      trainer_id: trainer4Id,
      assessor_id: manager1Id,
      assessment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      trainers_readiness: 3,
      trainers_readiness_comments: 'David was adequately prepared for the session. Most materials were ready, though there were a few minor delays in accessing some resources. Overall preparation was satisfactory but could be improved.',
      communication_skills: 4,
      communication_skills_comments: 'Good communication skills. David spoke clearly and at an appropriate pace. He explained concepts well and used visual aids effectively. Some participants mentioned they would appreciate more interactive elements.',
      domain_expertise: 3,
      domain_expertise_comments: 'Solid domain knowledge with room for growth. David demonstrated good understanding of the core concepts but struggled slightly with some advanced questions. He handled this professionally by noting he would follow up.',
      knowledge_displayed: 4,
      knowledge_displayed_comments: 'David displayed good knowledge throughout the session. He was able to explain most concepts clearly and provided relevant examples. His presentation was well-structured and easy to follow.',
      people_management: 3,
      people_management_comments: 'Adequate people management. David maintained a professional atmosphere and tried to engage all participants. However, some quieter participants may have needed more encouragement to participate actively.',
      technical_skills: 5,
      technical_skills_comments: 'Excellent technical skills. David demonstrated mastery of all technical tools. His screen sharing was flawless, and he managed all technical aspects smoothly. This was a clear strength of his presentation.',
      overall_comments: 'David delivered a solid training session with particular strength in technical execution. His communication and domain knowledge were good, with opportunities for improvement in preparation and people management. Overall, a satisfactory performance with clear potential for growth.',
    },
    {
      trainer_id: trainer1Id,
      assessor_id: manager2Id,
      assessment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      trainers_readiness: 5,
      trainers_readiness_comments: 'Alice was exceptionally well-prepared. She had all materials ready well in advance and even prepared backup resources. The session structure was clear and well-thought-out. Excellent preparation demonstrated.',
      communication_skills: 5,
      communication_skills_comments: 'Exceptional communication skills. Alice has a natural ability to connect with her audience. Her explanations were clear, engaging, and appropriately paced. She used storytelling effectively to illustrate key points.',
      domain_expertise: 5,
      domain_expertise_comments: 'Outstanding domain expertise. Alice demonstrated deep and comprehensive knowledge of the subject. She answered all questions with confidence and provided additional valuable insights beyond the core curriculum.',
      knowledge_displayed: 5,
      knowledge_displayed_comments: 'Alice displayed exceptional knowledge throughout. She seamlessly integrated advanced concepts and real-world applications. Her ability to make complex topics accessible was particularly impressive.',
      people_management: 5,
      people_management_comments: 'Excellent people management. Alice created an inclusive and engaging learning environment. She effectively managed group dynamics, encouraged participation from all attendees, and handled questions with grace and professionalism.',
      technical_skills: 4,
      technical_skills_comments: 'Very good technical skills. Alice navigated the platform effectively and used all tools appropriately. There were minor moments where transitions could have been smoother, but overall technical execution was strong.',
      overall_comments: 'Alice delivered an outstanding training session that exceeded expectations. Her preparation, communication, and expertise were exceptional. Participants provided overwhelmingly positive feedback. Alice is clearly a top-tier trainer and I would highly recommend her for any training assignment.',
    },
    {
      trainer_id: trainer2Id,
      assessor_id: manager2Id,
      assessment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      trainers_readiness: 4,
      trainers_readiness_comments: 'Bob was well-prepared for the session. Materials were organized and he arrived on time. The session structure was clear, though some additional preparation for potential questions would have been beneficial.',
      communication_skills: 4,
      communication_skills_comments: 'Good communication skills. Bob spoke clearly and maintained good engagement with the audience. He explained concepts effectively and used examples well. Some participants suggested more visual aids could enhance the presentation.',
      domain_expertise: 4,
      domain_expertise_comments: 'Strong domain knowledge demonstrated. Bob showed good understanding of the subject matter and was able to address most questions confidently. He provided relevant examples and connected concepts well.',
      knowledge_displayed: 4,
      knowledge_displayed_comments: 'Bob displayed solid knowledge throughout the session. He explained concepts clearly and provided good examples. His presentation was well-organized and easy to follow for participants at various skill levels.',
      people_management: 4,
      people_management_comments: 'Good people management skills. Bob maintained a positive learning environment and encouraged participation. He handled questions professionally and ensured all participants felt included in the discussion.',
      technical_skills: 3,
      technical_skills_comments: 'Adequate technical skills. Bob managed the basic technical requirements well, though there were a few minor technical hiccups with screen sharing. With some additional practice, technical execution could be improved.',
      overall_comments: 'Bob delivered a good training session with solid performance across most areas. His communication and domain knowledge were strong. The main area for improvement is technical execution, but overall he provided value to the participants.',
    },
  ]

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
      console.log(`  ✅ Created assessment`)
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
    console.log('  - 6 Users created (2 managers, 4 trainers)')
    console.log('  - 6 Profiles created')
    console.log('  - 4 Assessments created')
    console.log('\n🔐 Test Credentials:')
    console.log('  All users have password: Test@123456')
    console.log('  - manager1@test.com (Sarah Johnson)')
    console.log('  - manager2@test.com (John Smith)')
    console.log('  - trainer1@test.com (Alice Williams)')
    console.log('  - trainer2@test.com (Bob Davis)')
    console.log('  - trainer3@test.com (Carol Brown)')
    console.log('  - trainer4@test.com (David Miller)')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()

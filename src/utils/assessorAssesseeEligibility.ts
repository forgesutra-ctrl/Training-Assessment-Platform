/**
 * Assessor–Assessee eligibility (conflict-of-interest control).
 * Base rules: no self-assessment, no direct/indirect reportees.
 * Admin overrides: allow (can assess despite reportee) or block (cannot assess).
 */

import { supabase } from '@/lib/supabase'

export type OverrideType = 'allow' | 'block'

export interface AssessorAssesseeOverride {
  id: string
  assessor_id: string
  assessee_id: string
  override_type: OverrideType
  created_at?: string
  created_by?: string | null
}

/** Build set of all profile IDs that report (directly or indirectly) to managerId */
function buildReporteeIds(managerId: string, profiles: { id: string; reporting_manager_id: string | null }[]): Set<string> {
  const reportees = new Set<string>()
  let current = new Set<string>([managerId])
  let added = true
  while (added) {
    added = false
    const next = new Set<string>()
    for (const p of profiles) {
      if (p.reporting_manager_id && current.has(p.reporting_manager_id)) {
        if (!reportees.has(p.id)) {
          reportees.add(p.id)
          next.add(p.id)
          added = true
        }
      }
    }
    next.forEach((id) => current.add(id))
  }
  return reportees
}

/**
 * Get eligible trainer IDs for an assessor.
 * Base rules: no self, no direct/indirect reportees.
 * Overrides: block = cannot assess; allow = can assess (e.g. cross-functional).
 */
export async function getEligibleTrainerIdsForAssessor(assessorId: string): Promise<string[]> {
  const [trainersRes, profilesRes, overridesRes] = await Promise.all([
    supabase.from('profiles').select('id').eq('role', 'trainer'),
    supabase.from('profiles').select('id, reporting_manager_id'),
    supabase.from('assessor_assessee_overrides').select('assessee_id, override_type').eq('assessor_id', assessorId),
  ])

  // If overrides table doesn't exist (404 / PGRST116), use empty overrides
  const trainers = trainersRes?.data ?? []
  const profilesForTree = profilesRes?.data ?? []
  let overrides = overridesRes?.data ?? []
  if (overridesRes?.error) {
    const code = (overridesRes.error as any)?.code
    const status = (overridesRes.error as any)?.status
    if (code === 'PGRST116' || status === 404 || (overridesRes.error?.message || '').includes('schema cache')) {
      overrides = []
    } else {
      throw overridesRes.error
    }
  }

  const trainerIds = new Set((trainers || []).map((t: any) => t.id))
  const profiles = profilesForTree || []
  const reporteeIds = buildReporteeIds(assessorId, profiles)
  const allowSet = new Set(
    (overrides || []).filter((o: any) => o.override_type === 'allow').map((o: any) => o.assessee_id)
  )
  const blockSet = new Set(
    (overrides || []).filter((o: any) => o.override_type === 'block').map((o: any) => o.assessee_id)
  )

  const eligible: string[] = []
  for (const tid of trainerIds) {
    if (tid === assessorId) continue // no self
    if (blockSet.has(tid)) continue // admin blocked
    if (reporteeIds.has(tid) && !allowSet.has(tid)) continue // in reporting line and not allowed
    if (!reporteeIds.has(tid) || allowSet.has(tid)) eligible.push(tid)
  }
  return eligible
}

/**
 * Fetch all assessor-assessee overrides (admin only).
 * Returns { data, tableMissing } so UI can show "run migration" when table doesn't exist.
 */
export async function fetchAssessorAssesseeOverrides(): Promise<{
  data: AssessorAssesseeOverride[]
  tableMissing?: boolean
}> {
  const { data, error } = await supabase
    .from('assessor_assessee_overrides')
    .select('id, assessor_id, assessee_id, override_type, created_at, created_by')
    .order('assessor_id')
  if (error) {
    const code = (error as any)?.code
    const status = (error as any)?.status
    const msg = (error?.message || '').toLowerCase()
    if (code === 'PGRST116' || status === 404 || msg.includes('schema cache') || msg.includes('could not find')) {
      return { data: [], tableMissing: true }
    }
    throw error
  }
  return { data: (data || []) as AssessorAssesseeOverride[] }
}

/**
 * Create or replace an override (admin only).
 */
export async function upsertAssessorAssesseeOverride(
  assessorId: string,
  assesseeId: string,
  overrideType: OverrideType,
  createdBy: string
): Promise<AssessorAssesseeOverride> {
  const { data, error } = await supabase
    .from('assessor_assessee_overrides')
    .upsert(
      { assessor_id: assessorId, assessee_id: assesseeId, override_type: overrideType, created_by: createdBy },
      { onConflict: 'assessor_id,assessee_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data as AssessorAssesseeOverride
}

/**
 * Delete an override (admin only).
 */
export async function deleteAssessorAssesseeOverride(id: string): Promise<void> {
  const { error } = await supabase.from('assessor_assessee_overrides').delete().eq('id', id)
  if (error) throw error
}

import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  fetchAssessorAssesseeOverrides,
  upsertAssessorAssesseeOverride,
  deleteAssessorAssesseeOverride,
  type AssessorAssesseeOverride,
  type OverrideType,
} from '@/utils/assessorAssesseeEligibility'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface OverrideWithNames extends AssessorAssesseeOverride {
  assessor_name?: string
  assessee_name?: string
}

export default function AssessorAssesseeMapping() {
  const { user } = useAuthContext()
  const [overrides, setOverrides] = useState<OverrideWithNames[]>([])
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([])
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAssessorId, setNewAssessorId] = useState('')
  const [newAssesseeId, setNewAssesseeId] = useState('')
  const [newType, setNewType] = useState<OverrideType>('allow')

  const [tableMissing, setTableMissing] = useState(false)

  const load = async () => {
    setLoading(true)
    setTableMissing(false)
    try {
      const overridesResult = await fetchAssessorAssesseeOverrides()
      const list = overridesResult.data
      if (overridesResult.tableMissing) setTableMissing(true)
      const { data: managersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'manager').order('full_name')
      const { data: trainersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'trainer').order('full_name')
      setManagers(managersData || [])
      setTrainers(trainersData || [])

      const ids = new Set<string>()
      list.forEach((o) => {
        ids.add(o.assessor_id)
        ids.add(o.assessee_id)
      })
      const profileIds = [...ids]
      if (profileIds.length === 0) {
        setOverrides(list as OverrideWithNames[])
        return
      }
      const query = supabase.from('profiles').select('id, full_name')
      const { data: profiles } =
        profileIds.length === 1 ? await query.eq('id', profileIds[0]) : await query.in('id', profileIds)
      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]))
      setOverrides(
        list.map((o) => ({
          ...o,
          assessor_name: nameMap.get(o.assessor_id) ?? '—',
          assessee_name: nameMap.get(o.assessee_id) ?? '—',
        }))
      )
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load overrides')
      setOverrides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newAssessorId || !newAssesseeId) {
      toast.error('Select assessor and assessee')
      return
    }
    if (newAssessorId === newAssesseeId) {
      toast.error('Assessor and assessee must be different')
      return
    }
    setSaving(true)
    try {
      await upsertAssessorAssesseeOverride(newAssessorId, newAssesseeId, newType, user.id)
      toast.success('Override saved')
      setNewAssessorId('')
      setNewAssesseeId('')
      load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save override')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAssessorAssesseeOverride(id)
      toast.success('Override removed')
      load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete')
    }
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading assessor–assessee overrides..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Assessor–Assessee Mapping</h2>
      </div>
      {tableMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Table not found</p>
          <p className="text-sm mt-1">
            Run the migration <code className="bg-amber-100 px-1 rounded">migrations/assessor-assessee-overrides.sql</code> in your Supabase SQL editor to create <code className="bg-amber-100 px-1 rounded">assessor_assessee_overrides</code>. Until then, eligibility follows base rules only (no overrides).
          </p>
        </div>
      )}
      <p className="text-gray-600 max-w-2xl">
        Control who can assess whom. Base rules: no self-assessment, no direct/indirect reportees.
        Use <strong>Allow</strong> to let an assessor assess someone in their reporting line (e.g. cross-functional).
        Use <strong>Block</strong> to prevent a specific assessor–assessee pair.
      </p>

      <form onSubmit={handleAdd} className="card max-w-2xl space-y-4">
        <h3 className="font-semibold text-gray-900">Add override</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessor (manager)</label>
            <select
              value={newAssessorId}
              onChange={(e) => setNewAssessorId(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">Select assessor</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessee (trainer)</label>
            <select
              value={newAssesseeId}
              onChange={(e) => setNewAssesseeId(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">Select assessee</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as OverrideType)}
              className="input-field w-full"
            >
              <option value="allow">Allow (can assess)</option>
              <option value="block">Block (cannot assess)</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {saving ? 'Saving...' : 'Add override'}
        </button>
      </form>

      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-900 mb-4">Current overrides</h3>
        {overrides.length === 0 ? (
          <p className="text-gray-500 py-4">No overrides. Eligibility follows base rules only.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assessor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assessee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overrides.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{o.assessor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{o.assessee_name}</td>
                    <td className="px-4 py-3">
                      {o.override_type === 'allow' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                          <UserCheck className="w-3 h-3" /> Allow
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                          <UserX className="w-3 h-3" /> Block
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(o.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove override"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

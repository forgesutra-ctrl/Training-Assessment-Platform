import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { ASSESSMENT_STRUCTURE, type AssessmentWithDetails } from '@/types'
import { updateAssessment } from '@/utils/assessments'
import StarRating from '@/components/StarRating'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface AdminEditAssessmentModalProps {
  assessment: AssessmentWithDetails
  onSave: () => void
  onClose: () => void
}

export default function AdminEditAssessmentModal({ assessment, onSave, onClose }: AdminEditAssessmentModalProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, number | string | null>>({})

  useEffect(() => {
    const data: Record<string, number | string | null> = {
      assessment_date: assessment.assessment_date,
      overall_comments: assessment.overall_comments ?? '',
    }
    ASSESSMENT_STRUCTURE.categories.forEach((category) => {
      category.parameters.forEach((param) => {
        data[param.id] = (assessment as any)[param.id] ?? null
        data[`${param.id}_comments`] = (assessment as any)[`${param.id}_comments`] ?? ''
      })
    })
    setFormData(data)
  }, [assessment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updates: Record<string, number | string | null> = {
        assessment_date: formData.assessment_date ?? assessment.assessment_date,
        overall_comments: formData.overall_comments ?? null,
      }
      ASSESSMENT_STRUCTURE.categories.forEach((category) => {
        category.parameters.forEach((param) => {
          updates[param.id] = formData[param.id] ?? null
          updates[`${param.id}_comments`] = formData[`${param.id}_comments`] ?? null
        })
      })
      await updateAssessment(assessment.id, updates)
      toast.success('Assessment updated')
      onSave()
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update assessment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Assessment (Admin)</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form id="admin-edit-assessment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Trainer: {assessment.trainer_name} · Assessor: {assessment.assessor_name} · Date:{' '}
            {new Date(assessment.assessment_date).toLocaleDateString()}
          </p>
          {ASSESSMENT_STRUCTURE.categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h3>
              {category.parameters.map((param) => (
                <div key={param.id} className="grid grid-cols-1 gap-2">
                  <label className="text-sm font-medium text-gray-700">{param.label}</label>
                  <div className="flex items-center gap-4">
                    <StarRating
                      value={(formData[param.id] as number) ?? 0}
                      onChange={(v) => setFormData((prev) => ({ ...prev, [param.id]: v }))}
                    />
                  </div>
                  <textarea
                    value={(formData[`${param.id}_comments`] as string) ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [`${param.id}_comments`]: e.target.value }))
                    }
                    rows={2}
                    className="input-field text-sm resize-none"
                    placeholder="Comments (optional for 4–5)"
                  />
                </div>
              ))}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Comments</label>
            <textarea
              value={(formData.overall_comments as string) ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, overall_comments: e.target.value }))}
              rows={4}
              className="input-field resize-none"
              placeholder="Overall feedback (min 20 characters)"
            />
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="admin-edit-assessment-form" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

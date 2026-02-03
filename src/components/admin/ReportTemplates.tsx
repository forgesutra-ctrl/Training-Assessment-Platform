import { useState, useEffect } from 'react'
import { FileText, Download, Edit, Calendar, Users, TrendingUp, Award, Plus, X, List } from 'lucide-react'
import { exportToExcel, exportToCSV, exportReportToPDF, type ReportPDFSection } from '@/utils/reporting'
import { fetchMonthlyTrends, fetchQuarterlyData, fetchAllTrainersWithStats, fetchManagerActivity, fetchItemizedReportData } from '@/utils/adminQueries'
import toast from 'react-hot-toast'

const REPORT_TEMPLATES_STORAGE_KEY = 'taps_report_templates'
const REPORT_CUSTOMIZE_STORAGE_KEY = 'taps_report_customize'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: string
  period: string
}

const defaultTemplates: ReportTemplate[] = [
    {
      id: 'monthly-review',
      name: 'Monthly Performance Review',
      description: 'Comprehensive monthly assessment summary with trends and insights',
      icon: Calendar,
      category: 'Performance',
      period: 'Monthly',
    },
    {
      id: 'quarterly-qbr',
      name: 'Quarterly Business Review (QBR)',
      description: 'Executive summary for quarterly business reviews',
      icon: TrendingUp,
      category: 'Executive',
      period: 'Quarterly',
    },
    {
      id: 'annual-report',
      name: 'Annual Training Report',
      description: 'Year-end comprehensive training effectiveness report',
      icon: FileText,
      category: 'Executive',
      period: 'Annual',
    },
    {
      id: 'team-capability',
      name: 'Team Capability Assessment',
      description: 'Detailed analysis of team capabilities and skill gaps',
      icon: Users,
      category: 'Team',
      period: 'On-Demand',
    },
    {
      id: 'individual-dev',
      name: 'Individual Development Plan',
      description: 'Personalized development plan for individual trainers',
      icon: Award,
      category: 'Individual',
      period: 'On-Demand',
    },
    {
      id: 'manager-activity',
      name: 'Manager Activity Report',
      description: 'Assessment activity and engagement metrics for managers',
      icon: TrendingUp,
      category: 'Management',
      period: 'Monthly',
    },
    {
      id: 'itemized-report',
      name: 'Itemized Report (By Assessor / By Trainer)',
      description: 'Detailed report by assessor and by trainer: assessment count, each assessment date, scoring, and all 21 parameter scores. Download as Excel (two sheets) or CSV.',
      icon: List,
      category: 'Management',
      period: 'On-Demand',
    },
  ]

const ReportTemplates = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(REPORT_TEMPLATES_STORAGE_KEY)
      const byId = new Map(defaultTemplates.map((d) => [d.id, d.icon]))
      if (stored) {
        const parsed = JSON.parse(stored) as (Omit<ReportTemplate, 'icon'> & { icon?: unknown })[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map((t) => ({
            ...t,
            icon: byId.get(t.id) ?? FileText,
          })) as ReportTemplate[]
          // Ensure built-in Itemized Report is present (for users who saved before it was added)
          if (!list.some((t) => t.id === 'itemized-report')) {
            const itemized = defaultTemplates.find((d) => d.id === 'itemized-report')
            if (itemized) list.push(itemized)
          }
          return list
        }
      }
    } catch (_) {}
    return defaultTemplates
  })
  const [customize, setCustomize] = useState<Record<string, { dateFrom?: string; dateTo?: string }>>(() => {
    try {
      const stored = localStorage.getItem(REPORT_CUSTOMIZE_STORAGE_KEY)
      if (stored) return JSON.parse(stored) as Record<string, { dateFrom?: string; dateTo?: string }>
    } catch (_) {}
    return {}
  })
  const [customizeModal, setCustomizeModal] = useState<{ templateId: string; name: string } | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(REPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    } catch (_) {}
  }, [templates])

  const saveCustomize = (templateId: string, opts: { dateFrom?: string; dateTo?: string }) => {
    const next = { ...customize, [templateId]: opts }
    setCustomize(next)
    try {
      localStorage.setItem(REPORT_CUSTOMIZE_STORAGE_KEY, JSON.stringify(next))
    } catch (_) {}
  }

  async function loadReportData(templateId: string) {
    const opts = customize[templateId] || {}
    const now = new Date()
    const dateTo = opts.dateTo || now.toISOString().split('T')[0]
    const dateFrom = opts.dateFrom || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const hasCustomRange = !!(opts.dateFrom && opts.dateTo)

    const excelSheets: Record<string, any[]> = {}
    let csvRows: any[] = []
    const pdfSections: ReportPDFSection[] = []

    const inRange = (monthStr: string, from: string, to: string) => {
      const [m, y] = monthStr.replace(',', '').split(' ')
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const mi = months.indexOf(m)
      if (mi === -1) return true
      const d = new Date(parseInt(y, 10), mi, 1)
      const dStr = d.toISOString().split('T')[0]
      return dStr >= from && dStr <= to
    }
    const quarterInRange = (q: { quarter: string; year: number }, from: string, to: string) => {
      const qNum = parseInt(q.quarter.replace('Q', ''), 10)
      if (isNaN(qNum)) return true
      const start = new Date(q.year, (qNum - 1) * 3, 1).toISOString().split('T')[0]
      const end = new Date(q.year, qNum * 3, 0).toISOString().split('T')[0]
      return start <= to && end >= from
    }
    const derivedRange = (): 'all-time' | 'last-12-months' | 'last-6-months' | 'month' | 'quarter' | 'ytd' => {
      if (!opts.dateFrom || !opts.dateTo) return 'all-time'
      const a = new Date(opts.dateFrom).getTime()
      const b = new Date(opts.dateTo).getTime()
      const days = (b - a) / (1000 * 60 * 60 * 24)
      if (days <= 35) return 'month'
      if (days <= 100) return 'quarter'
      if (days <= 200) return 'last-6-months'
      if (days <= 400) return 'last-12-months'
      return 'all-time'
    }

    switch (templateId) {
      case 'monthly-review': {
        const trends = await fetchMonthlyTrends(12)
        const filtered = hasCustomRange ? trends.filter((t) => inRange(t.month, dateFrom, dateTo)) : trends
        const rows = filtered.map((t) => ({ Month: t.month, 'Avg Rating': t.average_rating, Assessments: t.assessment_count, Trainers: t.trainers_assessed }))
        excelSheets['Monthly Trends'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Monthly Performance', rows })
        break
      }
      case 'quarterly-qbr': {
        const quarters = await fetchQuarterlyData()
        const filtered = hasCustomRange ? quarters.filter((q) => quarterInRange(q, dateFrom, dateTo)) : quarters
        const rows = filtered.map((q) => ({ Quarter: q.quarter, 'Avg Rating': q.average_rating, Assessments: q.assessment_count, Year: q.year }))
        excelSheets['Quarterly Summary'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Quarterly Business Review', rows })
        break
      }
      case 'annual-report': {
        const [trends, quarters] = await Promise.all([fetchMonthlyTrends(12), fetchQuarterlyData()])
        const tr = (hasCustomRange ? trends.filter((t) => inRange(t.month, dateFrom, dateTo)) : trends).map((t) => ({ Month: t.month, 'Avg Rating': t.average_rating, Assessments: t.assessment_count }))
        const qr = (hasCustomRange ? quarters.filter((q) => quarterInRange(q, dateFrom, dateTo)) : quarters).map((q) => ({ Quarter: q.quarter, 'Avg Rating': q.average_rating, Assessments: q.assessment_count }))
        excelSheets['Monthly'] = tr
        excelSheets['Quarterly'] = qr
        csvRows = tr.length ? tr : qr
        pdfSections.push({ title: 'Monthly Trends', rows: tr }, { title: 'Quarterly Summary', rows: qr })
        break
      }
      case 'team-capability': {
        const dateRange = derivedRange()
        const trainers = await fetchAllTrainersWithStats(dateRange)
        const rows = trainers.map((t) => ({ Trainer: t.full_name, Team: t.team_name ?? '—', 'All-Time Avg': t.all_time_avg, 'Month Avg': t.current_month_avg, Total: t.total_assessments }))
        excelSheets['Team Capability'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Team Capability & Skill Overview', rows })
        break
      }
      case 'individual-dev': {
        const dateRange = derivedRange()
        const trainers = await fetchAllTrainersWithStats(dateRange)
        const rows = trainers.map((t) => ({ Trainer: t.full_name, Team: t.team_name ?? '—', 'All-Time Avg': t.all_time_avg, Trend: t.trend, Assessments: t.total_assessments }))
        excelSheets['Individual Development'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Individual Development Snapshot', rows })
        break
      }
      case 'manager-activity': {
        const managers = await fetchManagerActivity()
        const rows = managers.map((m) => ({ Manager: m.full_name, Team: m.team_name ?? '—', 'This Month': m.assessments_this_month, 'This Quarter': m.assessments_this_quarter, 'This Year': m.assessments_this_year, 'All-Time': m.all_time_total, 'Avg Rating Given': m.avg_rating_given > 0 ? m.avg_rating_given.toFixed(2) : '—', 'Last Assessment': m.last_assessment_date ? new Date(m.last_assessment_date).toLocaleDateString() : 'Never' }))
        excelSheets['Manager Activity'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Manager Activity & Engagement', rows })
        break
      }
      case 'itemized-report': {
        const itemized = await fetchItemizedReportData()
        const assessorCounts = itemized.reduce((acc, row) => {
          acc[row.assessor_id] = (acc[row.assessor_id] ?? 0) + 1
          return acc
        }, {} as Record<string, number>)
        const trainerCounts = itemized.reduce((acc, row) => {
          acc[row.trainer_id] = (acc[row.trainer_id] ?? 0) + 1
          return acc
        }, {} as Record<string, number>)
        const paramLabels = itemized[0]?.paramScores.map((p) => p.label) ?? []
        const byAssessorRows = itemized.map((row) => {
          const rec: Record<string, string | number> = {
            'Assessor Name': row.assessor_name,
            'Assessment Count': assessorCounts[row.assessor_id] ?? 0,
            'Assessment Date': row.assessment_date,
            'Trainer Assessed': row.trainer_name,
            'Overall Score': row.average_score,
          }
          row.paramScores.forEach((p) => {
            rec[p.label] = p.value != null ? p.value : ''
          })
          return rec
        })
        const byTrainerRows = itemized.map((row) => {
          const rec: Record<string, string | number> = {
            'Trainer Name': row.trainer_name,
            'Assessment Count': trainerCounts[row.trainer_id] ?? 0,
            'Assessment Date': row.assessment_date,
            'Assessor': row.assessor_name,
            'Overall Score': row.average_score,
          }
          row.paramScores.forEach((p) => {
            rec[p.label] = p.value != null ? p.value : ''
          })
          return rec
        })
        excelSheets['By Assessor'] = byAssessorRows
        excelSheets['By Trainer'] = byTrainerRows
        csvRows = byAssessorRows
        pdfSections.push({ title: 'Itemized Report – By Assessor', rows: byAssessorRows.slice(0, 100) }, { title: 'Itemized Report – By Trainer', rows: byTrainerRows.slice(0, 100) })
        break
      }
      default: {
        const dateRange = derivedRange()
        const trainers = await fetchAllTrainersWithStats(dateRange)
        const rows = trainers.map((t) => ({ Name: t.full_name, Team: t.team_name ?? '—', Avg: t.all_time_avg, Assessments: t.total_assessments }))
        excelSheets['Report'] = rows
        csvRows = rows
        pdfSections.push({ title: 'Report', rows })
      }
    }

    return { excelSheets, csvRows, pdfSections }
  }

  const handleGenerateReport = async (templateId: string, templateName: string, format: 'excel' | 'pdf' | 'csv') => {
    const key = `${templateId}-${format}`
    if (generating === key) return
    try {
      setGenerating(key)
      toast.loading(`Generating ${templateName} (${format.toUpperCase()})...`)
      const { excelSheets, csvRows, pdfSections } = await loadReportData(templateId)
      const safeName = templateName.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50)

      switch (format) {
        case 'excel':
          await exportToExcel(excelSheets, safeName)
          break
        case 'pdf':
          exportReportToPDF(templateName, pdfSections, safeName)
          break
        case 'csv':
          exportToCSV(csvRows.length ? csvRows : [{ Report: safeName, Generated: new Date().toISOString().split('T')[0], Message: 'No data' }], safeName)
          break
      }

      toast.dismiss()
      toast.success(`${templateName} (${format.toUpperCase()}) downloaded`)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error?.message || 'Failed to generate report')
    } finally {
      setGenerating(null)
    }
  }

  const handleCustomize = (template: ReportTemplate) => {
    setCustomizeModal({ templateId: template.id, name: template.name })
  }

  const handleAddTemplate = (newT: { name: string; description: string; category: string; period: string }) => {
    const id = `custom-${Date.now()}`
    setTemplates((prev) => [...prev, { ...newT, id, icon: FileText }])
    setAddModalOpen(false)
    toast.success('Template added')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pre-built report templates ready to generate and customize
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = template.icon || FileText
          const key = `${template.id}-${template.name}`
          const isGenerating = generating !== null
          return (
            <div key={key} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs text-gray-500">{template.period}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCustomize(template)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Customize date range"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {template.category}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                {template.id !== 'itemized-report' && (
                  <button
                    onClick={() => handleGenerateReport(template.id, template.name, 'pdf')}
                    disabled={isGenerating}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                )}
                <button
                  onClick={() => handleGenerateReport(template.id, template.name, 'excel')}
                  disabled={isGenerating}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleGenerateReport(template.id, template.name, 'csv')}
                  disabled={isGenerating}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom Template Builder */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Create Custom Template</h3>
            <p className="text-sm text-gray-600">
              Add a new report template; it will use trainer summary data and support PDF, Excel, and CSV.
            </p>
          </div>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Customize modal */}
      {customizeModal && (
        <CustomizeModal
          templateId={customizeModal.templateId}
          name={customizeModal.name}
          opts={customize[customizeModal.templateId] || {}}
          onSave={(opts) => {
            saveCustomize(customizeModal.templateId, opts)
            setCustomizeModal(null)
            toast.success('Customization saved')
          }}
          onClose={() => setCustomizeModal(null)}
        />
      )}

      {/* Add template modal */}
      {addModalOpen && (
        <AddTemplateModal
          onAdd={handleAddTemplate}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </div>
  )
}

function CustomizeModal({
  templateId,
  name,
  opts,
  onSave,
  onClose,
}: {
  templateId: string
  name: string
  opts: { dateFrom?: string; dateTo?: string }
  onSave: (opts: { dateFrom?: string; dateTo?: string }) => void
  onClose: () => void
}) {
  const [dateFrom, setDateFrom] = useState(opts.dateFrom || '')
  const [dateTo, setDateTo] = useState(opts.dateTo || new Date().toISOString().split('T')[0])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customize: {name}</h3>
        <p className="text-sm text-gray-600 mb-4">Set date range used when generating this report (optional).</p>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <label className="block text-sm font-medium text-gray-700">To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={() => onSave({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

function AddTemplateModal({ onAdd, onClose }: { onAdd: (t: { name: string; description: string; category: string; period: string }) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Custom')
  const [period, setPeriod] = useState('On-Demand')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Report Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Snapshot"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Custom</option>
              <option>Performance</option>
              <option>Executive</option>
              <option>Team</option>
              <option>Individual</option>
              <option>Management</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>On-Demand</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) { toast.error('Name is required'); return }
              onAdd({ name: name.trim(), description: description.trim() || name.trim(), category, period })
            }}
            className="btn-primary"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportTemplates

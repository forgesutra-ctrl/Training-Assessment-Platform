import { useState } from 'react'
import { FileText, Download, Edit, Calendar, Users, TrendingUp, Award } from 'lucide-react'
import { exportToExcel, exportToPDF, exportToCSV } from '@/utils/reporting'
import toast from 'react-hot-toast'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: string
  period: string
}

const ReportTemplates = () => {
  const [templates] = useState<ReportTemplate[]>([
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
  ])

  const handleGenerateReport = async (templateId: string, format: 'excel' | 'pdf' | 'csv') => {
    try {
      toast.loading(`Generating ${templateId} report...`)
      
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Export based on format
      switch (format) {
        case 'excel':
          await exportToExcel({ 'Report': [] }, templateId)
          break
        case 'pdf':
          exportToPDF('report-content', templateId)
          break
        case 'csv':
          exportToCSV([], templateId)
          break
      }
      
      toast.dismiss()
      toast.success('Report generated successfully!')
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to generate report')
    }
  }

  const handleCustomize = (templateId: string) => {
      toast('Customization feature coming soon', { icon: 'ℹ️' })
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
          const Icon = template.icon
          return (
            <div key={template.id} className="card hover:shadow-lg transition-shadow">
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
                  onClick={() => handleCustomize(template.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Customize"
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
                <button
                  onClick={() => handleGenerateReport(template.id, 'pdf')}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleGenerateReport(template.id, 'excel')}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleGenerateReport(template.id, 'csv')}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
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
              Build your own report template with custom metrics and visualizations
            </p>
          </div>
          <button
            onClick={() => toast('Custom template builder coming soon', { icon: 'ℹ️' })}
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

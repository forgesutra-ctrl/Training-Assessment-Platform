import { useState, useRef } from 'react'
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CreateUserData, BulkCreateResult } from '@/types'
import { bulkCreateUsers, parseCSV, validateCSVRow, downloadCSVTemplate } from '@/utils/userManagement'
import { useAuthContext } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CSVRow {
  row: number
  data: string[]
  valid: boolean
  errors: string[]
  warnings: string[]
  parsedData?: CreateUserData
}

const BulkUploadModal = ({ isOpen, onClose, onSuccess }: BulkUploadModalProps) => {
  const { user } = useAuthContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [importResult, setImportResult] = useState<BulkCreateResult | null>(null)
  const [teams, setTeams] = useState<Array<{ id: string; team_name: string }>>([])
  const [managers, setManagers] = useState<Array<{ id: string; email: string; full_name: string }>>([])

  const loadTeams = async () => {
    const { data } = await supabase.from('teams').select('id, team_name')
    if (data) setTeams(data)
    return data || []
  }

  const loadManagers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'manager')

    // Get emails from auth (requires service role key - will fail if not available)
    let authUsers: any = null
    try {
      const { data } = await supabase.auth.admin.listUsers()
      authUsers = data
    } catch (error) {
      console.warn('Cannot fetch user emails: Admin API requires service role key. Emails will be empty.')
    }
    
    const managersWithEmail = (data || []).map((m) => {
      const authUser = authUsers?.users?.find((u: any) => u.id === m.id)
      return {
        id: m.id,
        email: authUser?.email || '',
        full_name: m.full_name,
      }
    })
    setManagers(managersWithEmail)
    return managersWithEmail
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    try {
      setLoading(true)
      const text = await file.text()
      const parsed = parseCSV(text)

      if (parsed.length === 0) {
        toast.error('CSV file is empty')
        return
      }

      setHeaders(parsed[0])
      
      // Load teams and managers first
      const teamsData = await loadTeams()
      const managersData = await loadManagers()

      // Validate each row
      const validatedRows: CSVRow[] = parsed.slice(1).map((row, index) => {
        const validation = validateCSVRow(row, parsed[0], index + 2)
        let parsedData: CreateUserData | undefined

        if (validation.valid) {
          // Parse into CreateUserData
          const teamName = row[3]?.trim()
          const team = teamsData.find((t) => t.team_name === teamName)
          const managerEmail = row[4]?.trim()
          const manager = managersData.find((m) => m.email === managerEmail)

          parsedData = {
            full_name: row[0]?.trim() || '',
            email: row[1]?.trim() || '',
            role: (row[2]?.trim().toLowerCase() || 'trainer') as 'admin' | 'manager' | 'trainer',
            team_id: team?.id || null,
            reporting_manager_id: manager?.id || null,
            auto_generate_password: true,
            send_welcome_email: true,
          }
        }

        return {
          row: index + 2,
          data: row,
          valid: validation.valid,
          errors: validation.errors,
          warnings: [],
          parsedData,
        }
      })

      setCsvRows(validatedRows)
    } catch (error: any) {
      console.error('Error parsing CSV:', error)
      toast.error('Failed to parse CSV file')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleImport = async () => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    const validRows = csvRows.filter((r) => r.valid && r.parsedData)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    try {
      setUploading(true)
      const usersToCreate = validRows.map((r) => r.parsedData!).filter(Boolean)
      const result = await bulkCreateUsers(usersToCreate, user.id)
      setImportResult(result)
      toast.success(`Imported ${result.success} users successfully`)
      if (result.failed > 0) {
        toast.error(`${result.failed} users failed to import`)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Error importing users:', error)
      toast.error('Failed to import users')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setCsvRows([])
    setHeaders([])
    setImportResult(null)
    onClose()
  }

  if (!isOpen) return null

  const validCount = csvRows.filter((r) => r.valid).length
  const invalidCount = csvRows.filter((r) => !r.valid).length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Bulk Upload Users</h2>
              <p className="text-sm text-primary-100 mt-1">Upload CSV file to create multiple users</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h3>
              <p className="text-sm text-blue-800 mb-2">
                Required columns: <code className="bg-blue-100 px-2 py-1 rounded">full_name</code>,{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">email</code>,{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">role</code>,{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">team_name</code>,{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">reporting_manager_email</code> (for trainers)
              </p>
              <button
                onClick={downloadCSVTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download CSV Template
              </button>
            </div>

            {/* Upload Area */}
            {csvRows.length === 0 && !importResult && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />
                {loading ? (
                  <LoadingSpinner size="lg" text="Parsing CSV file..." />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drop CSV file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">CSV files only</p>
                  </>
                )}
              </div>
            )}

            {/* Preview Table */}
            {csvRows.length > 0 && !importResult && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{validCount} valid rows</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">{invalidCount} invalid rows</span>
                    </div>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={validCount === 0 || uploading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Import Valid Rows ({validCount})
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        {headers.map((header, index) => (
                          <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {header}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Errors
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvRows.map((row) => (
                        <tr
                          key={row.row}
                          className={row.valid ? 'bg-green-50' : 'bg-red-50'}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{row.row}</td>
                          <td className="px-4 py-3">
                            {row.valid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </td>
                          {row.data.map((cell, index) => (
                            <td key={index} className="px-4 py-3 text-sm text-gray-900">
                              {cell || <span className="text-gray-400">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-sm">
                            {row.errors.length > 0 && (
                              <div className="space-y-1">
                                {row.errors.map((error, idx) => (
                                  <p key={idx} className="text-red-600 text-xs">
                                    {error}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Import Complete</h3>
                  <p className="text-sm text-green-800">
                    Successfully imported {importResult.success} users
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-red-800 mt-2">
                      {importResult.failed} users failed to import
                    </p>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">Import Errors</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Error</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResult.errors.map((error, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm text-gray-900">{error.row}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{error.email}</td>
                              <td className="px-4 py-2 text-sm text-red-600">{error.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={handleClose} className="btn-primary">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkUploadModal

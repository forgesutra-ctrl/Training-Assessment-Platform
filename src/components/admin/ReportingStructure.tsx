import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { getReportingStructure } from '@/utils/userManagement'
import { OrgTree, OrgTreeNode } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ReportingStructureProps {
  onUserClick?: (userId: string) => void
}

const ReportingStructure = ({ onUserClick }: ReportingStructureProps) => {
  const [loading, setLoading] = useState(true)
  const [orgTree, setOrgTree] = useState<OrgTree>({ teams: [], orphaned: [] })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadStructure = async () => {
      try {
        setLoading(true)
        const structure = await getReportingStructure()
        setOrgTree(structure)
        // Expand all teams by default
        const teamIds = new Set(structure.teams.map((t) => t.id))
        setExpandedNodes(teamIds)
      } catch (error: any) {
        console.error('Error loading reporting structure:', error)
        toast.error('Failed to load organizational structure')
      } finally {
        setLoading(false)
      }
    }

    loadStructure()
  }, [])

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const renderTreeNode = (node: OrgTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const indent = level * 24

    const getRoleColor = (role: string) => {
      switch (role) {
        case 'manager':
          return 'bg-green-100 text-green-800 border-green-300'
        case 'trainer':
          return 'bg-purple-100 text-purple-800 border-purple-300'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300'
      }
    }

    return (
      <div key={node.id} className="mb-2">
        <div
          className="flex items-center gap-2 p-3 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
          style={{ marginLeft: `${indent}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id)
            if (onUserClick) onUserClick(node.id)
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              node.role === 'manager' ? 'bg-green-500' : 'bg-purple-500'
            }`}
          >
            {node.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{node.name}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(node.role)}`}
              >
                {node.role}
              </span>
              {node.isOrphaned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3" />
                  Orphaned
                </span>
              )}
            </div>
            {node.team_name && (
              <p className="text-xs text-gray-500 mt-1">{node.team_name}</p>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6 border-l-2 border-gray-200 pl-4">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading organizational structure..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Teams</div>
          <div className="text-2xl font-bold text-gray-900">{orgTree.teams.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Managers</div>
          <div className="text-2xl font-bold text-gray-900">
            {orgTree.teams.reduce((sum, t) => sum + t.managers.length, 0)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Orphaned Trainers</div>
          <div className="text-2xl font-bold text-yellow-600">{orgTree.orphaned.length}</div>
        </div>
      </div>

      {/* Organizational Tree */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Organizational Structure</h3>

        {orgTree.teams.length === 0 && orgTree.orphaned.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No organizational structure data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Teams */}
            {orgTree.teams.map((team) => (
              <div key={team.id} className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                  <Users className="w-6 h-6 text-primary-600" />
                  <h4 className="text-lg font-bold text-gray-900">{team.name}</h4>
                  <span className="text-sm text-gray-600">
                    ({team.managers.length} manager{team.managers.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {team.managers.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-4">No managers in this team</p>
                ) : (
                  team.managers.map((manager) => renderTreeNode(manager, 0))
                )}
              </div>
            ))}

            {/* Orphaned Trainers */}
            {orgTree.orphaned.length > 0 && (
              <div className="mt-8 pt-8 border-t-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <h4 className="text-lg font-bold text-gray-900">Orphaned Trainers</h4>
                  <span className="text-sm text-gray-600">
                    ({orgTree.orphaned.length} trainer{orgTree.orphaned.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mb-4">
                  These trainers don't have a reporting manager or their manager is from a different team.
                </p>
                {orgTree.orphaned.map((trainer) => renderTreeNode(trainer, 0))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportingStructure

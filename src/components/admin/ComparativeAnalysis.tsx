import { useState, useEffect } from 'react'
import { GitCompare, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  fetchPeriodData,
  fetchTeamsList,
  fetchAllTrainersWithStats,
  fetchParameterAveragesForComparison,
} from '@/utils/adminQueries'
import { TrainerWithStats } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const getDefaultMonths = () => {
  const d = new Date()
  const m2 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  d.setMonth(d.getMonth() - 1)
  const m1 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return [m1, m2]
}
const [defaultP1, defaultP2] = getDefaultMonths()

const ComparativeAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [comparisonType, setComparisonType] = useState<'period' | 'team' | 'trainer' | 'parameter'>('period')
  const [period1, setPeriod1] = useState(defaultP1)
  const [period2, setPeriod2] = useState(defaultP2)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Options for team / trainer / parameter
  const [teams, setTeams] = useState<{ id: string; team_name: string }[]>([])
  const [trainers, setTrainers] = useState<TrainerWithStats[]>([])
  const [parameters, setParameters] = useState<{ paramId: string; label: string; average: number; count: number }[]>([])
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')
  const [trainer1Id, setTrainer1Id] = useState('')
  const [trainer2Id, setTrainer2Id] = useState('')
  const [param1Id, setParam1Id] = useState('')
  const [param2Id, setParam2Id] = useState('')

  useEffect(() => {
    if (comparisonType === 'period') {
      loadPeriodComparison()
    } else if (comparisonType === 'team') {
      loadTeamOptionsAndComparison()
    } else if (comparisonType === 'trainer') {
      loadTrainerOptionsAndComparison()
    } else if (comparisonType === 'parameter') {
      loadParameterOptionsAndComparison()
    }
  }, [comparisonType, period1, period2, team1Id, team2Id, trainer1Id, trainer2Id, param1Id, param2Id])

  const loadPeriodComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const [data1, data2] = await Promise.all([
        fetchPeriodData(period1),
        fetchPeriodData(period2),
      ])
      setComparisonData({
        period1: { label: period1, data: data1 },
        period2: { label: period2, data: data2 },
        variance: calculateVariance(data1, data2),
      })
    } catch (err: any) {
      const msg = err?.message || 'Failed to load comparison data'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamOptionsAndComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const [teamsList, trainersList] = await Promise.all([
        fetchTeamsList(),
        fetchAllTrainersWithStats('all-time'),
      ])
      setTeams(teamsList)
      setTrainers(trainersList || [])

      if (!team1Id || !team2Id) {
        setComparisonData(null)
        setLoading(false)
        return
      }

      const agg = (teamId: string) => {
        const teamName = teamsList.find((t) => t.id === teamId)?.team_name
        const list = (trainersList || []).filter((t) => t.team_name === teamName)
        if (list.length === 0) return { averageScore: 0, totalAssessments: 0, trainersAssessed: 0 }
        const totalAssessments = list.reduce((s, t) => s + t.total_assessments, 0)
        const weighted = list.reduce((s, t) => s + t.all_time_avg * t.total_assessments, 0)
        const averageScore = totalAssessments > 0 ? weighted / totalAssessments : 0
        return {
          averageScore: Number(averageScore.toFixed(2)),
          totalAssessments,
          trainersAssessed: list.length,
        }
      }
      const team1Name = teamsList.find((t) => t.id === team1Id)?.team_name || team1Id
      const team2Name = teamsList.find((t) => t.id === team2Id)?.team_name || team2Id
      const data1 = agg(team1Id)
      const data2 = agg(team2Id)
      setComparisonData({
        type: 'team',
        period1: { label: team1Name, data: data1 },
        period2: { label: team2Name, data: data2 },
        variance: calculateVariance(data1, data2),
      })
    } catch (err: any) {
      const msg = err?.message || 'Failed to load team comparison'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const loadTrainerOptionsAndComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const trainersList = await fetchAllTrainersWithStats('all-time')
      setTrainers(trainersList || [])

      if (!trainer1Id || !trainer2Id) {
        setComparisonData(null)
        setLoading(false)
        return
      }

      const t1 = trainersList?.find((t) => t.id === trainer1Id)
      const t2 = trainersList?.find((t) => t.id === trainer2Id)
      if (!t1 || !t2) {
        setComparisonData(null)
        setLoading(false)
        return
      }

      const toData = (t: TrainerWithStats) => ({
        averageScore: t.all_time_avg,
        totalAssessments: t.total_assessments,
        trainersAssessed: 1,
      })
      const data1 = toData(t1)
      const data2 = toData(t2)
      setComparisonData({
        type: 'trainer',
        period1: { label: t1.full_name, data: data1 },
        period2: { label: t2.full_name, data: data2 },
        variance: calculateVariance(data1, data2),
      })
    } catch (err: any) {
      const msg = err?.message || 'Failed to load trainer comparison'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const loadParameterOptionsAndComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = await fetchParameterAveragesForComparison()
      setParameters(params)

      if (!param1Id || !param2Id) {
        setComparisonData(null)
        setLoading(false)
        return
      }

      const p1 = params.find((p) => p.paramId === param1Id)
      const p2 = params.find((p) => p.paramId === param2Id)
      if (!p1 || !p2) {
        setComparisonData(null)
        setLoading(false)
        return
      }

      const toData = (p: { average: number; count: number }) => ({
        averageScore: p.average,
        totalAssessments: p.count,
        trainersAssessed: 0,
      })
      const data1 = toData(p1)
      const data2 = toData(p2)
      const scoreChange = data1.averageScore ? ((data2.averageScore - data1.averageScore) / data1.averageScore) * 100 : 0
      const assessmentChange = data1.totalAssessments ? ((data2.totalAssessments - data1.totalAssessments) / data1.totalAssessments) * 100 : 0
      setComparisonData({
        type: 'parameter',
        period1: { label: p1.label, data: data1 },
        period2: { label: p2.label, data: data2 },
        variance: { scoreChange, assessmentChange },
      })
    } catch (err: any) {
      const msg = err?.message || 'Failed to load parameter comparison'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const calculateVariance = (data1: any, data2: any) => {
    const scoreChange = data1.averageScore
      ? ((data2.averageScore - data1.averageScore) / data1.averageScore) * 100
      : 0
    const assessmentChange = data1.totalAssessments
      ? ((data2.totalAssessments - data1.totalAssessments) / data1.totalAssessments) * 100
      : 0
    return { scoreChange, assessmentChange }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading comparison..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <GitCompare className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadPeriodComparison()
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparative Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">Compare periods, teams, trainers, or parameters</p>
        </div>
      </div>

      {/* Comparison Type Selector */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'period', label: 'Period vs Period' },
            { id: 'team', label: 'Team vs Team' },
            { id: 'trainer', label: 'Trainer vs Trainer' },
            { id: 'parameter', label: 'Parameter vs Parameter' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setComparisonType(type.id as any)
                setComparisonData(null)
              }}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                comparisonType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-gray-900">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Period selector */}
      {comparisonType === 'period' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select periods (YYYY-MM)</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Period 1</span>
              <input
                type="month"
                value={period1}
                onChange={(e) => setPeriod1(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Period 2</span>
              <input
                type="month"
                value={period2}
                onChange={(e) => setPeriod2(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </label>
          </div>
        </div>
      )}

      {/* Team selector */}
      {comparisonType === 'team' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select two teams to compare</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Team 1</span>
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[180px]"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Team 2</span>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[180px]"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Trainer selector */}
      {comparisonType === 'trainer' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select two trainers to compare</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trainer 1</span>
              <select
                value={trainer1Id}
                onChange={(e) => setTrainer1Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[200px]"
              >
                <option value="">Select trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}{t.team_name ? ` (${t.team_name})` : ''}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trainer 2</span>
              <select
                value={trainer2Id}
                onChange={(e) => setTrainer2Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[200px]"
              >
                <option value="">Select trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}{t.team_name ? ` (${t.team_name})` : ''}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Parameter selector */}
      {comparisonType === 'parameter' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select two parameters to compare</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Parameter 1</span>
              <select
                value={param1Id}
                onChange={(e) => setParam1Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[220px]"
              >
                <option value="">Select parameter</option>
                {parameters.map((p) => (
                  <option key={p.paramId} value={p.paramId}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Parameter 2</span>
              <select
                value={param2Id}
                onChange={(e) => setParam2Id(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-w-[220px]"
              >
                <option value="">Select parameter</option>
                {parameters.map((p) => (
                  <option key={p.paramId} value={p.paramId}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Comparison results (shared for all types) */}
      {comparisonData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Side 1 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{comparisonData.period1.label}</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {Number(comparisonData.period1.data.averageScore).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">
                  {comparisonData.type === 'parameter' ? 'Response count' : 'Total Assessments'}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonData.period1.data.totalAssessments}
                </div>
              </div>
              {comparisonData.type !== 'parameter' && (
                <div>
                  <div className="text-sm text-gray-600">Trainers / Items</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {comparisonData.period1.data.trainersAssessed}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side 2 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{comparisonData.period2.label}</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {Number(comparisonData.period2.data.averageScore).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">
                  {comparisonData.type === 'parameter' ? 'Response count' : 'Total Assessments'}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonData.period2.data.totalAssessments}
                </div>
              </div>
              {comparisonData.type !== 'parameter' && (
                <div>
                  <div className="text-sm text-gray-600">Trainers / Items</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {comparisonData.period2.data.trainersAssessed}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variance Analysis */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Score Change</div>
                <div className="flex items-center gap-2">
                  {comparisonData.variance.scoreChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : comparisonData.variance.scoreChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      comparisonData.variance.scoreChange > 0
                        ? 'text-green-600'
                        : comparisonData.variance.scoreChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {comparisonData.variance.scoreChange > 0 ? '+' : ''}
                    {Number(comparisonData.variance.scoreChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  {comparisonData.type === 'parameter' ? 'Response count change' : 'Assessment Change'}
                </div>
                <div className="flex items-center gap-2">
                  {comparisonData.variance.assessmentChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : comparisonData.variance.assessmentChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      comparisonData.variance.assessmentChange > 0
                        ? 'text-green-600'
                        : comparisonData.variance.assessmentChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {comparisonData.variance.assessmentChange > 0 ? '+' : ''}
                    {Number(comparisonData.variance.assessmentChange).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparativeAnalysis

import { useState, useEffect } from 'react'
import { Sliders, TrendingUp, Calculator, RefreshCw } from 'lucide-react'
import { fetchAllTrainersWithStats, fetchMonthlyTrends } from '@/utils/adminQueries'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Scenario {
  id: string
  name: string
  variables: Record<string, number>
  projectedImpact: {
    overallScore: number
    improvement: number
    trainersAffected: number
  }
}

const ScenarioModeling = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [variables, setVariables] = useState({
    assessmentFrequency: 1,
    bottom20Improvement: 0,
    newTrainers: 0,
    trainingProgramImpact: 0,
  })

  useEffect(() => {
    loadHistoricalData()
  }, [])

  const loadHistoricalData = async () => {
    try {
      const trends = await fetchMonthlyTrends(12)
      setHistoricalData(trends.map((t) => ({
        month: t.month,
        current: t.average_rating,
        projected: t.average_rating, // Will be updated when scenario is created
      })))
    } catch (error) {
      console.error('Error loading historical data:', error)
    }
  }

  const handleCreateScenario = () => {
    // Calculate projected impact
    const baseScore = historicalData.length > 0 
      ? historicalData[historicalData.length - 1].current 
      : 4.2
    const projectedScore = baseScore + variables.bottom20Improvement * 0.1 + (variables.trainingProgramImpact / 100) * 0.5
    
    const projectedImpact = {
      overallScore: Math.min(5, Math.max(1, projectedScore)),
      improvement: projectedScore - baseScore,
      trainersAffected: Math.floor(variables.bottom20Improvement * 10) + variables.newTrainers,
    }

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      variables: { ...variables },
      projectedImpact,
    }

    // Update projected data for visualization
    const updatedData = historicalData.map((d, index) => {
      if (index >= historicalData.length - 3) {
        // Project next 3 months
        const monthsAhead = index - (historicalData.length - 3) + 1
        return {
          ...d,
          projected: baseScore + (projectedImpact.improvement * monthsAhead / 3),
        }
      }
      return d
    })

    setHistoricalData(updatedData)
    setScenarios([...scenarios, newScenario])
    setCurrentScenario(newScenario)
    toast.success('Scenario created')
  }

  const handleRecalculate = () => {
    if (currentScenario) {
      const updated = {
        ...currentScenario,
        projectedImpact: {
          overallScore: 4.2 + variables.bottom20Improvement * 0.1,
          improvement: variables.bottom20Improvement * 0.1,
          trainersAffected: Math.floor(variables.bottom20Improvement * 10),
        },
      }
      setCurrentScenario(updated)
      toast.success('Recalculated')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">What-If Scenario Modeling</h2>
        <p className="text-sm text-gray-600 mt-1">
          Project the impact of interventions and changes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Builder */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary-600" />
            Scenario Variables
          </h3>

          <div className="space-y-4">
            {/* Assessment Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Frequency (per month)
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={variables.assessmentFrequency}
                onChange={(e) =>
                  setVariables({ ...variables, assessmentFrequency: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5x</span>
                <span className="font-medium">{variables.assessmentFrequency}x</span>
                <span>5x</span>
              </div>
            </div>

            {/* Bottom 20% Improvement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottom 20% Improvement (points)
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={variables.bottom20Improvement}
                onChange={(e) =>
                  setVariables({ ...variables, bottom20Improvement: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0</span>
                <span className="font-medium">+{variables.bottom20Improvement.toFixed(1)}</span>
                <span>+2.0</span>
              </div>
            </div>

            {/* New Trainers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Trainers Added
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={variables.newTrainers}
                onChange={(e) =>
                  setVariables({ ...variables, newTrainers: parseInt(e.target.value) || 0 })
                }
                className="input-field"
              />
            </div>

            {/* Training Program Impact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Program Impact (% improvement)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={variables.trainingProgramImpact}
                onChange={(e) =>
                  setVariables({ ...variables, trainingProgramImpact: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-medium">+{variables.trainingProgramImpact}%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleCreateScenario} className="btn-primary flex-1">
                Create Scenario
              </button>
              <button onClick={handleRecalculate} className="btn-secondary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recalculate
              </button>
            </div>
          </div>
        </div>

        {/* Projected Impact */}
        {currentScenario && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              Projected Impact
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
                <div className="text-sm text-gray-600 mb-1">Projected Overall Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {currentScenario.projectedImpact.overallScore.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">/ 5.00</div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Improvement</div>
                    <div className="text-2xl font-bold text-green-600">
                      +{currentScenario.projectedImpact.improvement.toFixed(2)}
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Trainers Affected</div>
                <div className="text-xl font-bold text-gray-900">
                  {currentScenario.projectedImpact.trainersAffected}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projection Chart */}
      {currentScenario && historicalData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projected Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis domain={[0, 5]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                name="Historical"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Saved Scenarios */}
      {scenarios.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Scenarios</h3>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
                onClick={() => setCurrentScenario(scenario)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{scenario.name}</div>
                    <div className="text-sm text-gray-600">
                      Projected: {scenario.projectedImpact.overallScore.toFixed(2)}/5.0
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      +{scenario.projectedImpact.improvement.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">improvement</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScenarioModeling

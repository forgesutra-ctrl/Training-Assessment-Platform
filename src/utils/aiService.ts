/**
 * AI Service - Integration with Claude API (Anthropic) or OpenAI
 * Make AI features optional and gracefully handle failures
 */

const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true'
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'claude' // 'claude' or 'openai'
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

export interface AISuggestion {
  text: string
  tone: 'professional' | 'encouraging' | 'direct'
  confidence: number
}

export interface PerformanceInsight {
  type: 'strength' | 'improvement' | 'trend' | 'comparison' | 'prediction'
  title: string
  description: string
  data?: any
}

export interface TrendAlert {
  type: 'declining' | 'improving' | 'inconsistent' | 'gap'
  severity: 'low' | 'medium' | 'high'
  message: string
  trainerId?: string
  managerId?: string
  data?: any
}

/**
 * Check if AI is enabled and configured
 */
export const isAIEnabled = (): boolean => {
  if (!AI_ENABLED) return false
  
  if (AI_PROVIDER === 'claude' && !CLAUDE_API_KEY) return false
  if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) return false
  
  return true
}

/**
 * Generate feedback suggestions using Claude API
 */
export const generateFeedbackSuggestions = async (
  rating: number,
  parameter: string,
  tone: 'professional' | 'encouraging' | 'direct' = 'professional'
): Promise<AISuggestion[]> => {
  if (!isAIEnabled()) {
    return getFallbackSuggestions(rating, parameter, tone)
  }

  try {
    if (AI_PROVIDER === 'claude') {
      return await generateWithClaude(rating, parameter, tone)
    } else {
      return await generateWithOpenAI(rating, parameter, tone)
    }
  } catch (error) {
    console.error('AI service error:', error)
    return getFallbackSuggestions(rating, parameter, tone)
  }
}

/**
 * Generate with Claude API (Anthropic)
 */
const generateWithClaude = async (
  rating: number,
  parameter: string,
  tone: string
): Promise<AISuggestion[]> => {
  const prompt = `You are a professional training assessment assistant. A manager is writing feedback for a trainer.

Parameter: ${parameter}
Rating: ${rating}/5
Tone: ${tone}

Generate 3 different feedback suggestions (20-100 words each) that are:
- Specific and actionable
- Constructive and professional
- Appropriate for the rating given
- Match the requested tone

Format as JSON array with objects: {text: string, tone: string, confidence: number}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0].text
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0])
      return suggestions.map((s: any) => ({
        text: s.text,
        tone: s.tone || tone,
        confidence: s.confidence || 0.8,
      }))
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }

  // Fallback: extract suggestions from text
  const lines = content.split('\n').filter((line: string) => line.trim().length > 20)
  return lines.slice(0, 3).map((text: string) => ({
    text: text.trim(),
    tone: tone,
    confidence: 0.7,
  }))
}

/**
 * Generate with OpenAI API
 */
const generateWithOpenAI = async (
  rating: number,
  parameter: string,
  tone: string
): Promise<AISuggestion[]> => {
  const prompt = `You are a professional training assessment assistant. Generate 3 feedback suggestions for:
Parameter: ${parameter}
Rating: ${rating}/5
Tone: ${tone}

Return as JSON array: [{"text": "suggestion", "tone": "${tone}", "confidence": 0.8}]`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional training assessment assistant. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const suggestions = JSON.parse(content)
    return suggestions.map((s: any) => ({
      text: s.text,
      tone: s.tone || tone,
      confidence: s.confidence || 0.8,
    }))
  } catch (e) {
    console.error('Failed to parse AI response:', e)
    return getFallbackSuggestions(rating, parameter, tone)
  }
}

/**
 * Fallback suggestions when AI is unavailable
 */
const getFallbackSuggestions = (
  rating: number,
  parameter: string,
  tone: string
): AISuggestion[] => {
  const suggestions: AISuggestion[] = []

  if (rating >= 4.5) {
    suggestions.push({
      text: `Excellent performance in ${parameter}. Consistently demonstrates strong capabilities and sets a high standard for others.`,
      tone: tone as any,
      confidence: 0.9,
    })
    suggestions.push({
      text: `Outstanding ${parameter} skills. The trainer shows exceptional proficiency and should continue building on these strengths.`,
      tone: tone as any,
      confidence: 0.9,
    })
    suggestions.push({
      text: `Strong ${parameter} abilities. This is a clear strength area that contributes significantly to overall effectiveness.`,
      tone: tone as any,
      confidence: 0.85,
    })
  } else if (rating >= 3.5) {
    suggestions.push({
      text: `Good ${parameter} performance. Shows solid understanding with room for continued growth and development.`,
      tone: tone as any,
      confidence: 0.8,
    })
    suggestions.push({
      text: `Competent in ${parameter}. With focused effort, there's potential to reach the next level of proficiency.`,
      tone: tone as any,
      confidence: 0.8,
    })
    suggestions.push({
      text: `Adequate ${parameter} skills. Consider additional practice and feedback to enhance performance in this area.`,
      tone: tone as any,
      confidence: 0.75,
    })
  } else {
    suggestions.push({
      text: `${parameter} needs improvement. Focus on specific skill development and seek additional training or mentorship in this area.`,
      tone: tone as any,
      confidence: 0.8,
    })
    suggestions.push({
      text: `Development opportunity in ${parameter}. Create a targeted improvement plan with clear goals and milestones.`,
      tone: tone as any,
      confidence: 0.8,
    })
    suggestions.push({
      text: `Requires attention in ${parameter}. Consider structured learning resources and regular practice to build competency.`,
      tone: tone as any,
      confidence: 0.75,
    })
  }

  return suggestions
}

/**
 * Generate performance insights for a trainer
 */
export const generatePerformanceInsights = async (
  _trainerId: string,
  assessments: any[]
): Promise<PerformanceInsight[]> => {
  if (!isAIEnabled() || assessments.length === 0) {
    return generateFallbackInsights(assessments)
  }

  try {
    // Calculate statistics
    const avgScores = calculateParameterAverages(assessments)
    const trends = calculateTrends(assessments)
    const bestParam = Object.entries(avgScores).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    const worstParam = Object.entries(avgScores).reduce((a, b) => (a[1] < b[1] ? a : b))[0]

    const prompt = `Analyze this trainer's performance data and generate 5-7 insights:

Average Scores: ${JSON.stringify(avgScores)}
Trends: ${JSON.stringify(trends)}
Best Parameter: ${bestParam}
Worst Parameter: ${worstParam}
Total Assessments: ${assessments.length}

Generate insights as JSON array: [{"type": "strength|improvement|trend|comparison|prediction", "title": "string", "description": "string"}]`

    if (AI_PROVIDER === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.content[0].text
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }
    }

    return generateFallbackInsights(assessments)
  } catch (error) {
    console.error('AI insights error:', error)
    return generateFallbackInsights(assessments)
  }
}

/**
 * Fallback insights when AI is unavailable
 */
const generateFallbackInsights = (assessments: any[]): PerformanceInsight[] => {
  if (assessments.length === 0) return []

  const avgScores = calculateParameterAverages(assessments)
  const bestParam = Object.entries(avgScores).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
  const worstParam = Object.entries(avgScores).reduce((a, b) => (a[1] < b[1] ? a : b))[0]

  return [
    {
      type: 'strength',
      title: `Your Strongest Skill: ${bestParam}`,
      description: `You consistently excel in ${bestParam} with an average rating of ${avgScores[bestParam].toFixed(2)}/5.0.`,
      data: { parameter: bestParam, score: avgScores[bestParam] },
    },
    {
      type: 'improvement',
      title: `Focus Area: ${worstParam}`,
      description: `${worstParam} shows the most opportunity for growth. Consider targeted development in this area.`,
      data: { parameter: worstParam, score: avgScores[worstParam] },
    },
  ]
}

/**
 * Analyze sentiment of comments
 */
export const analyzeSentiment = async (comments: string[]): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  flagged: boolean
}> => {
  if (!isAIEnabled() || comments.length === 0) {
    return { sentiment: 'neutral', score: 0.5, flagged: false }
  }

  // Simple sentiment analysis (can be enhanced with AI)
  const allText = comments.join(' ').toLowerCase()
  const positiveWords = ['excellent', 'great', 'good', 'strong', 'outstanding', 'impressive']
  const negativeWords = ['poor', 'weak', 'needs improvement', 'lacks', 'fails', 'inadequate']

  const positiveCount = positiveWords.filter((word) => allText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => allText.includes(word)).length

  if (positiveCount > negativeCount * 1.5) {
    return { sentiment: 'positive', score: 0.7, flagged: false }
  } else if (negativeCount > positiveCount * 1.5) {
    return { sentiment: 'negative', score: 0.3, flagged: negativeCount > 3 }
  }

  return { sentiment: 'neutral', score: 0.5, flagged: false }
}

/**
 * Helper functions
 */
const calculateParameterAverages = (assessments: any[]) => {
  const params = [
    'trainers_readiness',
    'communication_skills',
    'domain_expertise',
    'knowledge_displayed',
    'people_management',
    'technical_skills',
  ]

  const averages: Record<string, number> = {}
  params.forEach((param) => {
    const sum = assessments.reduce((acc, a) => acc + (a[param] || 0), 0)
    averages[param] = sum / assessments.length
  })

  return averages
}

const calculateTrends = (assessments: any[]) => {
  if (assessments.length < 3) return {}

  const recent = assessments.slice(0, 3)
  const older = assessments.slice(3, 6)

  const recentAvg =
    recent.reduce((sum, a) => sum + calculateAverage(a), 0) / recent.length
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, a) => sum + calculateAverage(a), 0) / older.length
      : recentAvg

  return {
    direction: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable',
    change: ((recentAvg - olderAvg) / olderAvg) * 100,
  }
}

const calculateAverage = (assessment: any) => {
  return (
    (assessment.trainers_readiness +
      assessment.communication_skills +
      assessment.domain_expertise +
      assessment.knowledge_displayed +
      assessment.people_management +
      assessment.technical_skills) /
    6
  )
}

//app/lib/examPrepAnalytics.ts
export function buildExamPrepAnalytics(attempts: any[]) {
  if (!attempts.length) {
    return {
      totalAttempts: 0,
      overallAverage: 0,
      accuracy: 0,
      readiness: 0,
      trend: 0,
      averageDurationSeconds: 0,
      unansweredRate: 0,
      subjectAverages: [],
      topicPerformance: [],
      weakestSubjects: [],
      weakestTopics: [],
      strongestTopics: [],
      difficultyPerformance: [],
    }
  }

  const subjectMap = new Map<string, any>()
  const topicMap = new Map<string, any>()
  const difficultyMap = new Map<string, any>()
  let totalCorrect = 0
  let totalQuestions = 0
  let totalDuration = 0
  let unanswered = 0

  for (const attempt of attempts) {
    const subject = String(attempt.subject)
    totalCorrect += Number(attempt.score || 0)
    totalQuestions += Number(attempt.total || 0)
    totalDuration += Number(attempt.durationSeconds || 0)

    if (!subjectMap.has(subject)) subjectMap.set(subject, { pct: [], correct: 0, total: 0 })
    const s = subjectMap.get(subject)
    s.pct.push(Number(attempt.percentage || 0))
    s.correct += Number(attempt.score || 0)
    s.total += Number(attempt.total || 0)

    for (const item of attempt.breakdown || []) {
      const topic = String(item.topic || 'General')
      const key = `${String(item.subject || subject).toLowerCase()}::${topic.toLowerCase()}`
      if (!topicMap.has(key)) {
        topicMap.set(key, { subject: item.subject || subject, topic, correct: 0, attempted: 0 })
      }
      const t = topicMap.get(key)
      t.attempted++
      if (item.isCorrect) t.correct++
      if (!item.selected) unanswered++

      const difficulty = item.difficulty || 'medium'
      if (!difficultyMap.has(difficulty)) difficultyMap.set(difficulty, { correct: 0, attempted: 0 })
      const d = difficultyMap.get(difficulty)
      d.attempted++
      if (item.isCorrect) d.correct++
    }
  }

  const subjectAverages = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    average: Math.round(data.pct.reduce((a: number, b: number) => a + b, 0) / data.pct.length),
    accuracy: data.total ? Math.round((data.correct / data.total) * 100) : 0,
    attempts: data.pct.length,
  }))

  const topicPerformance = Array.from(topicMap.values()).map((item) => ({
    ...item,
    percentage: item.attempted ? Math.round((item.correct / item.attempted) * 100) : 0,
  }))

  const difficultyPerformance = Array.from(difficultyMap.entries()).map(([difficulty, item]) => ({
    difficulty,
    attempted: item.attempted,
    correct: item.correct,
    percentage: item.attempted ? Math.round((item.correct / item.attempted) * 100) : 0,
  }))

  const overallAverage = Math.round(
    attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length
  )

  const recent = attempts.slice(-5)
  const previous = attempts.slice(-10, -5)
  const recentAvg = Math.round(recent.reduce((s, a) => s + a.percentage, 0) / recent.length)
  const previousAvg = previous.length
    ? Math.round(previous.reduce((s, a) => s + a.percentage, 0) / previous.length)
    : recentAvg
  const trend = recentAvg - previousAvg
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const meaningful = topicPerformance.filter((item) => item.attempted >= 2)
  const coverage = Math.min(100, meaningful.length * 8)
  const readiness = Math.round(
    accuracy * 0.5 + overallAverage * 0.25 + coverage * 0.15 + Math.max(0, Math.min(100, 50 + trend * 5)) * 0.1
  )

  return {
    totalAttempts: attempts.length,
    overallAverage,
    accuracy,
    readiness,
    trend,
    averageDurationSeconds: Math.round(totalDuration / attempts.length),
    unansweredRate: totalQuestions ? Math.round((unanswered / totalQuestions) * 100) : 0,
    subjectAverages,
    topicPerformance,
    difficultyPerformance,
    weakestSubjects: [...subjectAverages].sort((a, b) => a.average - b.average).slice(0, 3),
    weakestTopics: [...meaningful].sort((a, b) => a.percentage - b.percentage).slice(0, 8),
    strongestTopics: [...meaningful].sort((a, b) => b.percentage - a.percentage).slice(0, 5),
  }
}

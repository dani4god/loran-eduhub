// lib/certificateEligibility.ts
// SERVER-ONLY — imports Mongoose models. Never import this from a
// "use client" component; import from '@/lib/certificate' instead for
// anything that needs to run in the browser.
import Grade from '@/models/Grade'
import AssignmentSubmission from '@/models/AssignmentSubmission'
import '@/models/Assignment' // registers Assignment for populate('assignmentId', 'totalScore')

// ...rest unchanged

export interface EligibilityResult {
  averageScore: number
  itemCount: number
  hasAnyGrades: boolean
}

export async function computeEnrollmentAverage(enrollmentId: string): Promise<EligibilityResult> {
  const [grades, submissions] = await Promise.all([
    Grade.find({ enrollmentId }).select('percentage'),
    AssignmentSubmission.find({ enrollmentId, status: 'graded' })
      .populate('assignmentId', 'totalScore')
      .select('score assignmentId'),
  ])

  const percentages: number[] = grades.map((g: any) => g.percentage)

  for (const sub of submissions as any[]) {
    const totalScore = sub.assignmentId?.totalScore
    if (typeof sub.score === 'number' && typeof totalScore === 'number' && totalScore > 0) {
      percentages.push((sub.score / totalScore) * 100)
    }
  }

  if (percentages.length === 0) {
    return { averageScore: 0, itemCount: 0, hasAnyGrades: false }
  }

  const averageScore = percentages.reduce((sum, p) => sum + p, 0) / percentages.length

  return {
    averageScore: Math.round(averageScore * 10) / 10,
    itemCount: percentages.length,
    hasAnyGrades: true,
  }
}
// lib/selfPaced.ts
import { ISelfPacedCourse } from '@/models/SelfPacedCourse'
import { ISelfPacedEnrollment } from '@/models/SelfPacedEnrollment'

export const WEEK_PASS_MARK = 70

export const MAX_EXAM_ATTEMPTS = 3

// A week is unlocked if it's week 1, or the previous week was passed.
export function getUnlockedWeekNumber(enrollment: ISelfPacedEnrollment): number {
  const passedWeeks = new Set(enrollment.weekProgress.filter((w) => w.passed).map((w) => w.weekNumber))
  let unlocked = 1
  while (passedWeeks.has(unlocked)) {
    unlocked++
  }
  return unlocked
}

export function isCourseComplete(course: ISelfPacedCourse, enrollment: ISelfPacedEnrollment): boolean {
  if (course.weeks.length === 0) return false
  const passedWeeks = new Set(enrollment.weekProgress.filter((w) => w.passed).map((w) => w.weekNumber))
  return course.weeks.every((w) => passedWeeks.has(w.weekNumber))
}

export function computeAverageScore(enrollment: ISelfPacedEnrollment): number {
  const attempts = enrollment.weekProgress
  if (attempts.length === 0) return 0
  const avg = attempts.reduce((sum, w) => sum + w.examPercentage, 0) / attempts.length
  return Math.round(avg * 10) / 10
}

export function classifyScore(avg: number): 'distinction' | 'credit' | 'pass' {
  if (avg >= 80) return 'distinction'
  if (avg >= 60) return 'credit'
  return 'pass' // course completion already implies >=70% on every week
}

// Builds the "to-do" list shown on the self-paced dashboard.
export function buildTodoList(course: ISelfPacedCourse, enrollment: ISelfPacedEnrollment) {
  const todos: { label: string; weekNumber?: number }[] = []
  const unlockedWeek = getUnlockedWeekNumber(enrollment)

  for (const week of course.weeks) {
    const attempt = enrollment.weekProgress.find((w) => w.weekNumber === week.weekNumber)
    if (!attempt) {
      if (week.weekNumber <= unlockedWeek) {
        todos.push({ label: `Complete Week ${week.weekNumber}: ${week.title}`, weekNumber: week.weekNumber })
      }
      break // only show the current actionable week, not every future locked week
    }
    if (!attempt.passed) {
      todos.push({ label: `Retake Week ${week.weekNumber} exam (needs ${WEEK_PASS_MARK}%+)`, weekNumber: week.weekNumber })
      break
    }
  }

  if (todos.length === 0 && isCourseComplete(course, enrollment)) {
    todos.push({ label: 'Download your certificate of completion' })
  }

  return todos
}
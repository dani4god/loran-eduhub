//app/lib/examPrepCatalog.ts
import { SS_CATEGORIES, SS_SUBJECTS_BY_CATEGORY } from '@/lib/lessonNoteSubjects'

export const EXAM_PREP_CLASSES = [
  { value: 'ss1', label: 'SS 1' },
  { value: 'ss2', label: 'SS 2' },
  { value: 'ss3', label: 'SS 3' },
] as const

export type ExamPrepClass = (typeof EXAM_PREP_CLASSES)[number]['value']
export type ExamStandard = 'jamb' | 'waec' | 'neco' | 'igcse' | 'mixed'
export type ScreenShareMode = 'off' | 'optional' | 'required'

export function getExamPrepSubjectCatalog() {
  return SS_CATEGORIES.map((category) => ({
    value: category.value,
    label: category.label,
    subjects: SS_SUBJECTS_BY_CATEGORY[category.value] || [],
  }))
}

export function getAllExamPrepSubjects() {
  return Array.from(new Set(Object.values(SS_SUBJECTS_BY_CATEGORY).flat()))
}

export function canonicalExamPrepSubject(subject: string) {
  const normalized = subject.trim().toLowerCase()
  return getAllExamPrepSubjects().find((item) => item.toLowerCase() === normalized) || null
}

export function isValidExamPrepClass(value: string): value is ExamPrepClass {
  return EXAM_PREP_CLASSES.some((item) => item.value === value)
}

export function isValidExamStandard(value: string): value is ExamStandard {
  return ['jamb', 'waec', 'neco', 'igcse', 'mixed'].includes(value)
}

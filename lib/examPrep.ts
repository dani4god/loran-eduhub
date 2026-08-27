// lib/examPrep.ts
import crypto from 'crypto'

export const EXAM_TYPES = ['jamb', 'waec', 'neco'] as const
export type ExamType = typeof EXAM_TYPES[number]

export function generateRegNumber(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomInt(100000, 999999)
  return `LEH/EXAM/${year}/${random}`
}
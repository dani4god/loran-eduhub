// lib/certificate.ts

export type Classification = 'distinction' | 'credit' | 'pass' | 'fail'

export function classifyScore(avg: number): Classification {
  if (avg >= 80) return 'distinction'
  if (avg >= 60) return 'credit'
  if (avg >= 45) return 'pass'
  return 'fail'
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  distinction: 'Distinction',
  credit: 'Credit',
  pass: 'Pass',
  fail: 'Fail',
}

export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  distinction: '#1B5E20',
  credit: '#0D47A1',
  pass: '#E65100',
  fail: '#B71C1C',
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LEH-${year}-${random}`
}

export function formatDurationRange(start: Date, end: Date): string {
  const months = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
  )
  const fmt = (d: Date) => d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)} (${months} month${months !== 1 ? 's' : ''})`
}
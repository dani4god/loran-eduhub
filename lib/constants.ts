// lib/constants.ts
export const PLAN_DURATIONS = {
  trial: 7,
  monthly: 30,
  '3months': 90,
  '6months': 180,
  '1year': 365,
} as const

export const PLAN_LABELS = {
  trial: '1 Week Free Trial',
  monthly: 'Monthly',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
} as const

export type PlanType = keyof typeof PLAN_DURATIONS

// Maps a plan id to the corresponding field name on Tutor.pricing.
// Trial has no tutor pricing — it's always free.
export const PLAN_PRICING_KEY: Record<Exclude<PlanType, 'trial'>, 'monthly' | 'threeMonths' | 'sixMonths' | 'oneYear'> = {
  monthly: 'monthly',
  '3months': 'threeMonths',
  '6months': 'sixMonths',
  '1year': 'oneYear',
}
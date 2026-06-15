// lib/constants.ts
export const PLAN_PRICES = {
  trial: 0,
  '3months': 45000,
  '6months': 80000,
  '1year': 150000,
} as const

export const PLAN_DURATIONS = {
  trial: 7, // days
  '3months': 90,
  '6months': 180,
  '1year': 365,
} as const

export const PLAN_LABELS = {
  trial: '1 Week Free Trial',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
} as const

export type PlanType = keyof typeof PLAN_PRICES
export type UserRole = 'student' | 'tutor' | 'admin'

export type SubscriptionPlan = 'trial' | '3months' | '6months' | '1year'

export type EnrollmentStatus = 'pending' | 'active' | 'paused' | 'expired' | 'suspended'

export type TutorStatus = 'pending' | 'approved' | 'disapproved' | 'suspended'

export type PaymentStatus = 'pending' | 'success' | 'failed'

export type QuestionType = 'mcq' | 'fill-in-the-gap' | 'true-or-false'

export interface PlanDetails {
  id: SubscriptionPlan
  label: string
  price: number
  duration: number // in days
  description: string
}

export const PLANS: PlanDetails[] = [
  { id: 'trial', label: '1 Week Free Trial', price: 0, duration: 7, description: 'Try before you commit' },
  { id: '3months', label: '3 Months', price: 45000, duration: 90, description: 'Best for short courses' },
  { id: '6months', label: '6 Months', price: 80000, duration: 180, description: 'Most popular' },
  { id: '1year', label: '1 Year Diploma', price: 150000, duration: 365, description: 'Full diploma program' },
]
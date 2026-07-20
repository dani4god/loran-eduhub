// lib/pricing.ts
import Tutor from '@/models/Tutor'
import { PLAN_PRICING_KEY, PlanType, PLAN_DURATIONS, } from '@/lib/constants'
import Course from '@/models/Course'
import Payment from '@/models/Payment'


export interface Selection {
  courseId: string
  tutorId: string
}

export interface PricedSelection extends Selection {
  amount: number
}

// Computes the true cost of a set of course+tutor selections for a given
// plan, using each tutor's own pricing. Throws if any tutor is missing
// pricing for that plan (shouldn't happen once pricing is required at
// registration, but guards against stale/incomplete tutor records).
export async function computeSelectionsAmount(
  selections: Selection[],
  plan: PlanType
): Promise<{ total: number; amounts: PricedSelection[] }> {
  if (plan === 'trial') {
    return { total: 0, amounts: selections.map(s => ({ ...s, amount: 0 })) }
  }

  const tutorIds = Array.from(new Set(selections.map(s => s.tutorId)))
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('pricing firstName lastName')
  const tutorById = new Map(tutors.map(t => [t._id.toString(), t]))

  const priceKey = PLAN_PRICING_KEY[plan]

  const amounts: PricedSelection[] = selections.map(sel => {
    const tutor = tutorById.get(sel.tutorId)
    if (!tutor) {
      throw new Error(`Tutor not found for selection: ${sel.tutorId}`)
    }

    const price = tutor.pricing?.[priceKey]
    if (typeof price !== 'number' || price <= 0) {
      throw new Error(
        `${tutor.firstName} ${tutor.lastName} has not set a price for the ${plan} plan`
      )
    }

    return { ...sel, amount: price }
  })

  const total = amounts.reduce((sum, a) => sum + a.amount, 0)
  return { total, amounts }
}




interface CourseDetailInput {
  courseId: string
  tutorId: string
  amount: number
}

// Builds the courseDetails[] the new Payment schema requires, resolving
// course/tutor names for the receipt. Skipped entirely for trial (no payment).
export async function buildCourseDetails(priced: CourseDetailInput[], plan: PlanType) {
  if (plan === 'trial' || priced.length === 0) return []

  const courseIds = Array.from(new Set(priced.map(p => p.courseId)))
  const tutorIds = Array.from(new Set(priced.map(p => p.tutorId)))

  const [courses, tutors] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select('name'),
    Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName'),
  ])

  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return priced.map(p => ({
    courseId: p.courseId,
    courseName: courseById.get(p.courseId)?.name || 'Unknown Course',
    tutorId: p.tutorId,
    tutorName: tutorById.get(p.tutorId)
      ? `${tutorById.get(p.tutorId)!.firstName} ${tutorById.get(p.tutorId)!.lastName}`
      : 'Unknown Tutor',
    planPrice: p.amount,
    planKey: plan as 'monthly' | '3months' | '6months' | '1year',
  }))
}

// Centralizes Payment creation so every route explicitly provides the
// fields the schema requires — the pre('save') hook that auto-fills
// amount/planDurationDays runs AFTER validation, so relying on it for
// required fields throws a ValidationError. Always pass them explicitly.
export async function createPaymentRecord(params: {
  studentId: string
  enrollmentIds: string[]
  groupId?: string
  plan: PlanType
  courseDetails: any[]
  amount: number
  paystackReference: string
  status?: 'pending' | 'success' | 'failed'
}) {
  return Payment.create({
    studentId: params.studentId,
    enrollmentIds: params.enrollmentIds,
    groupId: params.groupId,
    courseDetails: params.courseDetails,
    amount: params.amount,
    planDurationDays: PLAN_DURATIONS[params.plan],
    plan: params.plan,
    paystackReference: params.paystackReference,
    status: params.status || 'success',
    paidAt: (params.status || 'success') === 'success' ? new Date() : undefined,
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import ExamPrepSettings, {
  DEFAULT_EXAM_PREP_PLANS,
  ExamPrepPlanDuration,
} from '@/models/ExamPrepSettings'

export const dynamic = 'force-dynamic'

const PLAN_ORDER: ExamPrepPlanDuration[] = [
  '1month',
  '2months',
  '3months',
  'life',
]

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  return token?.role === 'admin'
}

async function getOrCreateSettings() {
  let settings = await ExamPrepSettings.findOne({
    key: 'global',
  })

  if (!settings) {
    settings = await ExamPrepSettings.create({
      key: 'global',
      isLocked: false,
      isPaid: false,
      plans: DEFAULT_EXAM_PREP_PLANS.map((plan) => ({
        ...plan,
      })),
    })
  }

  return settings
}

/**
 * GET
 * Load current Exam Prep settings.
 */
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await requireAdmin(req)

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    await connectDB()

    const settings = await getOrCreateSettings()

    return NextResponse.json({
      success: true,

      settings: {
        isLocked: settings.isLocked,
        isPaid: settings.isPaid,
        plans: settings.plans,
        updatedAt: settings.updatedAt,
      },
    })
  } catch (error) {
    console.error(
      '[ADMIN EXAM PREP SETTINGS GET]',
      error
    )

    return NextResponse.json(
      {
        error: 'Failed to load Exam Prep settings',
      },
      {
        status: 500,
      }
    )
  }
}

/**
 * PUT
 * Update Exam Prep settings.
 */
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await requireAdmin(req)

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body = await req.json()

    const {
      isLocked,
      isPaid,
      plans,
    } = body ?? {}

    if (
      typeof isLocked !== 'boolean' ||
      typeof isPaid !== 'boolean'
    ) {
      return NextResponse.json(
        {
          error:
            'isLocked and isPaid must be boolean values',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Array.isArray(plans) ||
      plans.length !== PLAN_ORDER.length
    ) {
      return NextResponse.json(
        {
          error:
            'All four subscription plans are required',
        },
        {
          status: 400,
        }
      )
    }

    const normalizedPlans = PLAN_ORDER.map(
      (duration) => {
        const incoming = plans.find(
          (plan: any) =>
            plan?.duration === duration
        )

        const fallback =
          DEFAULT_EXAM_PREP_PLANS.find(
            (plan) =>
              plan.duration === duration
          )!

        if (!incoming) {
          throw new Error(
            `Missing ${duration} plan`
          )
        }

        const price = Number(
          incoming.price
        )

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          throw new Error(
            `Invalid price for ${duration}`
          )
        }

        return {
          duration,

          label:
            typeof incoming.label ===
              'string' &&
            incoming.label.trim()
              ? incoming.label.trim()
              : fallback.label,

          price: Math.round(price),

          enabled: Boolean(
            incoming.enabled
          ),
        }
      }
    )

    if (
      isPaid &&
      !normalizedPlans.some(
        (plan) => plan.enabled
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Enable at least one subscription plan when payment is required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    const settings =
      await ExamPrepSettings.findOneAndUpdate(
        {
          key: 'global',
        },
        {
          $set: {
            isLocked,
            isPaid,
            plans: normalizedPlans,
          },

          $setOnInsert: {
            key: 'global',
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      )

    return NextResponse.json({
      success: true,

      message:
        'Exam Prep settings updated',

      settings: {
        isLocked: settings.isLocked,
        isPaid: settings.isPaid,
        plans: settings.plans,
        updatedAt: settings.updatedAt,
      },
    })
  } catch (error: any) {
    console.error(
      '[ADMIN EXAM PREP SETTINGS PUT]',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to update Exam Prep settings',
      },
      {
        status: 500,
      }
    )
  }
}
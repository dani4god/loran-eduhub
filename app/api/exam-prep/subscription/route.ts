// app/api/exam-prep/subscription/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

function calculateDaysRemaining(
  endDate:
    Date | string | undefined
) {
  if (
    !endDate
  ) {
    return null
  }

  const end =
    new Date(
      endDate
    )

  const difference =
    end.getTime() -
    Date.now()

  if (
    difference <=
    0
  ) {
    return 0
  }

  return Math.ceil(
    difference /
      (
        24 *
        60 *
        60 *
        1000
      )
  )
}

export async function GET(
  req: NextRequest
) {
  try {
    const auth =
      await requireExamPrepStudent(
        req
      )

    if (
      !auth.ok
    ) {
      return auth.response
    }

    await connectDB()

    const [
      settings,
      subscription,
    ] =
      await Promise.all([
        ExamPrepSettings.findOneAndUpdate(
          {
            key:
              'global',
          },
          {
            $setOnInsert: {
              key:
                'global',
            },
          },
          {
            upsert:
              true,
            new:
              true,
          }
        )
          .lean(),

        ExamPrepSubscription.findOne({
          examPrepStudentId:
            auth.student._id,
        })
          .lean(),
      ])

    const isPaidSystem =
      Boolean(
        settings?.isPaid
      )

    const wasFreeAtRegistration =
      Boolean(
        subscription
          ?.wasFreeAtRegistration
      )

    const isLifetime =
      subscription
        ?.planDuration ===
      'life'

    const endDate =
      subscription
        ?.endDate
        ? new Date(
            subscription.endDate
          )
        : null

    const hasTimedSubscription =
      Boolean(
        subscription
          ?.planDuration &&
        subscription
          .planDuration !==
          'life' &&
        endDate &&
        endDate.getTime() >
          Date.now()
      )

    const active =
      !isPaidSystem ||
      wasFreeAtRegistration ||
      isLifetime ||
      hasTimedSubscription

    const expired =
      Boolean(
        isPaidSystem &&
        !wasFreeAtRegistration &&
        subscription
          ?.planDuration &&
        subscription
          .planDuration !==
          'life' &&
        endDate &&
        endDate.getTime() <=
          Date.now()
      )

    const plan =
      settings?.plans?.find(
        (
          item:
            any
        ) =>
          item.duration ===
          subscription
            ?.planDuration
      )

    return NextResponse.json({
      success:
        true,

      isPaid:
        isPaidSystem,

      active,

      expired,

      requiresPayment:
        isPaidSystem &&
        !active,

      subscription: {
        wasFreeAtRegistration,

        planDuration:
          subscription
            ?.planDuration ||
          null,

        planLabel:
          plan?.label ||
          (
            subscription
              ?.planDuration ===
            'life'
              ? 'Lifetime'
              : null
          ),

        amountPaid:
          Number(
            subscription
              ?.amountPaid ||
              0
          ),

        startDate:
          subscription
            ?.startDate ||
          null,

        endDate:
          subscription
            ?.endDate ||
          null,

        isLifetime,

        daysRemaining:
          isLifetime
            ? null
            : calculateDaysRemaining(
                subscription
                  ?.endDate
              ),
      },

      plans:
        (
          settings?.plans ||
          []
        )
          .filter(
            (
              item:
                any
            ) =>
              Boolean(
                item.enabled
              )
          )
          .map(
            (
              item:
                any
            ) => ({
              duration:
                item.duration,

              label:
                item.label,

              price:
                Number(
                  item.price ||
                    0
                ),
            })
          ),
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep subscription status:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load subscription information.',
      },
      {
        status:
          500,
      }
    )
  }
}
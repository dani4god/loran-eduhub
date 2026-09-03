// app/api/exam-prep/subscribe/verify/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepSubscription from '@/models/ExamPrepSubscription'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

type PlanDuration =
  | '1month'
  | '2months'
  | '3months'
  | 'life'

const PLAN_DAYS:
  Record<
    Exclude<
      PlanDuration,
      'life'
    >,
    number
  > = {
  '1month':
    30,

  '2months':
    60,

  '3months':
    90,
}

function isPlanDuration(
  value:
    unknown
): value is PlanDuration {
  return (
    value ===
      '1month' ||
    value ===
      '2months' ||
    value ===
      '3months' ||
    value ===
      'life'
  )
}

function calculateRenewalDates({
  planDuration,
  existingEndDate,
}: {
  planDuration:
    PlanDuration

  existingEndDate?:
    Date | null
}) {
  const now =
    new Date()

  /*
   * Lifetime access starts now but has no expiry.
   */
  if (
    planDuration ===
    'life'
  ) {
    return {
      startDate:
        now,

      endDate:
        undefined,
    }
  }

  /*
   * Preserve remaining subscription days.
   *
   * Active existing plan:
   * new subscription time starts from existing expiry.
   *
   * Expired/no subscription:
   * new subscription starts now.
   */
  const baseDate =
    existingEndDate &&
    existingEndDate.getTime() >
      now.getTime()
      ? new Date(
          existingEndDate
        )
      : now

  const days =
    PLAN_DAYS[
      planDuration
    ]

  const endDate =
    new Date(
      baseDate.getTime() +
        days *
          24 *
          60 *
          60 *
          1000
    )

  return {
    startDate:
      now,

    endDate,
  }
}

export async function POST(
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

    const body =
      await req.json()

    const reference =
      String(
        body?.reference ||
          ''
      ).trim()

    if (
      !reference
    ) {
      return NextResponse.json(
        {
          error:
            'Payment reference is required.',
        },
        {
          status:
            400,
        }
      )
    }

    const secret =
      process.env
        .PAYSTACK_SECRET_KEY

    if (
      !secret
    ) {
      return NextResponse.json(
        {
          error:
            'Paystack is not configured.',
        },
        {
          status:
            500,
        }
      )
    }

    // ========================================================
    // VERIFY WITH PAYSTACK
    // ========================================================

    const response =
      await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${secret}`,
          },

          cache:
            'no-store',
        }
      )

    const data =
      await response.json()

    if (
      !response.ok ||
      !data?.status ||
      data?.data
        ?.status !==
        'success'
    ) {
      return NextResponse.json(
        {
          error:
            'Payment has not been confirmed.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // METADATA
    // ========================================================

    const metadata =
      data.data
        .metadata ||
      {}

    if (
      metadata.purpose !==
      'exam_prep_subscription'
    ) {
      return NextResponse.json(
        {
          error:
            'This payment is not an Exam Prep subscription payment.',
        },
        {
          status:
            403,
        }
      )
    }

    if (
      String(
        metadata
          .examPrepStudentId ||
          ''
      ) !==
      auth.student
        ._id
        .toString()
    ) {
      return NextResponse.json(
        {
          error:
            'Payment metadata does not match this Exam Prep account.',
        },
        {
          status:
            403,
        }
      )
    }

    if (
      !isPlanDuration(
        metadata
          .planDuration
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Payment contains an invalid subscription plan.',
        },
        {
          status:
            400,
        }
      )
    }

    const planDuration:
      PlanDuration =
      metadata
        .planDuration

    // ========================================================
    // AMOUNT VERIFICATION
    // ========================================================

    const paidKobo =
      Number(
        data.data
          .amount ||
          0
      )

    const expectedAmountKobo =
      Number(
        metadata
          .expectedAmountKobo ||
          0
      )

    if (
      !Number.isFinite(
        paidKobo
      ) ||
      !Number.isFinite(
        expectedAmountKobo
      ) ||
      expectedAmountKobo <=
        0 ||
      paidKobo <
        expectedAmountKobo
    ) {
      return NextResponse.json(
        {
          error:
            'Paid amount does not match the selected subscription plan.',
        },
        {
          status:
            400,
        }
      )
    }

    const paidNaira =
      paidKobo /
      100

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB()

    const existing =
      await ExamPrepSubscription.findOne({
        examPrepStudentId:
          auth.student._id,
      })

    // ========================================================
    // IDEMPOTENCY
    // ========================================================

    if (
      existing
        ?.paystackReference ===
      reference
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyProcessed:
          true,

        subscription:
          existing,
      })
    }

    /*
     * If this account already has lifetime access, another payment
     * should never reduce it to a timed plan.
     */
    if (
      existing
        ?.planDuration ===
      'life'
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyLifetime:
          true,

        subscription:
          existing,
      })
    }

    // ========================================================
    // CALCULATE RENEWAL
    // ========================================================

    const existingEndDate =
      existing?.endDate
        ? new Date(
            existing.endDate
          )
        : null

    const {
      startDate,
      endDate,
    } =
      calculateRenewalDates({
        planDuration,
        existingEndDate,
      })

    // ========================================================
    // ACTIVATE / RENEW
    // ========================================================

    const subscription =
      await ExamPrepSubscription.findOneAndUpdate(
        {
          examPrepStudentId:
            auth.student._id,
        },
        {
          $set: {
            wasFreeAtRegistration:
              false,

            planDuration,

            amountPaid:
              paidNaira,

            paystackReference:
              reference,

            startDate,

            /*
             * $unset is handled separately for lifetime below.
             */
            ...(
              planDuration !==
              'life'
                ? {
                    endDate,
                  }
                : {}
            ),
          },

          ...(
            planDuration ===
            'life'
              ? {
                  $unset: {
                    endDate:
                      1,
                  },
                }
              : {}
          ),
        },
        {
          upsert:
            true,

          new:
            true,
        }
      )

    return NextResponse.json({
      success:
        true,

      alreadyProcessed:
        false,

      subscription,
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep verify:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not verify payment.',
      },
      {
        status:
          500,
      }
    )
  }
}
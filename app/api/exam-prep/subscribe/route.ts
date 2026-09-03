// app/api/exam-prep/subscribe/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import crypto from 'crypto'

import connectDB from '@/lib/mongodb'

import ExamPrepSettings from '@/models/ExamPrepSettings'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

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

    const planDuration =
      String(
        body?.planDuration ||
          ''
      ).trim()

    await connectDB()

    const settings =
      await ExamPrepSettings.findOne({
        key:
          'global',
      })
        .lean()

    if (
      !settings?.isPaid
    ) {
      return NextResponse.json(
        {
          error:
            'Exam Prep is currently free.',
        },
        {
          status:
            400,
        }
      )
    }

    const plan =
      (
        settings.plans ||
        []
      ).find(
        (
          item:
            any
        ) =>
          Boolean(
            item.enabled
          ) &&
          item.duration ===
            planDuration
      )

    if (
      !plan
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid subscription plan.',
        },
        {
          status:
            400,
        }
      )
    }

    const currentSubscription =
      await ExamPrepSubscription.findOne({
        examPrepStudentId:
          auth.student._id,
      })
        .lean()

    if (
      currentSubscription
        ?.planDuration ===
      'life'
    ) {
      return NextResponse.json(
        {
          error:
            'Your account already has lifetime Exam Prep access.',
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

    const amountNaira =
      Number(
        plan.price
      )

    if (
      !Number.isFinite(
        amountNaira
      ) ||
      amountNaira <
        0
    ) {
      return NextResponse.json(
        {
          error:
            'Subscription price is invalid.',
        },
        {
          status:
            500,
        }
      )
    }

    const amountKobo =
      Math.round(
        amountNaira *
          100
      )

    const reference =
      `EXAMPREP-${Date.now()}-${crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()}`

    const baseUrl =
      (
        process.env
          .NEXTAUTH_URL ||
        req.nextUrl.origin
      )
        .replace(
          /\/$/,
          ''
        )

    const callbackUrl =
      `${baseUrl}/exam-prep/dashboard/subscription?reference=${encodeURIComponent(
        reference
      )}`

    const response =
      await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${secret}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              email:
                auth.student.email,

              amount:
                amountKobo,

              currency:
                'NGN',

              reference,

              callback_url:
                callbackUrl,

              metadata: {
                purpose:
                  'exam_prep_subscription',

                examPrepStudentId:
                  auth.student
                    ._id
                    .toString(),

                planDuration,

                /*
                 * This is a server-created payment snapshot.
                 * Verification uses it so a later admin price change
                 * does not invalidate a payment already initialized.
                 */
                expectedAmountKobo:
                  amountKobo,

                planLabel:
                  plan.label,
              },
            }),
        }
      )

    const data =
      await response.json()

    if (
      !response.ok ||
      !data?.status ||
      !data?.data
        ?.authorization_url
    ) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            'Could not initialize payment.',
        },
        {
          status:
            502,
        }
      )
    }

    return NextResponse.json({
      success:
        true,

      authorizationUrl:
        data.data
          .authorization_url,

      accessCode:
        data.data
          .access_code,

      reference,

      amount:
        amountNaira,

      plan: {
        duration:
          plan.duration,

        label:
          plan.label,
      },
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep subscribe:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not initialize subscription.',
      },
      {
        status:
          500,
      }
    )
  }
}
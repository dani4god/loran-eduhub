import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'

const DURATION_DAYS: Record<
  string,
  number | null
> = {
  trial: 7,

  monthly: 30,

  '1month': 30,

  '2months': 60,

  '3months': 90,

  '6months': 180,

  '1year': 365,

  life: null,
}

export async function GET(
  req: NextRequest
) {
  try {
    const reference =
      req.nextUrl.searchParams.get(
        'reference'
      )

    if (!reference) {
      return NextResponse.json(
        {
          error:
            'Payment reference is required',
        },
        { status: 400 }
      )
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            'Payment system is not configured',
        },
        { status: 500 }
      )
    }

    await connectDB()

    /**
     * Verify DIRECTLY with Paystack.
     */
    const verifyResponse =
      await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${secretKey}`,
          },

          cache: 'no-store',
        }
      )

    const result =
      await verifyResponse.json()

    if (
      !verifyResponse.ok ||
      !result?.status ||
      !result?.data ||
      result.data.status !==
        'success'
    ) {
      return NextResponse.json(
        {
          error:
            result?.message ||
            'Payment has not been confirmed',
        },
        { status: 400 }
      )
    }

    const transaction =
      result.data

    /**
     * Make sure this transaction belongs to
     * the Exam Prep product.
     */
    const metadata =
      transaction.metadata || {}

    if (
      metadata.type !==
      'exam_prep_subscription'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payment type',
        },
        { status: 400 }
      )
    }

    const regNumber =
      metadata.regNumber

    const duration =
      metadata.duration

    const expectedAmountKobo =
      Number(
        metadata.expectedAmountKobo
      )

    if (
      !regNumber ||
      !duration ||
      !Number.isFinite(
        expectedAmountKobo
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Payment metadata is incomplete',
        },
        { status: 400 }
      )
    }

    /**
     * SECURITY CHECK:
     *
     * Amount actually paid must exactly equal
     * the amount your backend initialized.
     */
    if (
      Number(transaction.amount) !==
      expectedAmountKobo
    ) {
      console.error(
        'Exam Prep payment amount mismatch',
        {
          reference,

          expected:
            expectedAmountKobo,

          received:
            transaction.amount,
        }
      )

      return NextResponse.json(
        {
          error:
            'Payment amount does not match the selected plan',
        },
        { status: 400 }
      )
    }

    if (
      transaction.currency !== 'NGN'
    ) {
      return NextResponse.json(
        {
          error:
            'Unexpected payment currency',
        },
        { status: 400 }
      )
    }

    const student =
      await ExamPrepStudent.findOne({
        regNumber,
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Student not found',
        },
        { status: 404 }
      )
    }

    const existing =
      await ExamPrepSubscription.findOne({
        examPrepStudentId:
          student._id,
      })

    /**
     * IDEMPOTENCY:
     *
     * If this exact transaction was already
     * applied, don't extend/reset the subscription.
     */
    if (
      existing?.paystackReference ===
      reference
    ) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,

        regNumber:
          student.regNumber,
      })
    }

    /**
     * Don't accidentally treat an unknown
     * duration as lifetime.
     */
    if (
      !Object.prototype.hasOwnProperty.call(
        DURATION_DAYS,
        duration
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Unsupported subscription duration: ${duration}`,
        },
        { status: 400 }
      )
    }

    const days =
      DURATION_DAYS[duration]

    const now =
      new Date()

    let endDate:
      | Date
      | null = null

    if (days !== null) {
      endDate = new Date(
        now.getTime() +
          days *
            24 *
            60 *
            60 *
            1000
      )
    }

    await ExamPrepSubscription.findOneAndUpdate(
      {
        examPrepStudentId:
          student._id,
      },
      {
        $set: {
          wasFreeAtRegistration:
            false,

          planDuration:
            duration,

          /**
           * Paystack returns kobo.
           */
          amountPaid:
            Number(
              transaction.amount
            ) / 100,

          paystackReference:
            reference,

          startDate: now,

          endDate,
        },
      },
      {
        upsert: true,
        new: true,
      }
    )

    return NextResponse.json({
      success: true,

      message:
        'Payment confirmed and subscription activated',

      regNumber:
        student.regNumber,

      duration,

      amountPaid:
        Number(
          transaction.amount
        ) / 100,
    })
  } catch (error: any) {
    console.error(
      'Exam Prep verification error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to verify payment',
      },
      { status: 500 }
    )
  }
}
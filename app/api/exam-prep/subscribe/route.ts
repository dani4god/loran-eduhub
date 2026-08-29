import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'

const FREE_PLAN_DAYS: Record<
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

export async function POST(
  req: NextRequest
) {
  try {
    const {
      regNumber,
      duration,
      email,
    } = await req.json()

    if (!regNumber?.trim()) {
      return NextResponse.json(
        {
          error:
            'Registration number is required',
        },
        { status: 400 }
      )
    }

    if (!duration) {
      return NextResponse.json(
        {
          error:
            'Please select a subscription plan',
        },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        {
          error: 'Email is required',
        },
        { status: 400 }
      )
    }

    await connectDB()

    const student =
      await ExamPrepStudent.findOne({
        regNumber:
          regNumber.trim(),
      })

    if (!student) {
      return NextResponse.json(
        {
          error: 'Student not found',
        },
        { status: 404 }
      )
    }

    /**
     * If this student already has access,
     * don't request another payment.
     */
    const existingSubscription =
      await ExamPrepSubscription.findOne({
        examPrepStudentId:
          student._id,
      })

    const now = new Date()

    const alreadyHasAccess =
      existingSubscription?.wasFreeAtRegistration ===
        true ||
      existingSubscription?.planDuration ===
        'life' ||
      (
        existingSubscription?.endDate instanceof
          Date &&
        existingSubscription.endDate >
          now
      )

    if (alreadyHasAccess) {
      return NextResponse.json({
        success: true,
        requiresPayment: false,
        alreadyActive: true,
        regNumber:
          student.regNumber,
      })
    }

    const settings =
      await ExamPrepSettings.findOne({
        key: 'global',
      })

    if (!settings) {
      return NextResponse.json(
        {
          error:
            'Exam Prep settings are not configured',
        },
        { status: 500 }
      )
    }

    const plan =
      settings.plans?.find(
        (p: any) =>
          p.duration ===
            duration &&
          p.enabled === true
      )

    if (!plan) {
      return NextResponse.json(
        {
          error:
            'Invalid or unavailable plan',
        },
        { status: 400 }
      )
    }

    const amount =
      Number(plan.price)

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid subscription price',
        },
        { status: 500 }
      )
    }

    /**
     * Support genuinely free plans without
     * involving Paystack.
     */
    if (amount === 0) {
      if (
        !Object.prototype.hasOwnProperty.call(
          FREE_PLAN_DAYS,
          duration
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Unsupported subscription duration',
          },
          { status: 400 }
        )
      }

      const days =
        FREE_PLAN_DAYS[duration]

      const startDate =
        new Date()

      const endDate =
        days === null
          ? null
          : new Date(
              startDate.getTime() +
                days *
                  24 *
                  60 *
                  60 *
                  1000
            )

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
            amountPaid: 0,
            startDate,
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
        requiresPayment: false,
        isTrial:
          duration === 'trial',
        regNumber:
          student.regNumber,
      })
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error(
        'PAYSTACK_SECRET_KEY missing'
      )

      return NextResponse.json(
        {
          error:
            'Payment system is not configured',
        },
        { status: 500 }
      )
    }

    /**
     * Use your actual public production URL.
     *
     * Add APP_URL in Vercel:
     *
     * https://www.loran-eduhub.com
     */
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://www.loran-eduhub.com'

    const callbackUrl =
      `${baseUrl}/exam-prep/payment-success`

    const reference =
      `EXPREP-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`

    const amountInKobo =
      Math.round(amount * 100)

    const paystackResponse =
      await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${secretKey}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email:
              email.trim(),

            amount:
              amountInKobo,

            reference,

            currency: 'NGN',

            callback_url:
              callbackUrl,

            metadata: {
              type:
                'exam_prep_subscription',

              regNumber:
                student.regNumber,

              duration,

              /**
               * This value was fetched server-side
               * from your admin settings.
               */
              price: amount,

              expectedAmountKobo:
                amountInKobo,

              email:
                email.trim(),
            },
          }),

          cache: 'no-store',
        }
      )

    const data =
      await paystackResponse.json()

    console.log(
      'Exam Prep Paystack initialization:',
      {
        httpStatus:
          paystackResponse.status,

        paystackStatus:
          data?.status,

        reference,

        amountInKobo,

        regNumber:
          student.regNumber,

        duration,
      }
    )

    if (
      !paystackResponse.ok ||
      !data?.status ||
      !data?.data
    ) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            'Paystack could not initialize the payment',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,

      requiresPayment: true,

      isTrial: false,

      amount,

      reference:
        data.data.reference,

      /**
       * THIS is now the primary checkout mechanism.
       */
      authorizationUrl:
        data.data.authorization_url,

      /**
       * Retained if you ever want Popup V2 later.
       */
      accessCode:
        data.data.access_code,

      email:
        email.trim(),
    })
  } catch (error: any) {
    console.error(
      'Exam Prep subscribe error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to initialize payment',
      },
      { status: 500 }
    )
  }
}
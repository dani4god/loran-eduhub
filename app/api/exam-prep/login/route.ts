import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function POST(req: NextRequest) {
  try {
    const { regNumber } = await req.json()

    if (!regNumber?.trim()) {
      return NextResponse.json(
        {
          error:
            'Registration number is required',
        },
        { status: 400 }
      )
    }

    await connectDB()

    const student =
      await ExamPrepStudent.findOne({
        regNumber: regNumber.trim(),
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Registration number not found',
        },
        { status: 404 }
      )
    }

    const subscription =
      await ExamPrepSubscription.findOne({
        examPrepStudentId:
          student._id,
      })

    const settings =
      await ExamPrepSettings.findOne({
        key: 'global',
      })

    const now = new Date()

    const freeAccess =
      subscription?.wasFreeAtRegistration ===
      true

    const lifetimeAccess =
      subscription?.planDuration ===
      'life'

    const activePaidAccess =
      subscription?.endDate instanceof Date &&
      subscription.endDate > now

    const hasAccess =
      freeAccess ||
      lifetimeAccess ||
      activePaidAccess

    return NextResponse.json({
      success: true,

      student: {
        _id: student._id.toString(),
        regNumber:
          student.regNumber,
        fullName:
          student.fullName,
      },

      locked:
        settings?.isLocked ?? true,

      hasAccess,

      /**
       * CRITICAL:
       *
       * Paid students without a verified active
       * subscription MUST receive true here.
       */
      requiresPayment:
        !hasAccess,
    })
  } catch (error: any) {
    console.error(
      'Exam Prep login error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to login',
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import { generateRegNumber } from '@/lib/examPrep'

export async function POST(req: NextRequest) {
  try {
    const {
      fullName,
      location,
      school,
      subjectsInterested,
    } = await req.json()

    if (
      !fullName?.trim() ||
      !location?.trim() ||
      !school?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Name, location, and school are required',
        },
        { status: 400 }
      )
    }

    await connectDB()

    let regNumber = generateRegNumber()

    while (
      await ExamPrepStudent.exists({
        regNumber,
      })
    ) {
      regNumber = generateRegNumber()
    }

    const student =
      await ExamPrepStudent.create({
        regNumber,
        fullName: fullName.trim(),
        location: location.trim(),
        school: school.trim(),
        subjectsInterested:
          subjectsInterested || [],
      })

    /**
     * Make sure global settings exist.
     */
    const settings =
      await ExamPrepSettings.findOneAndUpdate(
        { key: 'global' },
        {
          $setOnInsert: {
            key: 'global',
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )

    /**
     * IMPORTANT:
     *
     * Snapshot whether Exam Prep was free when
     * this particular student registered.
     *
     * If it was PAID:
     * wasFreeAtRegistration = false
     *
     * They will NOT get access until payment
     * is actually verified.
     */
    await ExamPrepSubscription.create({
      examPrepStudentId: student._id,

      wasFreeAtRegistration:
        !settings.isPaid,
    })

    return NextResponse.json(
      {
        success: true,
        regNumber,
        requiresPayment:
          !!settings.isPaid,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error(
      'Exam Prep registration error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Registration failed',
      },
      { status: 500 }
    )
  }
}
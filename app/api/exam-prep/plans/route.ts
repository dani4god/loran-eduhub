// app/api/exam-prep/plans/route.ts

import {
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function GET() {
  try {
    await connectDB()

    const settings =
      await ExamPrepSettings.findOneAndUpdate(
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
        .lean()

    return NextResponse.json({
      isLocked:
        Boolean(
          settings?.isLocked
        ),

      isPaid:
        Boolean(
          settings?.isPaid
        ),

      plans:
        (
          settings?.plans ||
          []
        )
          .filter(
            (
              plan:
                any
            ) =>
              Boolean(
                plan.enabled
              )
          )
          .map(
            (
              plan:
                any
            ) => ({
              duration:
                plan.duration,

              label:
                plan.label,

              price:
                Number(
                  plan.price ||
                    0
                ),
            })
          ),
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep plans:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load subscription plans.',
      },
      {
        status:
          500,
      }
    )
  }
}
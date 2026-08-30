// app/api/self-paced/availability/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'
import { isLagosSlotInFuture } from '@/lib/lagosTime'

import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } =
      new URL(req.url)

    const courseId =
      searchParams
        .get('courseId')
        ?.trim()

    if (!courseId) {
      return NextResponse.json(
        {
          error:
            'courseId is required',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid courseId',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    const now = new Date()

    const slots =
      await TutorAvailabilitySlot.find({
        courseId,

        isBooked: false,

        /*
         * Either there is no hold,
         * or the existing hold has expired.
         */
        $or: [
          {
            holdExpiresAt: {
              $exists: false,
            },
          },

          {
            holdExpiresAt: null,
          },

          {
            holdExpiresAt: {
              $lte: now,
            },
          },
        ],
      })
        .select(
          '_id date startTime endTime'
        )
        .sort({
          date: 1,
          startTime: 1,
        })
        .lean()

    /*
     * MongoDB's date alone is not enough because
     * startTime is stored separately.
     *
     * Perform the final comparison using Lagos time.
     */
    const availableSlots =
      slots.filter((slot) =>
        isLagosSlotInFuture(
          slot.date,
          slot.startTime
        )
      )

    return NextResponse.json({
      slots: availableSlots,
    })
  } catch (error) {
    console.error(
      'Self-paced availability error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load coaching availability',
      },
      {
        status: 500,
      }
    )
  }
}
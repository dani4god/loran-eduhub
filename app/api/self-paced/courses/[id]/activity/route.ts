// app/api/self-paced/courses/[id]/activity/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'

import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import { getUnlockedWeekNumber } from '@/lib/selfPaced'

// ============================================================
// TYPES
// ============================================================

type ActivityAction =
  | 'page_view'
  | 'page_complete'
  | 'course_open'

interface ActivityBody {
  weekNumber?: number
  pageId?: string
  action?: ActivityAction
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    // ========================================================
    // COURSE ID
    // ========================================================

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: 'Invalid course ID.',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const session = await getServerSession(authOptions)

    if (
      !session ||
      session.user.role !== 'selfpaced_student'
    ) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    // ========================================================
    // BODY
    // ========================================================

    let body: ActivityBody

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request body.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      action,
      weekNumber,
      pageId,
    } = body

    const allowedActions: ActivityAction[] = [
      'page_view',
      'page_complete',
      'course_open',
    ]

    if (
      !action ||
      !allowedActions.includes(action)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid activity action.',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // STUDENT
    // ========================================================

    const student = await SelfPacedStudent.findOne({
      userId: session.user.id,
    }).select('_id')

    if (!student) {
      return NextResponse.json(
        {
          error: 'Student not found.',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // ENROLLMENT
    // ========================================================

    const enrollment =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId: student._id,
        courseId: id,
      })

    if (!enrollment) {
      return NextResponse.json(
        {
          error: 'You do not own this course.',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // COURSE
    // ========================================================

    const course = await SelfPacedCourse.findById(id)

    if (!course) {
      return NextResponse.json(
        {
          error: 'Course not found.',
        },
        {
          status: 404,
        }
      )
    }

    const now = new Date()

    // ========================================================
    // COURSE OPEN
    // ========================================================

    if (action === 'course_open') {
      enrollment.lastActivityAt = now

      await enrollment.save()

      return NextResponse.json({
        success: true,
        action,
        lastActivityAt: now.toISOString(),
      })
    }

    // ========================================================
    // PAGE ACTIVITY VALIDATION
    // ========================================================

    if (
      !Number.isInteger(weekNumber) ||
      !weekNumber ||
      weekNumber < 1
    ) {
      return NextResponse.json(
        {
          error: 'A valid week number is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !pageId ||
      !mongoose.Types.ObjectId.isValid(pageId)
    ) {
      return NextResponse.json(
        {
          error: 'A valid page ID is required.',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // CHECK WEEK ACCESS
    // ========================================================

    const unlockedWeek =
      getUnlockedWeekNumber(enrollment)

    if (weekNumber > unlockedWeek) {
      return NextResponse.json(
        {
          error: 'This week is locked.',
        },
        {
          status: 403,
        }
      )
    }

    const week = course.weeks.find(
      (item: any) =>
        item.weekNumber === weekNumber
    )

    if (!week) {
      return NextResponse.json(
        {
          error: 'Week not found.',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // VERIFY PAGE
    // ========================================================

    const page = week.pages.find(
      (item: any) =>
        item._id?.toString() === pageId
    )

    if (!page) {
      return NextResponse.json(
        {
          error: 'Lesson page not found.',
        },
        {
          status: 404,
        }
      )
    }

    if (!page._id) {
      return NextResponse.json(
        {
          error:
            'Lesson page has no valid identifier.',
        },
        {
          status: 500,
        }
      )
    }

    const pageObjectId = page._id

    // ========================================================
    // FIND EXISTING PAGE PROGRESS
    // ========================================================

    const existingPageProgress =
      enrollment.pageProgress.find(
        (item) =>
          item.weekNumber === weekNumber &&
          item.pageId.toString() === pageId
      )

    // ========================================================
    // EXISTING PAGE
    // ========================================================

    if (existingPageProgress) {
      existingPageProgress.lastViewedAt = now

      if (
        action === 'page_complete' &&
        !existingPageProgress.completed
      ) {
        existingPageProgress.completed = true
        existingPageProgress.completedAt = now
      }
    }

    // ========================================================
    // FIRST PAGE VISIT
    // ========================================================

    else {
      enrollment.pageProgress.push({
        weekNumber,
        pageId: pageObjectId,
        firstViewedAt: now,
        lastViewedAt: now,
        completed:
          action === 'page_complete',
        completedAt:
          action === 'page_complete'
            ? now
            : undefined,
      })
    }

    // ========================================================
    // UPDATE GENERAL ACTIVITY
    // ========================================================

    enrollment.lastActivityAt = now

    await enrollment.save()

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      action,

      weekNumber,

      pageId,

      lastActivityAt: now.toISOString(),
    })
  } catch (error) {
    console.error(
      'Self-paced activity tracking error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to record course activity.',
      },
      {
        status: 500,
      }
    )
  }
}
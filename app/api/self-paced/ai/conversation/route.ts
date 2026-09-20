// app/api/self-paced/ai/conversation/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getServerSession,
} from 'next-auth'

import mongoose from 'mongoose'

import {
  authOptions,
} from '@/lib/auth'

import connectDB from '@/lib/mongodb'

import SelfPacedStudent from '@/models/SelfPacedStudent'

import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'

import SelfPacedCourse from '@/models/SelfPacedCourse'

import SelfPacedAIConversation from '@/models/SelfPacedAIConversation'

import {
  getUnlockedWeekNumber,
} from '@/lib/selfPaced'

// ============================================================
// AUTHORIZED CONTEXT
// ============================================================

async function getAuthorizedContext(
  courseId: string,
  weekNumber: number,
  pageId: string
) {
  const session =
    await getServerSession(
      authOptions
    )

  if (
    !session ||
    session.user.role !==
      'selfpaced_student'
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Unauthorized',
          },
          {
            status:
              401,
          }
        ),
    }
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      courseId
    ) ||
    !mongoose.Types.ObjectId.isValid(
      pageId
    ) ||
    !Number.isInteger(
      weekNumber
    ) ||
    weekNumber <
      1
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Invalid lesson.',
          },
          {
            status:
              400,
          }
        ),
    }
  }

  await connectDB()

  const student =
    await SelfPacedStudent.findOne({
      userId:
        session.user.id,
    })

  if (
    !student
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Student not found.',
          },
          {
            status:
              404,
          }
        ),
    }
  }

  const enrollment =
    await SelfPacedEnrollment.findOne({
      selfPacedStudentId:
        student._id,

      courseId,
    })

  if (
    !enrollment
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'You do not own this course.',
          },
          {
            status:
              403,
          }
        ),
    }
  }

  if (
    enrollment.locked
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'This course is currently locked.',
          },
          {
            status:
              403,
          }
        ),
    }
  }

  const course =
    await SelfPacedCourse.findById(
      courseId
    )

  if (
    !course
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Course not found.',
          },
          {
            status:
              404,
          }
        ),
    }
  }

  const unlockedWeek =
    getUnlockedWeekNumber(
      enrollment
    )

  if (
    weekNumber >
    unlockedWeek
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'This week has not been unlocked.',
          },
          {
            status:
              403,
          }
        ),
    }
  }

  const week =
    course.weeks.find(
      (
        currentWeek
      ) =>
        currentWeek.weekNumber ===
        weekNumber
    )

  if (
    !week
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Week not found.',
          },
          {
            status:
              404,
          }
        ),
    }
  }

  const page =
    week.pages.find(
      (
        currentPage:
          any
      ) =>
        currentPage._id
          ?.toString() ===
        pageId
    )

  if (
    !page
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              'Lesson page not found.',
          },
          {
            status:
              404,
          }
        ),
    }
  }

  return {
    student,
    course,
    page,
  }
}

// ============================================================
// GET HISTORY
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const courseId =
      String(
        searchParams.get(
          'courseId'
        ) ||
          ''
      )

    const weekNumber =
      Number(
        searchParams.get(
          'weekNumber'
        )
      )

    const pageId =
      String(
        searchParams.get(
          'pageId'
        ) ||
          ''
      )

    const context =
      await getAuthorizedContext(
        courseId,
        weekNumber,
        pageId
      )

    if (
      context.error
    ) {
      return context.error
    }

    const conversation =
      await SelfPacedAIConversation.findOne({
        selfPacedStudentId:
          context.student!._id,

        courseId:
          context.course!._id,

        weekNumber,

        pageId:
          context.page!._id,
      }).lean()

    return NextResponse.json({
      messages:
        conversation?.messages?.map(
          (
            message:
              any
          ) => ({
            _id:
              message._id
                ?.toString(),

            role:
              message.role,

            content:
              message.content,

            createdAt:
              message.createdAt,
          })
        ) ||
        [],
    })
  } catch (
    error:
      any
  ) {
    console.error(
      '[SELF PACED AI HISTORY]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load the conversation.',
      },
      {
        status:
          500,
      }
    )
  }
}

// ============================================================
// DELETE HISTORY
// ============================================================

export async function DELETE(
  req: NextRequest
) {
  try {
    const body =
      await req
        .json()
        .catch(
          () => ({})
        )

    const courseId =
      String(
        body.courseId ||
          ''
      )

    const weekNumber =
      Number(
        body.weekNumber
      )

    const pageId =
      String(
        body.pageId ||
          ''
      )

    const context =
      await getAuthorizedContext(
        courseId,
        weekNumber,
        pageId
      )

    if (
      context.error
    ) {
      return context.error
    }

    await SelfPacedAIConversation.deleteOne({
      selfPacedStudentId:
        context.student!._id,

      courseId:
        context.course!._id,

      weekNumber,

      pageId:
        context.page!._id,
    })

    return NextResponse.json({
      success:
        true,
    })
  } catch (
    error
  ) {
    console.error(
      '[SELF PACED AI CLEAR]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not clear the conversation.',
      },
      {
        status:
          500,
      }
    )
  }
}
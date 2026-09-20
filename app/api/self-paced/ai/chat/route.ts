// app/api/self-paced/ai/chat/route.ts

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
  generateSelfPacedAIResponse,
  htmlToStudyText,
  SelfPacedAIAction,
} from '@/lib/selfPacedAI'

import {
  getUnlockedWeekNumber,
} from '@/lib/selfPaced'

// ============================================================
// TYPES
// ============================================================

interface ChatRequestBody {
  courseId?: string

  weekNumber?: number

  pageId?: string

  message?: string

  action?:
    SelfPacedAIAction
}

// ============================================================
// LIMITS
// ============================================================

const MAX_MESSAGE_LENGTH =
  2500

const MAX_STORED_MESSAGES =
  60

const HISTORY_TO_AI =
  10

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const session =
      await getServerSession(
        authOptions
      )

    if (
      !session ||
      session.user.role !==
        'selfpaced_student'
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status:
            401,
        }
      )
    }

    // ========================================================
    // BODY
    // ========================================================

    const body =
      (await req
        .json()
        .catch(
          () => ({})
        )) as ChatRequestBody

    const courseId =
      String(
        body.courseId ||
          ''
      ).trim()

    const pageId =
      String(
        body.pageId ||
          ''
      ).trim()

    const weekNumber =
      Number(
        body.weekNumber
      )

    const action:
      SelfPacedAIAction =
      body.action ||
      'chat'

    let message =
      String(
        body.message ||
          ''
      ).trim()

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid course.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        pageId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid lesson page.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      !Number.isInteger(
        weekNumber
      ) ||
      weekNumber <
        1
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid week.',
        },
        {
          status:
            400,
        }
      )
    }

    const validActions:
      SelfPacedAIAction[] =
      [
        'chat',
        'explain',
        'example',
        'summarize',
        'quiz',
      ]

    if (
      !validActions.includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid AI action.',
        },
        {
          status:
            400,
        }
      )
    }

    // Quick actions don't require the student
    // to type a custom message.
    if (
      !message
    ) {
      switch (
        action
      ) {
        case 'explain':
          message =
            'Please explain this lesson simply.'
          break

        case 'example':
          message =
            'Please give me another example of the concept in this lesson.'
          break

        case 'summarize':
          message =
            'Please summarize this lesson for revision.'
          break

        case 'quiz':
          message =
            'Please quiz me on this lesson.'
          break

        default:
          return NextResponse.json(
            {
              error:
                'Please enter a question.',
            },
            {
              status:
                400,
            }
          )
      }
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Your message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
        },
        {
          status:
            400,
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

    const student =
      await SelfPacedStudent.findOne({
        userId:
          session.user.id,
      })

    if (
      !student
    ) {
      return NextResponse.json(
        {
          error:
            'Student not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // ENROLLMENT
    // ========================================================

    const enrollment =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId,
      })

    if (
      !enrollment
    ) {
      return NextResponse.json(
        {
          error:
            'You do not own this course.',
        },
        {
          status:
            403,
        }
      )
    }

    if (
      enrollment.locked
    ) {
      return NextResponse.json(
        {
          error:
            'This course is currently locked.',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // COURSE
    // ========================================================

    const course =
      await SelfPacedCourse.findById(
        courseId
      )

    if (
      !course
    ) {
      return NextResponse.json(
        {
          error:
            'Course not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // WEEK ACCESS
    // ========================================================

    const unlockedWeek =
      getUnlockedWeekNumber(
        enrollment
      )

    if (
      weekNumber >
      unlockedWeek
    ) {
      return NextResponse.json(
        {
          error:
            'This week has not been unlocked yet.',
        },
        {
          status:
            403,
        }
      )
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
      return NextResponse.json(
        {
          error:
            'Week not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // PAGE
    // ========================================================

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
      return NextResponse.json(
        {
          error:
            'Lesson page not found.',
        },
        {
          status:
            404,
        }
      )
    }

    const lessonText =
      htmlToStudyText(
        page.content ||
          ''
      )

    if (
      !lessonText
    ) {
      return NextResponse.json(
        {
          error:
            'This lesson does not contain enough material for the study assistant yet.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // CONVERSATION
    // ========================================================

    let conversation =
      await SelfPacedAIConversation.findOne({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,

        weekNumber,

        pageId:
          page._id,
      })

    if (
      !conversation
    ) {
      conversation =
        new SelfPacedAIConversation({
          selfPacedStudentId:
            student._id,

          courseId:
            course._id,

          weekNumber,

          pageId:
            page._id,

          messages:
            [],
        })
    }

    // ========================================================
    // PREVIOUS HISTORY
    // ========================================================

    const history =
      conversation.messages
        .slice(
          -HISTORY_TO_AI
        )
        .map(
          (
            previous:
              any
          ) => ({
            role:
              previous.role as
                | 'user'
                | 'assistant',

            content:
              previous.content,
          })
        )

    // ========================================================
    // GENERATE AI RESPONSE
    // ========================================================

    const answer =
      await generateSelfPacedAIResponse({
        studentName:
          student.firstName,

        courseTitle:
          course.title,

        weekNumber:
          week.weekNumber,

        weekTitle:
          week.title,

        pageTitle:
          page.title,

        pageContent:
          lessonText,

        userMessage:
          message,

        action,

        history,
      })

    // ========================================================
    // SAVE CONVERSATION
    // ========================================================

    conversation.messages.push({
      role:
        'user',

      content:
        message,

      createdAt:
        new Date(),
    })

    conversation.messages.push({
      role:
        'assistant',

      content:
        answer,

      createdAt:
        new Date(),
    })

    /*
     * Prevent an indefinitely growing MongoDB document.
     *
     * Keep the latest messages.
     */
    if (
      conversation.messages
        .length >
      MAX_STORED_MESSAGES
    ) {
      conversation.messages =
        conversation.messages.slice(
          -MAX_STORED_MESSAGES
        )
    }

    await conversation.save()

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      answer,

      conversationId:
        conversation._id.toString(),

      context: {
        courseTitle:
          course.title,

        weekNumber:
          week.weekNumber,

        weekTitle:
          week.title,

        pageId:
          pageId,

        pageTitle:
          page.title,
      },
    })
  } catch (
    error:
      any
  ) {
    console.error(
      '[SELF PACED AI CHAT]',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'The study assistant could not respond. Please try again.',
      },
      {
        status:
          500,
      }
    )
  }
}
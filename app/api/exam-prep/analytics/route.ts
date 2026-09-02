// app/api/exam-prep/analytics/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepAttempt from '@/models/ExamPrepAttempt'
import ExamPrepAIAnalysis from '@/models/ExamPrepAIAnalysis'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  buildExamPrepAnalytics,
} from '@/lib/examPrepAnalytics'

import {
  generatePerformanceCoach,
} from '@/lib/examAI'

export async function GET(
  req: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATE EXAM PREP STUDENT
    // ========================================================

    const auth =
      await requireExamPrepStudent(
        req
      )

    if (!auth.ok) {
      return auth.response
    }

    // ========================================================
    // 2. CONNECT TO DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // 3. LOAD STUDENT ATTEMPTS
    // ========================================================

    const attempts =
      await ExamPrepAttempt.find({
        examPrepStudentId:
          auth.student._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean()

    // ========================================================
    // 4. BUILD DETERMINISTIC ANALYTICS
    // ========================================================

    const stats =
      buildExamPrepAnalytics(
        attempts
      )

    // ========================================================
    // 5. NO ATTEMPTS YET
    // ========================================================

    if (
      !stats.totalAttempts
    ) {
      return NextResponse.json({
        ...stats,

        aiCoach:
          null,

        aiGeneratedAt:
          null,
      })
    }

    // ========================================================
    // 6. CHECK CACHE
    // ========================================================

    const url =
      new URL(req.url)

    const force =
      url.searchParams.get(
        'refresh'
      ) === '1'

    let cached =
      await ExamPrepAIAnalysis.findOne({
        examPrepStudentId:
          auth.student._id,
      })

    let aiCoach =
      cached?.aiCoach ||
      null

    // ========================================================
    // 7. DETERMINE IF AI ANALYSIS SHOULD RUN
    // ========================================================

    const lastAttemptCount =
      Number(
        cached?.basedOnAttemptCount ||
        0
      )

    const newAttemptCount =
      stats.totalAttempts -
      lastAttemptCount

    const shouldGenerateAI =
      Boolean(
        process.env.GROQ_API_KEY
      ) &&
      (
        force ||
        !cached ||
        newAttemptCount >= 3
      )

    // ========================================================
    // 8. GENERATE AI COACH
    // ========================================================

    if (shouldGenerateAI) {
      try {
        aiCoach =
          await generatePerformanceCoach(
            stats
          )

        cached =
          await ExamPrepAIAnalysis.findOneAndUpdate(
            {
              examPrepStudentId:
                auth.student._id,
            },
            {
              $set: {
                basedOnAttemptCount:
                  stats.totalAttempts,

                deterministicSnapshot:
                  stats,

                aiCoach,

                generatedAt:
                  new Date(),
              },
            },
            {
              upsert:
                true,

              returnDocument:
                'after',
            }
          )
      } catch (error) {
        /*
         * AI coaching is supplementary.
         * Analytics should still work when Groq is unavailable
         * or rate-limited.
         */

        console.error(
          'AI analytics:',
          error
        )
      }
    }

    // ========================================================
    // 9. RESPONSE
    // ========================================================

    return NextResponse.json({
      ...stats,

      aiCoach,

      aiGeneratedAt:
        cached?.generatedAt ||
        null,
    })
  } catch (error) {
    console.error(
      'Analytics:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load analytics.',
      },
      {
        status: 500,
      }
    )
  }
}
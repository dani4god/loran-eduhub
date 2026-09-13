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

// ============================================================
// GET ANALYTICS
// ============================================================

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

    if (
      !auth.ok
    ) {
      return auth.response
    }

    // ========================================================
    // 2. CONNECT TO DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // 3. LOAD ATTEMPTS + EXISTING AI ANALYSIS IN PARALLEL
    // ========================================================

    /*
     * Important:
     *
     * This route must remain fast.
     *
     * We deliberately DO NOT call Groq from this GET route.
     *
     * The analytics page should never have to wait for:
     *
     * - Groq rate limits
     * - AI retries
     * - token-per-minute recovery
     * - network delays
     *
     * The page loads deterministic analytics immediately and
     * uses the most recently cached AI coach if one exists.
     */

    const [
      attempts,
      cached,
    ] =
      await Promise.all([
        ExamPrepAttempt
          .find({
            examPrepStudentId:
              auth.student._id,
          })
          .sort({
            createdAt:
              1,
          })
          .lean(),

        ExamPrepAIAnalysis
          .findOne({
            examPrepStudentId:
              auth.student._id,
          })
          .lean(),
      ])

    // ========================================================
    // 4. BUILD DETERMINISTIC ANALYTICS
    // ========================================================

    /*
     * This does not use Groq.
     *
     * Scores, averages, strengths, weaknesses and other normal
     * analytics are calculated directly from the student's
     * examination history.
     */

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

        aiBasedOnAttemptCount:
          0,

        aiNeedsRefresh:
          false,
      })
    }

    // ========================================================
    // 6. EXISTING AI COACH
    // ========================================================

    /*
     * We only read the cached AI coach here.
     *
     * We do NOT regenerate it during GET.
     */

    const aiCoach =
      cached?.aiCoach ||
      null

    const aiBasedOnAttemptCount =
      Number(
        cached
          ?.basedOnAttemptCount ||
        0
      )

    // ========================================================
    // 7. DETERMINE WHETHER AI ANALYSIS IS STALE
    // ========================================================

    /*
     * This tells the frontend whether enough new examination
     * attempts have occurred to justify generating a new AI
     * coaching report.
     *
     * Previously this route automatically called Groq once
     * there were 3 new attempts.
     *
     * That caused analytics page loads to take 40–50 seconds
     * whenever Groq was rate-limited.
     *
     * We now only REPORT that the coach needs refreshing.
     *
     * Another route can perform the actual AI generation.
     */

    const newAttemptCount =
      Math.max(
        0,
        Number(
          stats.totalAttempts
        ) -
          aiBasedOnAttemptCount
      )

    const aiNeedsRefresh =
      !aiCoach ||
      newAttemptCount >=
        3

    // ========================================================
    // 8. RESPONSE
    // ========================================================

    return NextResponse.json({
      ...stats,

      aiCoach,

      aiGeneratedAt:
        cached?.generatedAt ||
        null,

      aiBasedOnAttemptCount,

      newAttemptsSinceAIAnalysis:
        newAttemptCount,

      aiNeedsRefresh,
    })
  } catch (
    error
  ) {
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
        status:
          500,
      }
    )
  }
}
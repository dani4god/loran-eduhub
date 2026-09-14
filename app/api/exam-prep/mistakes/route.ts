// app/api/exam-prep/mistakes/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepAttempt from '@/models/ExamPrepAttempt'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

// ============================================================
// ANSWER HELPERS
// ============================================================

type AnswerOptions = {
  a?: string
  b?: string
  c?: string
  d?: string
}

/**
 * Converts:
 *
 * "a"
 *
 * into:
 *
 * "Dovetail joint"
 *
 * using the question's stored options.
 *
 * If options are unavailable, the original answer is returned.
 */
function getAnswerText(
  answer: unknown,
  options: AnswerOptions | undefined
) {
  const rawAnswer =
    String(
      answer ?? ''
    )
      .trim()

  if (!rawAnswer) {
    return ''
  }

  const key =
    rawAnswer
      .toLowerCase()

  if (
    key !== 'a' &&
    key !== 'b' &&
    key !== 'c' &&
    key !== 'd'
  ) {
    /*
     * The stored answer may already be the actual answer text.
     */
    return rawAnswer
  }

  const optionText =
    options?.[
      key as
        keyof AnswerOptions
    ]

  return (
    String(
      optionText ?? ''
    )
      .trim() ||
    rawAnswer.toUpperCase()
  )
}

/**
 * Returns a display version such as:
 *
 * B. Mortise and tenon
 *
 * If the answer is already text, it simply returns the text.
 */
function formatAnswer(
  answer: unknown,
  options: AnswerOptions | undefined
) {
  const rawAnswer =
    String(
      answer ?? ''
    )
      .trim()

  if (!rawAnswer) {
    return ''
  }

  const key =
    rawAnswer
      .toLowerCase()

  if (
    key !== 'a' &&
    key !== 'b' &&
    key !== 'c' &&
    key !== 'd'
  ) {
    return rawAnswer
  }

  const answerText =
    getAnswerText(
      key,
      options
    )

  /*
   * If options were not stored, answerText will simply be
   * "A", "B", "C", or "D".
   */
  if (
    answerText.toLowerCase() ===
    key
  ) {
    return key.toUpperCase()
  }

  return `${key.toUpperCase()}. ${answerText}`
}

// ============================================================
// GET MISTAKES
// ============================================================

export async function GET(
  req: NextRequest
) {
  const auth =
    await requireExamPrepStudent(
      req
    )

  if (!auth.ok) {
    return auth.response
  }

  await connectDB()

  // ==========================================================
  // LOAD RECENT ATTEMPTS
  // ==========================================================

  const attempts =
    await ExamPrepAttempt
      .find({
        examPrepStudentId:
          auth.student._id,
      })
      .sort({
        createdAt:
          -1,
      })
      .limit(
        60
      )
      .lean()

  // ==========================================================
  // BUILD MISTAKE BANK
  // ==========================================================

  const mistakes =
    attempts.flatMap(
      (
        attempt:
          any
      ) =>
        (
          attempt.breakdown ||
          []
        )
          .filter(
            (
              item:
                any
            ) =>
              !item.isCorrect
          )
          .map(
            (
              item:
                any
            ) => {
              const options:
                AnswerOptions =
                item.options &&
                typeof item.options ===
                  'object'
                  ? {
                      a:
                        item.options.a,
                      b:
                        item.options.b,
                      c:
                        item.options.c,
                      d:
                        item.options.d,
                    }
                  : {}

              const selected =
                String(
                  item.selected ??
                    ''
                )
                  .trim()

              const correct =
                String(
                  item.correct ??
                    ''
                )
                  .trim()

              return {
                attemptId:
                  attempt._id.toString(),

                createdAt:
                  attempt.createdAt,

                subject:
                  item.subject ||
                  attempt.subject,

                topic:
                  item.topic ||
                  'General',

                question:
                  item.question,

                // =============================================
                // ORIGINAL OPTIONS
                // =============================================

                options,

                // =============================================
                // ORIGINAL LETTERS
                // =============================================

                selected,

                correct,

                // =============================================
                // ACTUAL ANSWER TEXT
                // =============================================

                selectedText:
                  getAnswerText(
                    selected,
                    options
                  ),

                correctText:
                  getAnswerText(
                    correct,
                    options
                  ),

                // =============================================
                // DISPLAY VERSIONS
                // =============================================

                selectedDisplay:
                  selected
                    ? formatAnswer(
                        selected,
                        options
                      )
                    : 'Unanswered',

                correctDisplay:
                  formatAnswer(
                    correct,
                    options
                  ),

                explanation:
                  item.explanation ||
                  '',
              }
            }
          )
    )

  // ==========================================================
  // RESPONSE
  // ==========================================================

  return NextResponse.json({
    mistakes:
      mistakes.slice(
        0,
        250
      ),
  })
}
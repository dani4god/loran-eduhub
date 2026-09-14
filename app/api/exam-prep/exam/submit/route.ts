// app/api/exam-prep/exam/submit/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepSession from '@/models/ExamPrepSession'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

// ============================================================
// TYPES
// ============================================================

interface QuestionOptions {
  a: string
  b: string
  c: string
  d: string
}

interface Question {
  id: string

  fingerprint: string

  text: string

  options: QuestionOptions

  correctAnswer: string

  subject: string

  topic?: string

  subtopic?: string

  difficulty?: string

  standard: string

  source: string

  explanation?: string
}

interface BreakdownItem {
  questionId: string

  fingerprint: string

  question: string

  options: QuestionOptions

  selected: string

  correct: string

  selectedText: string

  correctText: string

  isCorrect: boolean

  subject: string

  topic: string

  subtopic: string

  difficulty: string

  standard: string

  source: string

  explanation: string
}

interface ResponseBreakdownItem {
  question: string

  options: QuestionOptions

  selected: string

  correct: string

  selectedText: string

  correctText: string

  isCorrect: boolean

  topic: string

  explanation: string
}

interface SubmitRequest {
  sessionToken: string

  answers?: Record<
    string,
    string
  >

  durationSeconds?: number
}

interface SuccessResponse {
  success: boolean

  score: number

  total: number

  percentage: number

  breakdown:
    ResponseBreakdownItem[]
}

// ============================================================
// HELPERS
// ============================================================

function normalizeAnswer(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase()
}

function normalizeOptions(
  options:
    Partial<
      QuestionOptions
    > |
    undefined
):
  QuestionOptions {
  return {
    a:
      String(
        options?.a ??
          ''
      )
        .trim(),

    b:
      String(
        options?.b ??
          ''
      )
        .trim(),

    c:
      String(
        options?.c ??
          ''
      )
        .trim(),

    d:
      String(
        options?.d ??
          ''
      )
        .trim(),
  }
}

/**
 * Converts an answer letter into the actual option text.
 *
 * Example:
 *
 * answer = "b"
 *
 * options = {
 *   a: "Tenon saw",
 *   b: "Mortise chisel",
 *   c: "Jack plane",
 *   d: "G-clamp"
 * }
 *
 * result:
 *
 * "Mortise chisel"
 */
function getAnswerText(
  answer: string,
  options: QuestionOptions
) {
  const key =
    normalizeAnswer(
      answer
    )

  if (
    key === 'a' ||
    key === 'b' ||
    key === 'c' ||
    key === 'd'
  ) {
    return (
      options[key] ||
      key.toUpperCase()
    )
  }

  /*
   * This also supports a future case where selected/correct
   * is already stored as actual text instead of a letter.
   */
  return String(
    answer || ''
  )
    .trim()
}

// ============================================================
// POST — SUBMIT PRACTICE EXAM
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATION
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
    // REQUEST BODY
    // ========================================================

    const body =
      (
        await req.json()
      ) as SubmitRequest

    const sessionToken =
      String(
        body
          ?.sessionToken ??
          ''
      )
        .trim()

    const answers =
      body?.answers &&
      typeof body.answers ===
        'object'
        ? body.answers
        : {}

    const durationSeconds =
      Number(
        body
          ?.durationSeconds ??
          0
      )

    if (
      !sessionToken
    ) {
      return NextResponse.json(
        {
          error:
            'Exam session token is required.',
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
    // LOAD SESSION
    // ========================================================

    const session =
      await ExamPrepSession
        .findOne({
          sessionToken,

          examPrepStudentId:
            auth.student._id,
        })

    if (
      !session
    ) {
      return NextResponse.json(
        {
          error:
            'Exam session expired or not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // PREVENT DUPLICATE SUBMISSION
    // ========================================================

    if (
      session.used
    ) {
      return NextResponse.json(
        {
          error:
            'Exam already submitted.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // VALIDATE QUESTIONS
    // ========================================================

    const questions:
      Question[] =
      Array.isArray(
        session.questions
      )
        ? (
            session.questions as
              Question[]
          )
        : []

    if (
      questions.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            'This exam session contains no questions.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // MARK EXAM
    // ========================================================

    let score =
      0

    const breakdown:
      BreakdownItem[] =
      questions.map(
        (
          question
        ) => {
          // ==================================================
          // ANSWERS
          // ==================================================

          const selected =
            normalizeAnswer(
              answers?.[
                question.id
              ]
            )

          const correct =
            normalizeAnswer(
              question.correctAnswer
            )

          const isCorrect =
            Boolean(
              selected
            ) &&
            selected ===
              correct

          if (
            isCorrect
          ) {
            score +=
              1
          }

          // ==================================================
          // OPTIONS
          // ==================================================

          const options =
            normalizeOptions(
              question.options
            )

          // ==================================================
          // ACTUAL ANSWER TEXT
          // ==================================================

          const selectedText =
            selected
              ? getAnswerText(
                  selected,
                  options
                )
              : ''

          const correctText =
            getAnswerText(
              correct,
              options
            )

          // ==================================================
          // BREAKDOWN RECORD
          // ==================================================

          return {
            questionId:
              question.id,

            fingerprint:
              question.fingerprint,

            question:
              question.text,

            /*
             * Important:
             *
             * These options are now saved permanently with the
             * attempt so Mistake Bank can display actual answer
             * text later.
             */
            options,

            selected,

            correct,

            /*
             * These make the Mistake Bank even easier to render.
             */
            selectedText,

            correctText,

            isCorrect,

            subject:
              question.subject,

            topic:
              question.topic ||
              'General',

            subtopic:
              question.subtopic ||
              '',

            difficulty:
              question.difficulty ||
              'medium',

            standard:
              question.standard,

            source:
              question.source,

            explanation:
              question.explanation ||
              '',
          }
        }
      )

    // ========================================================
    // SCORE
    // ========================================================

    const total =
      questions.length

    const percentage =
      total >
        0
        ? Math.round(
            (
              score /
              total
            ) *
              100
          )
        : 0

    // ========================================================
    // SAFE DURATION
    // ========================================================

    const requestedDuration =
      Number.isFinite(
        durationSeconds
      )
        ? Math.max(
            0,
            durationSeconds
          )
        : 0

    const maximumDuration =
      Math.max(
        0,
        Number(
          session.durationMinutes ||
            0
        ) *
          60
      )

    const safeDuration =
      maximumDuration >
        0
        ? Math.min(
            maximumDuration,
            requestedDuration
          )
        : requestedDuration

    // ========================================================
    // SAVE ATTEMPT
    // ========================================================

    await ExamPrepAttempt.create({
      examPrepStudentId:
        auth.student._id,

      attemptType:
        'practice',

      examType:
        session.examType,

      subject:
        session.subject,

      studentClass:
        session.studentClass,

      score,

      total,

      percentage,

      durationSeconds:
        safeDuration,

      breakdown,
    })

    // ========================================================
    // MARK SESSION AS USED
    // ========================================================

    session.used =
      true

    await session.save()

    // ========================================================
    // RESPONSE
    // ========================================================

    const response:
      SuccessResponse = {
      success:
        true,

      score,

      total,

      percentage,

      breakdown:
        breakdown.map(
          (
            item
          ) => ({
            question:
              item.question,

            options:
              item.options,

            selected:
              item.selected,

            correct:
              item.correct,

            selectedText:
              item.selectedText,

            correctText:
              item.correctText,

            isCorrect:
              item.isCorrect,

            topic:
              item.topic,

            explanation:
              item.explanation,
          })
        ),
    }

    return NextResponse.json(
      response
    )
  } catch (
    error
  ) {
    console.error(
      'Exam submit:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not submit exam.',
      },
      {
        status:
          500,
      }
    )
  }
}
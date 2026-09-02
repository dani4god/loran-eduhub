// app/api/exam-prep/arena/[roomCode]/submit/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  getArenaState,
  totalPossible,
} from '@/lib/examArena'

// ============================================================
// TYPES
// ============================================================

type RouteContext = {
  params: Promise<{
    roomCode: string
  }>
}

type AnswerMap = Record<
  string,
  unknown
>

// ============================================================
// HELPERS
// ============================================================

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeRoomCode(
  value: unknown
) {
  return normalizeText(
    value
  ).toUpperCase()
}

function normalizeAnswer(
  value: unknown
):
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | '' {
  const answer =
    normalizeText(
      value
    ).toLowerCase()

  if (
    answer === 'a' ||
    answer === 'b' ||
    answer === 'c' ||
    answer === 'd'
  ) {
    return answer
  }

  return ''
}

function normalizeDifficulty(
  value: unknown
):
  | 'easy'
  | 'medium'
  | 'hard' {
  const difficulty =
    normalizeText(
      value
    ).toLowerCase()

  if (
    difficulty === 'easy'
  ) {
    return 'easy'
  }

  if (
    difficulty === 'hard'
  ) {
    return 'hard'
  }

  return 'medium'
}

function normalizeSource(
  value: unknown
):
  | 'ai'
  | 'aloc'
  | 'competition' {
  const source =
    normalizeText(
      value
    ).toLowerCase()

  if (
    source === 'aloc'
  ) {
    return 'aloc'
  }

  if (
    source === 'competition'
  ) {
    return 'competition'
  }

  return 'ai'
}

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(
      value
    )

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback
}

function roundPercentage(
  score: number,
  total: number
) {
  if (
    total <= 0
  ) {
    return 0
  }

  return Math.round(
    (
      score /
      total
    ) *
      10000
  ) / 100
}

// ============================================================
// SERVER-DERIVED DURATION
// ============================================================

function deriveRoundDurationSeconds(
  room: any,
  state: any,
  subject: any
) {
  /*
   * Never trust the browser's durationSeconds for competition
   * ranking.
   *
   * We calculate elapsed round time from server timestamps.
   *
   * getArenaState() is already responsible for determining the
   * active round from room.startedAt and subject durations.
   *
   * If your getArenaState() exposes subjectStartedAt or
   * roundStartedAt, use that.
   *
   * Otherwise use elapsedSecondsWithinSubject if available.
   */

  const possibleValues = [
    state?.elapsedSecondsWithinSubject,
    state?.subjectElapsedSeconds,
    state?.roundElapsedSeconds,
  ]

  for (
    const value of
      possibleValues
  ) {
    const parsed =
      Number(
        value
      )

    if (
      Number.isFinite(
        parsed
      ) &&
      parsed >= 0
    ) {
      return Math.min(
        subject.durationMinutes *
          60,
        Math.floor(
          parsed
        )
      )
    }
  }

  /*
   * Fallback.
   *
   * This is still safer than accepting an arbitrary client value
   * for ranking. If exact elapsed-round time is not exposed by
   * getArenaState(), we use the maximum configured duration.
   *
   * Later we can improve lib/examArena.ts to expose the precise
   * roundStart timestamp.
   */

  return (
    subject.durationMinutes *
    60
  )
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest,
  {
    params,
  }: RouteContext
) {
  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

    /*
     * Use requireExamPrepStudent, not requireExamPrepAccess.
     *
     * A student who is already inside a live Arena should still
     * be able to finish and submit if the global Exam Prep lock
     * is switched on midway through the competition.
     */

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
    // 2. ROOM CODE
    // ========================================================

    const {
      roomCode,
    } =
      await params

    const cleanRoomCode =
      normalizeRoomCode(
        roomCode
      )

    if (
      !cleanRoomCode
    ) {
      return NextResponse.json(
        {
          error:
            'Room code is required.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // 3. REQUEST BODY
    // ========================================================

    let body:
      any

    try {
      body =
        await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body.',
        },
        {
          status:
            400,
        }
      )
    }

    const answers:
      AnswerMap =
      body?.answers &&
      typeof body.answers ===
        'object' &&
      !Array.isArray(
        body.answers
      )
        ? body.answers
        : {}

    // ========================================================
    // 4. DATABASE
    // ========================================================

    await connectDB()

    const room =
      await ExamCompetitionRoom
        .findOne({
          roomCode:
            cleanRoomCode,
        })

    if (
      !room
    ) {
      return NextResponse.json(
        {
          error:
            'Room not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // 5. ROOM STATUS
    // ========================================================

    if (
      room.status ===
      'cancelled'
    ) {
      return NextResponse.json(
        {
          error:
            'This competition has been cancelled.',
        },
        {
          status:
            409,
        }
      )
    }

    if (
      !room.startedAt
    ) {
      return NextResponse.json(
        {
          error:
            'This competition has not started.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 6. ARENA STATE
    // ========================================================

    const state =
      getArenaState(
        room
      )

    if (
      state.phase !==
      'subject'
    ) {
      return NextResponse.json(
        {
          error:
            'No active subject round.',
        },
        {
          status:
            409,
        }
      )
    }

    const subjectIndex =
      Number(
        state.currentSubjectIndex
      )

    if (
      !Number.isInteger(
        subjectIndex
      ) ||
      subjectIndex < 0 ||
      !room.subjects?.[
        subjectIndex
      ]
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid active subject.',
        },
        {
          status:
            409,
        }
      )
    }

    const subject =
      room.subjects[
        subjectIndex
      ]

    // ========================================================
    // 7. SUBJECT MUST BE READY
    // ========================================================

    if (
      subject
        .generationStatus !==
        'ready' ||
      !Array.isArray(
        subject.questions
      ) ||
      subject.questions.length ===
        0
    ) {
      return NextResponse.json(
        {
          error:
            'The active subject is not ready for submission.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 8. PARTICIPANT
    // ========================================================

    const participant =
      await ExamCompetitionParticipant
        .findOne({
          roomId:
            room._id,

          examPrepStudentId:
            auth.student._id,
        })

    if (
      !participant
    ) {
      return NextResponse.json(
        {
          error:
            'You have not joined this room.',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // 9. REQUIRED SCREEN SHARE
    // ========================================================

    /*
     * This is not tamper-proof proctoring, but it gives the
     * server its own enforcement layer.
     */

    if (
      room.screenShareMode ===
      'required'
    ) {
      const heartbeat =
        participant
          .lastScreenShareHeartbeat
          ? new Date(
              participant
                .lastScreenShareHeartbeat
            ).getTime()
          : 0

      const heartbeatFresh =
        heartbeat > 0 &&
        Date.now() -
          heartbeat <=
          30_000

      if (
        !participant
          .screenShareActive ||
        !heartbeatFresh
      ) {
        return NextResponse.json(
          {
            error:
              'Screen sharing is required and must be active before submitting.',
          },
          {
            status:
              403,
          }
        )
      }
    }

    // ========================================================
    // 10. DUPLICATE CHECK
    // ========================================================

    const alreadySubmitted =
      participant
        .subjectResults
        ?.some(
          (
            result:
              any
          ) =>
            result
              .subject ===
            subject.subject
        )

    if (
      alreadySubmitted
    ) {
      return NextResponse.json(
        {
          error:
            'Subject already submitted.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 11. SERVER-SIDE SCORING
    // ========================================================

    let score =
      0

    const breakdown =
      subject.questions.map(
        (
          question:
            any
        ) => {
          const selected =
            normalizeAnswer(
              answers?.[
                question.id
              ]
            )

          const correct =
            normalizeAnswer(
              question
                .correctAnswer
            )

          const isCorrect =
            Boolean(
              selected
            ) &&
            Boolean(
              correct
            ) &&
            selected ===
              correct

          if (
            isCorrect
          ) {
            score +=
              1
          }

          return {
            questionId:
              question.id,

            fingerprint:
              question.fingerprint,

            question:
              question.text,

            selected,

            correct,

            isCorrect,

            subject:
              subject.subject,

            topic:
              normalizeText(
                question.topic
              ) ||
              'General',

            subtopic:
              normalizeText(
                question.subtopic
              ),

            difficulty:
              normalizeDifficulty(
                question
                  .difficulty
              ),

            standard:
              normalizeText(
                question.standard
              ) ||
              'mixed',

            /*
             * Preserve original provider provenance.
             */
            source:
              normalizeSource(
                question.source
              ),

            explanation:
              normalizeText(
                question
                  .explanation
              ),
          }
        }
      )

    const total =
      subject.questions
        .length

    const percentage =
      roundPercentage(
        score,
        total
      )

    // ========================================================
    // 12. SERVER-DERIVED TIME
    // ========================================================

    const used =
      deriveRoundDurationSeconds(
        room,
        state,
        subject
      )

    // ========================================================
    // 13. RESULT OBJECT
    // ========================================================

    const submittedAt =
      new Date()

    const result = {
      subject:
        subject.subject,

      score,

      total,

      percentage,

      durationSeconds:
        used,

      submittedAt,

      breakdown,
    }

    // ========================================================
    // 14. ATOMIC PARTICIPANT UPDATE
    // ========================================================

    /*
     * Critical:
     *
     * Do not rely only on:
     *
     * findOne()
     * check array
     * save()
     *
     * because two simultaneous POST requests can both pass the
     * duplicate check.
     *
     * The filter below only succeeds if subjectResults does not
     * already contain this subject.
     */

    const updatedParticipant =
      await ExamCompetitionParticipant
        .findOneAndUpdate(
          {
            _id:
              participant._id,

            roomId:
              room._id,

            examPrepStudentId:
              auth.student._id,

            subjectResults: {
              $not: {
                $elemMatch: {
                  subject:
                    subject
                      .subject,
                },
              },
            },
          },

          {
            $push: {
              subjectResults:
                result,
            },
          },

          {
            new:
              true,
          }
        )

    if (
      !updatedParticipant
    ) {
      return NextResponse.json(
        {
          error:
            'Subject already submitted.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 15. RECALCULATE PARTICIPANT TOTALS
    // ========================================================

    const competitionTotalPossible =
      totalPossible(
        room
      )

    const totalScore =
      updatedParticipant
        .subjectResults
        .reduce(
          (
            sum:
              number,
            item:
              any
          ) =>
            sum +
            safeNumber(
              item.score
            ),
          0
        )

    const totalDurationSeconds =
      updatedParticipant
        .subjectResults
        .reduce(
          (
            sum:
              number,
            item:
              any
          ) =>
            sum +
            safeNumber(
              item
                .durationSeconds
            ),
          0
        )

    const overallPercentage =
      competitionTotalPossible >
      0
        ? Math.round(
            (
              totalScore /
              competitionTotalPossible
            ) *
              10000
          ) / 100
        : 0

    updatedParticipant.totalScore =
      totalScore

    updatedParticipant.totalPossible =
      competitionTotalPossible

    updatedParticipant.overallPercentage =
      overallPercentage

    updatedParticipant.totalDurationSeconds =
      totalDurationSeconds

    await updatedParticipant.save()

    // ========================================================
    // 16. SAVE ANALYTICS ATTEMPT
    // ========================================================

    /*
     * This gives Arena results to the same analytics system used
     * by practice exams.
     */

    try {
      await ExamPrepAttempt
        .findOneAndUpdate(
          {
            examPrepStudentId:
              auth.student._id,

            competitionRoomId:
              room._id,

            subject:
              subject.subject,

            attemptType:
              'competition',
          },

          {
            $set: {
              examPrepStudentId:
                auth.student._id,

              competitionRoomId:
                room._id,

              attemptType:
                'competition',

              examType:
                'mixed',

              subject:
                subject.subject,

              score,

              total,

              percentage,

              durationSeconds:
                used,

              breakdown,
            },
          },

          {
            upsert:
              true,

            new:
              true,
          }
        )
    } catch (
      attemptError
    ) {
      /*
       * Do not reject the student's valid Arena submission just
       * because the analytics mirror failed.
       */
      console.error(
        'Arena analytics attempt save:',
        attemptError
      )
    }

    // ========================================================
    // 17. RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      result: {
        subject:
          subject.subject,

        score,

        total,

        percentage,

        durationSeconds:
          used,

        submittedAt,
      },

      totals: {
        score:
          totalScore,

        possible:
          competitionTotalPossible,

        percentage:
          overallPercentage,

        durationSeconds:
          totalDurationSeconds,
      },
    })
  } catch (
    error
  ) {
    console.error(
      'Arena submit:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not submit Arena round.',
      },
      {
        status:
          500,
      }
    )
  }
}
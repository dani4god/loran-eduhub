// app/api/exam-prep/arena/[roomCode]/prepare/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'

import {
  requireExamPrepAccess,
} from '@/lib/examPrepAuth'

import {
  getAIQuestions,
  questionFingerprint,
} from '@/lib/examAI'

// ============================================================
// TYPES
// ============================================================

type RouteContext = {
  params: Promise<{
    roomCode: string
  }>
}

type PreparedArenaQuestion = {
  id: string
  fingerprint: string
  text: string

  options: {
    a: string
    b: string
    c: string
    d: string
  }

  correctAnswer:
    | 'a'
    | 'b'
    | 'c'
    | 'd'

  topic: string
  subtopic: string

  difficulty:
    | 'easy'
    | 'medium'
    | 'hard'

  standard: string

  source:
    | 'ai'
    | 'aloc'
    | 'competition'

  explanation: string
}

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

function hasValidOptions(
  options: any
) {
  return Boolean(
    normalizeText(
      options?.a
    ) &&
    normalizeText(
      options?.b
    ) &&
    normalizeText(
      options?.c
    ) &&
    normalizeText(
      options?.d
    )
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
  let room:
    any = null

  let subjectIndex:
    number | null =
    null

  try {
    // ========================================================
    // 1. ROUTE PARAM
    // ========================================================

    const {
      roomCode,
    } =
      await params

    const cleanRoomCode =
      normalizeText(
        roomCode
      )
        .toUpperCase()

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
    // 2. BODY
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

    const parsedIndex =
      Number(
        body?.subjectIndex
      )

    if (
      !Number.isInteger(
        parsedIndex
      ) ||
      parsedIndex < 0
    ) {
      return NextResponse.json(
        {
          error:
            'A valid subject index is required.',
        },
        {
          status:
            400,
        }
      )
    }

    subjectIndex =
      parsedIndex

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB()

    room =
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
    // 4. ROOM STATE
    // ========================================================

    if (
      room.startedAt
    ) {
      return NextResponse.json(
        {
          error:
            'Room already started.',
        },
        {
          status:
            409,
        }
      )
    }

    if (
      room.status ===
      'completed'
    ) {
      return NextResponse.json(
        {
          error:
            'This competition has already ended.',
        },
        {
          status:
            409,
        }
      )
    }

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

    // ========================================================
    // 5. AUTHORIZATION
    // ========================================================

    let authorized =
      false

    // --------------------------------------------------------
    // ADMIN CREATOR
    // --------------------------------------------------------

    if (
      room.creatorType ===
      'admin'
    ) {
      const token =
        await getToken({
          req,
          secret:
            process.env
              .NEXTAUTH_SECRET,
        })

      authorized =
        Boolean(
          token &&
          String(
            token.role ||
            ''
          )
            .toLowerCase() ===
            'admin'
        )

      /*
       * Optional tighter ownership enforcement:
       *
       * If creatorAdminUserId exists, only the same admin
       * who created the room may prepare it.
       */
      if (
        authorized &&
        room
          .creatorAdminUserId
      ) {
        const currentAdminId =
          normalizeText(
            token?.sub ||
            token?.email
          )

        authorized =
          currentAdminId ===
          normalizeText(
            room
              .creatorAdminUserId
          )
      }
    }

    // --------------------------------------------------------
    // STUDENT CREATOR
    // --------------------------------------------------------

    if (
      !authorized &&
      room.creatorType ===
        'student'
    ) {
      const access =
        await requireExamPrepAccess(
          req
        )

      if (
        access.ok
      ) {
        authorized =
          String(
            room
              .creatorStudentId ||
            ''
          ) ===
          String(
            access
              .student
              ._id
          )
      }
    }

    if (
      !authorized
    ) {
      return NextResponse.json(
        {
          error:
            'Only the room creator can prepare this competition.',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // 6. SUBJECT
    // ========================================================

    const subject =
      room.subjects[
        subjectIndex
      ]

    if (
      !subject
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid subject index.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // 7. ALREADY READY
    // ========================================================

    /*
     * Make the endpoint idempotent.
     *
     * Clicking "Prepare" twice must not regenerate another
     * 50-question pack unnecessarily.
     */

    if (
      subject
        .generationStatus ===
        'ready' &&
      Array.isArray(
        subject.questions
      ) &&
      subject
        .questions
        .length >=
        subject
          .questionCount
    ) {
      const allReady =
        room.subjects.every(
          (
            item:
              any
          ) =>
            item
              .generationStatus ===
              'ready' &&
            Array.isArray(
              item.questions
            ) &&
            item
              .questions
              .length >=
              item
                .questionCount
        )

      if (
        allReady &&
        room.status !==
          'lobby'
      ) {
        room.status =
          'lobby'

        await room.save()
      }

      return NextResponse.json({
        success:
          true,

        alreadyPrepared:
          true,

        subjectIndex,

        subject:
          subject.subject,

        questionCount:
          subject
            .questions
            .length,

        allReady,

        roomStatus:
          room.status,
      })
    }

    // ========================================================
    // 8. PREVENT DUPLICATE GENERATION REQUESTS
    // ========================================================

    if (
      subject
        .generationStatus ===
      'generating'
    ) {
      return NextResponse.json(
        {
          error:
            'This subject is already being prepared.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 9. MARK GENERATING
    // ========================================================

    subject.generationStatus =
      'generating'

    room.status =
      'preparing'

    await room.save()

    // ========================================================
    // 10. EXISTING ROOM FINGERPRINTS
    // ========================================================

    /*
     * Prevent different subject packs in the same competition
     * from accidentally reusing the same question fingerprint.
     */

    const roomFingerprints =
      Array.from(
        new Set<string>(
          room.subjects.flatMap(
            (
              roomSubject:
                any,
              index:
                number
            ) => {
              /*
               * Do not include the current subject because we are
               * replacing/rebuilding it.
               */
              if (
                index ===
                subjectIndex
              ) {
                return []
              }

              if (
                !Array.isArray(
                  roomSubject
                    ?.questions
                )
              ) {
                return []
              }

              return roomSubject
                .questions
                .map(
                  (
                    question:
                      any
                  ) =>
                    normalizeText(
                      question
                        ?.fingerprint
                    )
                )
                .filter(
                  Boolean
                )
            }
          )
        )
      )

    // ========================================================
    // 11. GET SHARED-BANK / AI QUESTIONS
    // ========================================================

    /*
     * getAIQuestions() now handles:
     *
     * SHARED QUESTION BANK
     *        ↓
     * Groq only for any shortage
     *
     * For Arena we use standard "mixed".
     *
     * We intentionally do NOT pass source: "competition"
     * because getAIQuestions() does not accept that property,
     * and because source should describe the ORIGINAL question
     * provider.
     */

    const requestedCount =
      Number(
        subject
          .questionCount
      )

    const questions =
      await getAIQuestions({
        subject:
          subject.subject,

        standard:
          'mixed',

        /*
         * Arena has no SS1/SS2/SS3 selector.
         *
         * Your current getAIQuestions() requires studentClass,
         * so use SS3 for the intended senior-secondary/
         * external-exam competition level.
         */
        studentClass:
          'ss3',

        count:
          requestedCount,

        excludeFingerprints:
          roomFingerprints,
      })

    // ========================================================
    // 12. VALIDATE + NORMALIZE QUESTIONS
    // ========================================================

    const prepared:
      PreparedArenaQuestion[] =
      []

    const seen =
      new Set<string>(
        roomFingerprints
      )

    for (
      const q of
        Array.isArray(
          questions
        )
          ? questions
          : []
    ) {
      if (
        prepared.length >=
        requestedCount
      ) {
        break
      }

      const text =
        normalizeText(
          q?.text
        )

      if (
        !text
      ) {
        continue
      }

      const options =
        q?.options

      if (
        !hasValidOptions(
          options
        )
      ) {
        continue
      }

      const correctAnswer =
        normalizeAnswer(
          q?.correctAnswer
        )

      if (
        !correctAnswer
      ) {
        continue
      }

      const fingerprint =
        normalizeText(
          q?.fingerprint
        ) ||
        questionFingerprint(
          subject.subject,
          text
        )

      if (
        seen.has(
          fingerprint
        )
      ) {
        continue
      }

      seen.add(
        fingerprint
      )

      prepared.push({
        id:
          normalizeText(
            q?.id
          ) ||
          `ARENA-${fingerprint.slice(
            0,
            16
          )}`,

        fingerprint,

        text,

        options: {
          a:
            normalizeText(
              options.a
            ),

          b:
            normalizeText(
              options.b
            ),

          c:
            normalizeText(
              options.c
            ),

          d:
            normalizeText(
              options.d
            ),
        },

        correctAnswer,

        topic:
          normalizeText(
            q?.topic
          ) ||
          'General',

        subtopic:
          normalizeText(
            q?.subtopic
          ),

        difficulty:
          normalizeDifficulty(
            q?.difficulty
          ),

        standard:
          normalizeText(
            q?.standard
          ) ||
          'mixed',

        /*
         * Preserve actual provenance.
         *
         * Cached ALOC stays ALOC.
         * AI-generated stays AI.
         */
        source:
          normalizeSource(
            q?.source
          ),

        explanation:
          normalizeText(
            q?.explanation
          ),
      })
    }

    // ========================================================
    // 13. REQUIRE COMPLETE QUESTION PACK
    // ========================================================

    /*
     * This is more important in Arena than ordinary practice.
     *
     * Every participant must receive exactly the same configured
     * number of questions. We therefore should not mark a subject
     * ready if only 32/50 questions were produced.
     */

    if (
      prepared.length <
      requestedCount
    ) {
      subject.questions =
        prepared

      subject.generationStatus =
        'failed'

      await room.save()

      return NextResponse.json(
        {
          error:
            `Could only prepare ${prepared.length} of ${requestedCount} questions for ${subject.subject}. Please retry preparation.`,

          subject:
            subject.subject,

          prepared:
            prepared.length,

          required:
            requestedCount,
        },
        {
          status:
            503,
        }
      )
    }

    // ========================================================
    // 14. STORE EXACT PACK IN ROOM
    // ========================================================

    /*
     * These questions—including correct answers—remain only on
     * the server-side room document.
     *
     * Arena state/taker endpoints must strip correctAnswer before
     * sending questions to participants.
     */

    subject.questions =
      prepared

    subject.generationStatus =
      'ready'

    // ========================================================
    // 15. CHECK ALL SUBJECTS
    // ========================================================

    const allReady =
      room.subjects.every(
        (
          roomSubject:
            any
        ) =>
          roomSubject
            .generationStatus ===
            'ready' &&
          Array.isArray(
            roomSubject
              .questions
          ) &&
          roomSubject
            .questions
            .length >=
            roomSubject
              .questionCount
      )

    if (
      allReady
    ) {
      room.status =
        'lobby'
    } else {
      room.status =
        'preparing'
    }

    await room.save()

    // ========================================================
    // 16. SAFE RESPONSE
    // ========================================================

    /*
     * Do not return questions here because they include
     * correctAnswer.
     */

    return NextResponse.json({
      success:
        true,

      subjectIndex,

      subject:
        subject.subject,

      prepared:
        prepared.length,

      required:
        requestedCount,

      generationStatus:
        subject
          .generationStatus,

      allReady,

      roomStatus:
        room.status,
    })
  } catch (
    error
  ) {
    console.error(
      'Arena prepare:',
      error
    )

    // ========================================================
    // 17. MARK SUBJECT FAILED
    // ========================================================

    /*
     * We already have the room document in memory if the error
     * occurred during question generation.
     */

    if (
      room &&
      subjectIndex !==
        null &&
      room.subjects?.[
        subjectIndex
      ]
    ) {
      try {
        room.subjects[
          subjectIndex
        ].generationStatus =
          'failed'

        room.status =
          'preparing'

        await room.save()
      } catch (
        saveError
      ) {
        console.error(
          'Arena prepare failure-state save:',
          saveError
        )
      }
    }

    return NextResponse.json(
      {
        error:
          'Could not generate room questions.',
      },
      {
        status:
          500,
      }
    )
  }
}
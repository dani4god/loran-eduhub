// app/api/exam-prep/arena/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import crypto from 'crypto'

import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'

import {
  requireExamPrepAccess,
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  SS_SUBJECTS_BY_CATEGORY,
} from '@/lib/lessonNoteSubjects'

// ============================================================
// CONFIG
// ============================================================

const MIN_SUBJECTS = 1
const MAX_SUBJECTS = 6

const MIN_DURATION_MINUTES = 5
const MAX_DURATION_MINUTES = 120

const MIN_QUESTION_COUNT = 5
const MAX_QUESTION_COUNT = 50

const DEFAULT_QUESTION_COUNT = 50

const MIN_PARTICIPANTS = 1
const MAX_PARTICIPANTS = 500

const DEFAULT_MAX_PARTICIPANTS = 50

const MIN_INTERMISSION_SECONDS = 5
const MAX_INTERMISSION_SECONDS = 120

const DEFAULT_INTERMISSION_SECONDS = 15

const ROOM_CODE_LENGTH = 7

// ============================================================
// TYPES
// ============================================================

type ScreenShareMode =
  | 'off'
  | 'optional'
  | 'required'

type Visibility =
  | 'public'
  | 'private'

type ArenaSubjectInput = {
  subject?: unknown
  durationMinutes?: unknown
  questionCount?: unknown
}

// ============================================================
// SUBJECT CATALOG
// ============================================================

/*
 * Arena subjects come from the same senior-secondary subject
 * catalog used by Exam Prep.
 *
 * The Arena does not require a class because competition
 * questions are intended to use mixed external-exam standards.
 */

const ALL_SS_SUBJECTS =
  Array.from(
    new Set(
      Object.values(
        SS_SUBJECTS_BY_CATEGORY
      ).flat()
    )
  )

const SUBJECT_LOOKUP =
  new Map(
    ALL_SS_SUBJECTS.map(
      subject => [
        normalizeSubjectKey(
          subject
        ),
        subject,
      ]
    )
  )

// ============================================================
// BASIC HELPERS
// ============================================================

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function normalizeSubjectKey(
  value: unknown
) {
  return normalizeText(
    value
  )
    .toLowerCase()
}

function normalizeInteger(
  value: unknown,
  fallback?: number
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback
  }

  const parsed =
    Number(
      value
    )

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    return fallback
  }

  return parsed
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  )
}

// ============================================================
// SUBJECT NORMALIZATION
// ============================================================

function canonicalArenaSubject(
  value: unknown
) {
  const key =
    normalizeSubjectKey(
      value
    )

  if (
    !key
  ) {
    return ''
  }

  return (
    SUBJECT_LOOKUP.get(
      key
    ) ||
    ''
  )
}

// ============================================================
// ROOM CODE
// ============================================================

function createRandomRoomCode() {
  /*
   * Avoid visually confusing characters:
   *
   * 0 / O
   * 1 / I
   */

  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  let code =
    ''

  const bytes =
    crypto.randomBytes(
      ROOM_CODE_LENGTH
    )

  for (
    let index = 0;
    index <
    ROOM_CODE_LENGTH;
    index += 1
  ) {
    code +=
      alphabet[
        bytes[index] %
        alphabet.length
      ]
  }

  return code
}

async function createUniqueRoomCode() {
  /*
   * Collisions are extremely unlikely, but roomCode has a
   * unique MongoDB index, so explicitly check before creation.
   */

  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const code =
      createRandomRoomCode()

    const exists =
      await ExamCompetitionRoom.exists({
        roomCode:
          code,
      })

    if (
      !exists
    ) {
      return code
    }
  }

  throw new Error(
    'Could not generate a unique Arena room code.'
  )
}

// ============================================================
// CREATOR AUTH
// ============================================================

async function resolveCreator(
  req: NextRequest
) {
  /*
   * First attempt Exam Prep student authentication.
   *
   * Student room creators must also have Exam Prep access,
   * which respects:
   *
   * - global Exam Prep lock
   * - subscription requirements
   */

  const studentAccess =
    await requireExamPrepAccess(
      req
    )

  if (
    studentAccess.ok
  ) {
    return {
      ok:
        true as const,

      creatorType:
        'student' as const,

      student:
        studentAccess.student,

      adminToken:
        null,
    }
  }

  /*
   * If this is not an Exam Prep student request, check whether
   * the request belongs to a main-site administrator.
   */

  const token =
    await getToken({
      req,
      secret:
        process.env
          .NEXTAUTH_SECRET,
    })

  if (
    token &&
    String(
      token.role || ''
    )
      .toLowerCase() ===
      'admin'
  ) {
    return {
      ok:
        true as const,

      creatorType:
        'admin' as const,

      student:
        null,

      adminToken:
        token,
    }
  }

  /*
   * Preserve the Exam Prep auth/access response when neither
   * authentication method succeeds.
   */

  return {
    ok:
      false as const,

    response:
      studentAccess.response,
  }
}

// ============================================================
// SUBJECT CONFIG VALIDATION
// ============================================================

function normalizeSubjects(
  rawSubjects: unknown
) {
  if (
    !Array.isArray(
      rawSubjects
    )
  ) {
    return {
      ok:
        false as const,

      error:
        'Subjects must be an array.',
    }
  }

  if (
    rawSubjects.length <
      MIN_SUBJECTS ||
    rawSubjects.length >
      MAX_SUBJECTS
  ) {
    return {
      ok:
        false as const,

      error:
        `Select between ${MIN_SUBJECTS} and ${MAX_SUBJECTS} subjects.`,
    }
  }

  const result:
    {
      subject: string
      durationMinutes: number
      questionCount: number
      generationStatus: 'pending'
      questions: any[]
    }[] =
    []

  const seen =
    new Set<string>()

  for (
    const rawItem of
      rawSubjects as
        ArenaSubjectInput[]
  ) {
    const canonical =
      canonicalArenaSubject(
        rawItem?.subject
      )

    if (
      !canonical
    ) {
      return {
        ok:
          false as const,

        error:
          `Invalid senior-secondary subject: ${normalizeText(
            rawItem?.subject
          ) || 'Unknown subject'}.`,
      }
    }

    const subjectKey =
      normalizeSubjectKey(
        canonical
      )

    if (
      seen.has(
        subjectKey
      )
    ) {
      return {
        ok:
          false as const,

        error:
          `${canonical} was selected more than once.`,
      }
    }

    seen.add(
      subjectKey
    )

    const duration =
      normalizeInteger(
        rawItem
          ?.durationMinutes
      )

    if (
      duration ===
        undefined ||
      duration <
        MIN_DURATION_MINUTES ||
      duration >
        MAX_DURATION_MINUTES
    ) {
      return {
        ok:
          false as const,

        error:
          `${canonical} must have an exam duration between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
      }
    }

    const questionCount =
      normalizeInteger(
        rawItem
          ?.questionCount,
        DEFAULT_QUESTION_COUNT
      )!

    if (
      questionCount <
        MIN_QUESTION_COUNT ||
      questionCount >
        MAX_QUESTION_COUNT
    ) {
      return {
        ok:
          false as const,

        error:
          `${canonical} must contain between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT} questions.`,
      }
    }

    result.push({
      subject:
        canonical,

      durationMinutes:
        duration,

      questionCount,

      generationStatus:
        'pending',

      questions:
        [],
    })
  }

  return {
    ok:
      true as const,

    subjects:
      result,
  }
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
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

    await connectDB()

    // ========================================================
    // 2. QUERY PARAMETERS
    // ========================================================

    const url =
      new URL(
        req.url
      )

    const rawStatus =
      normalizeText(
        url.searchParams.get(
          'status'
        )
      )
        .toLowerCase()

    const query:
      Record<
        string,
        any
      > = {
      visibility:
        'public',

      status: {
        $in: [
          'preparing',
          'lobby',
        ],
      },
    }

    if (
      rawStatus ===
        'preparing' ||
      rawStatus ===
        'lobby' ||
      rawStatus ===
        'completed' ||
      rawStatus ===
        'cancelled'
    ) {
      query.status =
        rawStatus
    }

    // ========================================================
    // 3. PUBLIC ROOMS
    // ========================================================

    const rooms =
      await ExamCompetitionRoom
        .find(
          query
        )
        .sort({
          createdAt:
            -1,
        })
        .limit(
          100
        )
        .lean()

    // ========================================================
    // 4. PARTICIPANT COUNTS
    // ========================================================

    const roomIds =
      rooms.map(
        (
          room:
            any
        ) =>
          room._id
      )

    const participantCounts =
      roomIds.length >
      0
        ? await ExamCompetitionParticipant
            .aggregate([
              {
                $match: {
                  roomId: {
                    $in:
                      roomIds,
                  },
                },
              },

              {
                $group: {
                  _id:
                    '$roomId',

                  count: {
                    $sum:
                      1,
                  },
                },
              },
            ])
        : []

    const countMap =
      new Map(
        participantCounts.map(
          (
            row:
              any
          ) => [
            String(
              row._id
            ),
            Number(
              row.count ||
              0
            ),
          ]
        )
      )

    // ========================================================
    // 5. STUDENT'S EXISTING PARTICIPATION
    // ========================================================

    const participating =
      roomIds.length >
      0
        ? await ExamCompetitionParticipant
            .find({
              examPrepStudentId:
                auth.student._id,

              roomId: {
                $in:
                  roomIds,
              },
            })
            .select(
              'roomId'
            )
            .lean()
        : []

    const joinedRoomIds =
      new Set(
        participating.map(
          (
            participant:
              any
          ) =>
            String(
              participant.roomId
            )
        )
      )

    // ========================================================
    // 6. SAFE RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      rooms:
        rooms.map(
          (
            room:
              any
          ) => ({
            id:
              String(
                room._id
              ),

            roomCode:
              room.roomCode,

            name:
              room.name,

            instructions:
              room.instructions ||
              '',

            creatorType:
              room.creatorType,

            official:
              room.creatorType ===
              'admin',

            visibility:
              room.visibility,

            status:
              room.status,

            screenShareMode:
              room.screenShareMode,

            maxParticipants:
              room.maxParticipants,

            participantCount:
              countMap.get(
                String(
                  room._id
                )
              ) ||
              0,

            joined:
              joinedRoomIds.has(
                String(
                  room._id
                )
              ),

            isCreator:
              room.creatorType ===
                'student' &&
              String(
                room.creatorStudentId ||
                ''
              ) ===
                String(
                  auth.student._id
                ),

            intermissionSeconds:
              room.intermissionSeconds,

            subjects:
              Array.isArray(
                room.subjects
              )
                ? room.subjects.map(
                    (
                      subject:
                        any
                    ) => ({
                      subject:
                        subject.subject,

                      durationMinutes:
                        subject.durationMinutes,

                      questionCount:
                        subject.questionCount,

                      generationStatus:
                        subject.generationStatus,

                      /*
                       * Do not send stored Arena questions from this
                       * listing route because they contain answers.
                       */
                      questionsReady:
                        Array.isArray(
                          subject.questions
                        )
                          ? subject
                              .questions
                              .length
                          : 0,
                    })
                  )
                : [],

            startedAt:
              room.startedAt ||
              null,

            createdAt:
              room.createdAt,
          })
        ),
    })
  } catch (
    error
  ) {
    console.error(
      'Arena list error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load Exam Arena rooms.',
      },
      {
        status:
          500,
      }
    )
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // 1. CREATOR AUTHENTICATION
    // ========================================================

    const creator =
      await resolveCreator(
        req
      )

    if (
      !creator.ok
    ) {
      return creator.response
    }

    // ========================================================
    // 2. REQUEST BODY
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

    const name =
      normalizeText(
        body?.name ||
        body?.roomName
      )

    const instructions =
      normalizeText(
        body?.instructions
      )

    const visibilityRaw =
      normalizeText(
        body?.visibility
      )
        .toLowerCase()

    const visibility:
      Visibility =
      visibilityRaw ===
        'private'
        ? 'private'
        : 'public'

    const screenShareRaw =
      normalizeText(
        body?.screenShareMode
      )
        .toLowerCase()

    let screenShareMode:
      ScreenShareMode =
      'off'

    if (
      screenShareRaw ===
      'optional'
    ) {
      screenShareMode =
        'optional'
    }

    if (
      screenShareRaw ===
      'required'
    ) {
      screenShareMode =
        'required'
    }

    // ========================================================
    // 3. ROOM NAME
    // ========================================================

    if (
      name.length <
      3
    ) {
      return NextResponse.json(
        {
          error:
            'Room name must contain at least 3 characters.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      name.length >
      100
    ) {
      return NextResponse.json(
        {
          error:
            'Room name cannot exceed 100 characters.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      instructions.length >
      2000
    ) {
      return NextResponse.json(
        {
          error:
            'Room instructions cannot exceed 2,000 characters.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // 4. SUBJECTS
    // ========================================================

    const subjectResult =
      normalizeSubjects(
        body?.subjects
      )

    if (
      !subjectResult.ok
    ) {
      return NextResponse.json(
        {
          error:
            subjectResult.error,
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // 5. MAX PARTICIPANTS
    // ========================================================

    const maxParticipantsRaw =
      normalizeInteger(
        body?.maxParticipants,
        DEFAULT_MAX_PARTICIPANTS
      )!

    if (
      maxParticipantsRaw <
        MIN_PARTICIPANTS ||
      maxParticipantsRaw >
        MAX_PARTICIPANTS
    ) {
      return NextResponse.json(
        {
          error:
            `Maximum participants must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}.`,
        },
        {
          status:
            400,
        }
      )
    }

    const maxParticipants =
      clamp(
        maxParticipantsRaw,
        MIN_PARTICIPANTS,
        MAX_PARTICIPANTS
      )

    // ========================================================
    // 6. INTERMISSION
    // ========================================================

    const intermissionRaw =
      normalizeInteger(
        body?.intermissionSeconds,
        DEFAULT_INTERMISSION_SECONDS
      )!

    const intermissionSeconds =
      clamp(
        intermissionRaw,
        MIN_INTERMISSION_SECONDS,
        MAX_INTERMISSION_SECONDS
      )

    // ========================================================
    // 7. DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // 8. ROOM CODE
    // ========================================================

    const roomCode =
      await createUniqueRoomCode()

    // ========================================================
    // 9. CREATOR INFORMATION
    // ========================================================

    const creatorStudentId =
      creator.creatorType ===
        'student'
        ? creator.student._id
        : undefined

    const creatorAdminUserId =
      creator.creatorType ===
        'admin'
        ? normalizeText(
            creator.adminToken
              ?.sub ||
            creator.adminToken
              ?.email
          )
        : undefined

    // ========================================================
    // 10. CREATE ROOM
    // ========================================================

    const room =
      await ExamCompetitionRoom.create({
        roomCode,

        name,

        instructions,

        creatorType:
          creator.creatorType,

        creatorStudentId,

        creatorAdminUserId,

        visibility,

        /*
         * Questions still need to be generated/prepared by the
         * Arena prepare endpoint.
         */
        status:
          'preparing',

        screenShareMode,

        subjects:
          subjectResult.subjects,

        maxParticipants,

        intermissionSeconds,
      })

    // ========================================================
    // 11. AUTO-JOIN STUDENT CREATOR
    // ========================================================

    /*
     * A student who creates a room is automatically its first
     * participant.
     *
     * Admins create official rooms but do not become exam
     * participants.
     */

    if (
      creator.creatorType ===
        'student' &&
      creator.student
    ) {
      try {
        await ExamCompetitionParticipant.updateOne(
          {
            roomId:
              room._id,

            examPrepStudentId:
              creator.student._id,
          },

          {
            $setOnInsert: {
              roomId:
                room._id,

              examPrepStudentId:
                creator.student._id,

              joinedAt:
                new Date(),

              screenShareActive:
                false,

              subjectResults:
                [],

              totalScore:
                0,

              totalPossible:
                0,

              overallPercentage:
                0,

              totalDurationSeconds:
                0,
            },
          },

          {
            upsert:
              true,
          }
        )
      } catch (
        participantError
      ) {
        /*
         * Do not leave an unusable room if the creator could not
         * be registered as a participant.
         */

        await ExamCompetitionRoom.deleteOne({
          _id:
            room._id,
        })

        console.error(
          'Arena creator participant creation failed:',
          participantError
        )

        return NextResponse.json(
          {
            error:
              'Could not create the Arena room.',
          },
          {
            status:
              500,
          }
        )
      }
    }

    // ========================================================
    // 12. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Exam Arena room created successfully.',

        room: {
          id:
            String(
              room._id
            ),

          roomCode:
            room.roomCode,

          name:
            room.name,

          instructions:
            room.instructions,

          creatorType:
            room.creatorType,

          official:
            room.creatorType ===
            'admin',

          visibility:
            room.visibility,

          status:
            room.status,

          screenShareMode:
            room.screenShareMode,

          maxParticipants:
            room.maxParticipants,

          participantCount:
            creator.creatorType ===
              'student'
              ? 1
              : 0,

          intermissionSeconds:
            room.intermissionSeconds,

          subjects:
            room.subjects.map(
              (
                item:
                  any
              ) => ({
                subject:
                  item.subject,

                durationMinutes:
                  item.durationMinutes,

                questionCount:
                  item.questionCount,

                generationStatus:
                  item.generationStatus,
              })
            ),

          createdAt:
            room.createdAt,
        },
      },
      {
        status:
          201,
      }
    )
  } catch (
    error:
      any
  ) {
    console.error(
      'Arena room creation error:',
      error
    )

    /*
     * Very unlikely room-code race.
     */
    if (
      error?.code ===
      11000 &&
      (
        error?.keyPattern
          ?.roomCode ||
        error?.keyValue
          ?.roomCode
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Room code collision. Please create the room again.',
        },
        {
          status:
            409,
        }
      )
    }

    return NextResponse.json(
      {
        error:
          'Could not create Exam Arena room.',
      },
      {
        status:
          500,
      }
    )
  }
}
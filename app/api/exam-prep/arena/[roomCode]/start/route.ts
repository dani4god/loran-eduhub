// app/api/exam-prep/arena/[roomCode]/start/route.ts

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

// ============================================================
// TYPES
// ============================================================

type RouteContext = {
  params: Promise<{
    roomCode: string
  }>
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

function normalizeRoomCode(
  value: unknown
) {
  return normalizeText(
    value
  ).toUpperCase()
}

function allSubjectsReady(
  room: any
) {
  if (
    !Array.isArray(
      room?.subjects
    ) ||
    room.subjects.length ===
      0
  ) {
    return false
  }

  return room.subjects.every(
    (
      subject:
        any
    ) =>
      subject
        ?.generationStatus ===
        'ready' &&
      Array.isArray(
        subject?.questions
      ) &&
      subject.questions.length >=
        Number(
          subject
            ?.questionCount ||
          0
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
  try {
    // ========================================================
    // 1. ROOM CODE
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
    // 2. DATABASE
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
    // 3. ROOM STATE GUARDS
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

    // ========================================================
    // 4. AUTHORIZATION
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
       * If the room records the creating admin, ensure the same
       * admin starts it.
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
            access.student._id
          )
      }
    }

    if (
      !authorized
    ) {
      return NextResponse.json(
        {
          error:
            'Only the room creator can start this competition.',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // 5. ALREADY STARTED
    // ========================================================

    /*
     * Make the endpoint idempotent.
     *
     * If the creator double-clicks Start or the browser retries,
     * never reset the Arena clock.
     */

    if (
      room.startedAt
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyStarted:
          true,

        startedAt:
          room.startedAt,

        roomCode:
          room.roomCode,
      })
    }

    // ========================================================
    // 6. ROOM MUST BE IN LOBBY
    // ========================================================

    if (
      room.status !==
      'lobby'
    ) {
      return NextResponse.json(
        {
          error:
            'Room is not ready to start.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 7. VERIFY ALL QUESTION PACKS
    // ========================================================

    /*
     * Do not trust status='lobby' alone.
     *
     * Verify every subject actually contains its complete
     * question pack before creating the competition clock.
     */

    if (
      !allSubjectsReady(
        room
      )
    ) {
      room.status =
        'preparing'

      await room.save()

      return NextResponse.json(
        {
          error:
            'One or more subjects are not fully prepared yet.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 8. START COUNTDOWN
    // ========================================================

    /*
     * All clients derive their competition clock from this
     * single server timestamp.
     *
     * 10-second countdown:
     *
     * now -------- 10 sec -------- first subject begins
     */

    const proposedStartedAt =
      new Date(
        Date.now() +
        10_000
      )

    // ========================================================
    // 9. ATOMIC START
    // ========================================================

    /*
     * Only update if startedAt still does not exist.
     *
     * Two simultaneous requests cannot create two different
     * competition start times.
     */

    const startedRoom =
      await ExamCompetitionRoom
        .findOneAndUpdate(
          {
            _id:
              room._id,

            startedAt: {
              $exists:
                false,
            },

            status:
              'lobby',
          },

          {
            $set: {
              startedAt:
                proposedStartedAt,
            },
          },

          {
            new:
              true,
          }
        )

    // ========================================================
    // 10. HANDLE RACE
    // ========================================================

    if (
      !startedRoom
    ) {
      const latestRoom =
        await ExamCompetitionRoom
          .findById(
            room._id
          )
          .lean()

      if (
        latestRoom
          ?.startedAt
      ) {
        return NextResponse.json({
          success:
            true,

          alreadyStarted:
            true,

          startedAt:
            latestRoom
              .startedAt,

          roomCode:
            latestRoom
              .roomCode,
        })
      }

      return NextResponse.json(
        {
          error:
            'Could not start this Arena room. Please try again.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // 11. RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      alreadyStarted:
        false,

      roomCode:
        startedRoom
          .roomCode,

      startedAt:
        startedRoom
          .startedAt,

      countdownSeconds:
        10,
    })
  } catch (
    error
  ) {
    console.error(
      'Arena start:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not start Arena competition.',
      },
      {
        status:
          500,
      }
    )
  }
}
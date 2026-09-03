// app/api/admin/exam-arena/[roomCode]/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getToken,
} from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'

/*
 * Required so Mongoose can populate:
 * examPrepStudentId -> ExamPrepStudent
 */
import '@/models/ExamPrepStudent'

import {
  getArenaState,
  rankParticipants,
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

// ============================================================
// HELPERS
// ============================================================

async function requireAdmin(
  req: NextRequest
) {
  const token =
    await getToken({
      req,
      secret:
        process.env
          .NEXTAUTH_SECRET,
    })

  if (
    !token ||
    String(
      token.role || ''
    )
      .trim()
      .toLowerCase() !==
      'admin'
  ) {
    return {
      ok:
        false as const,

      response:
        NextResponse.json(
          {
            error:
              'Admin access required.',
          },
          {
            status:
              401,
          }
        ),
    }
  }

  return {
    ok:
      true as const,

    token,
  }
}

function normalizeRoomCode(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .replace(
      /\s+/g,
      ''
    )
    .trim()
    .toUpperCase()
}

function safeNumber(
  value: unknown,
  fallback =
    0
) {
  const number =
    Number(
      value
    )

  return Number.isFinite(
    number
  )
    ? number
    : fallback
}

function percentage(
  score: number,
  total: number
) {
  if (
    total <=
    0
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
// GET
// ============================================================

export async function GET(
  req: NextRequest,
  {
    params,
  }: RouteContext
) {
  try {
    const auth =
      await requireAdmin(
        req
      )

    if (
      !auth.ok
    ) {
      return auth.response
    }

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

    await connectDB()

    // ========================================================
    // OFFICIAL ROOM
    // ========================================================

    const room =
      await ExamCompetitionRoom.findOne({
        roomCode:
          cleanRoomCode,

        creatorType:
          'admin',
      })

    if (
      !room
    ) {
      return NextResponse.json(
        {
          error:
            'Official Arena not found.',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // STATE
    // ========================================================

    const state =
      getArenaState(
        room
      )

    /*
     * Persist completion when time has naturally passed
     * beyond the final Arena round.
     */
    if (
      state.phase ===
        'completed' &&
      room.status !==
        'completed' &&
      room.status !==
        'cancelled'
    ) {
      room.status =
        'completed'

      await room.save()
    }

    // ========================================================
    // PARTICIPANTS
    // ========================================================

    const participants =
      await ExamCompetitionParticipant
        .find({
          roomId:
            room._id,
        })
        .populate(
          'examPrepStudentId',
          'fullName school regNumber email'
        )
        .lean()

    const possible =
      totalPossible(
        room
      )

    const ranked =
      rankParticipants(
        participants,
        possible
      )

    const roomSubjects =
      Array.isArray(
        room.subjects
      )
        ? room.subjects
        : []

    // ========================================================
    // LEADERBOARD
    // ========================================================

    const leaderboard =
      ranked.map(
        (
          participant:
            any,
          index:
            number
        ) => {
          const student =
            participant
              ?.examPrepStudentId

          const results =
            Array.isArray(
              participant
                ?.subjectResults
            )
              ? participant
                  .subjectResults
              : []

          const rounds =
            roomSubjects.map(
              (
                roomSubject:
                  any,
                subjectIndex:
                  number
              ) => {
                const result =
                  results.find(
                    (
                      item:
                        any
                    ) =>
                      item
                        ?.subject ===
                      roomSubject
                        ?.subject
                  )

                const score =
                  safeNumber(
                    result?.score
                  )

                const total =
                  result
                    ? safeNumber(
                        result.total,
                        roomSubject
                          ?.questionCount ||
                          0
                      )
                    : safeNumber(
                        roomSubject
                          ?.questionCount
                      )

                return {
                  index:
                    subjectIndex,

                  subject:
                    roomSubject
                      ?.subject ||
                    `Round ${
                      subjectIndex +
                      1
                    }`,

                  submitted:
                    Boolean(
                      result
                    ),

                  score:
                    result
                      ? score
                      : null,

                  total,

                  percentage:
                    result
                      ? safeNumber(
                          result
                            ?.percentage,
                          percentage(
                            score,
                            total
                          )
                        )
                      : null,

                  durationSeconds:
                    result
                      ? safeNumber(
                          result
                            ?.durationSeconds
                        )
                      : null,

                  submittedAt:
                    result
                      ?.submittedAt ||
                    null,
                }
              }
            )

          const totalScore =
            safeNumber(
              participant
                ?.totalScore
            )

          const totalPossibleScore =
            safeNumber(
              participant
                ?.totalPossible,
              possible
            ) ||
            possible

          const overallPercentage =
            safeNumber(
              participant
                ?.calculatedPercentage ??
                participant
                  ?.overallPercentage,
              percentage(
                totalScore,
                totalPossibleScore
              )
            )

          return {
            rank:
              index +
              1,

            participantId:
              String(
                participant
                  ?._id ||
                  ''
              ),

            studentId:
              student
                ?._id
                ? String(
                    student._id
                  )
                : '',

            name:
              student
                ?.fullName ||
              'Student',

            school:
              student
                ?.school ||
              'School not provided',

            regNumber:
              student
                ?.regNumber ||
              '',

            email:
              student
                ?.email ||
              '',

            joinedAt:
              participant
                ?.joinedAt ||
              null,

            completedRounds:
              rounds.filter(
                (
                  round:
                    any
                ) =>
                  round.submitted
              )
                .length,

            totalRounds:
              roomSubjects.length,

            rounds,

            totalScore,

            totalPossible:
              totalPossibleScore,

            overallPercentage,

            totalDurationSeconds:
              safeNumber(
                participant
                  ?.totalDurationSeconds
              ),
          }
        }
      )

    // ========================================================
    // WINNER
    // ========================================================

    const competitionCompleted =
      state.phase ===
        'completed' ||
      room.status ===
        'completed'

    const winner =
      competitionCompleted &&
      leaderboard.length >
        0
        ? {
            rank:
              1,

            name:
              leaderboard[0]
                .name,

            school:
              leaderboard[0]
                .school,

            regNumber:
              leaderboard[0]
                .regNumber,

            score:
              leaderboard[0]
                .totalScore,

            total:
              leaderboard[0]
                .totalPossible,

            percentage:
              leaderboard[0]
                .overallPercentage,
          }
        : null

    // ========================================================
    // CURRENT ROUND
    // ========================================================

    const currentSubjectIndex =
      Number(
        state
          .currentSubjectIndex
      )

    const currentRound =
      Number.isInteger(
        currentSubjectIndex
      ) &&
      currentSubjectIndex >=
        0 &&
      roomSubjects[
        currentSubjectIndex
      ]
        ? {
            index:
              currentSubjectIndex,

            subject:
              roomSubjects[
                currentSubjectIndex
              ].subject,

            durationMinutes:
              safeNumber(
                roomSubjects[
                  currentSubjectIndex
                ]
                  .durationMinutes
              ),

            questionCount:
              safeNumber(
                roomSubjects[
                  currentSubjectIndex
                ]
                  .questionCount
              ),
          }
        : null

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

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
          room.instructions ||
          '',

        visibility:
          room.visibility,

        status:
          room.status,

        phase:
          state.phase,

        maxParticipants:
          room.maxParticipants,

        participantCount:
          participants.length,

        startedAt:
          room.startedAt ||
          null,

        createdAt:
          room.createdAt,

        intermissionSeconds:
          room.intermissionSeconds,

        subjects:
          roomSubjects.map(
            (
              subject:
                any,
              index:
                number
            ) => ({
              index,

              subject:
                subject.subject,

              durationMinutes:
                safeNumber(
                  subject
                    .durationMinutes
                ),

              questionCount:
                safeNumber(
                  subject
                    .questionCount
                ),

              generationStatus:
                subject
                  .generationStatus,
            })
          ),
      },

      state,

      currentRound,

      participantCount:
        participants.length,

      leaderboard,

      winner,
    })
  } catch (
    error:
      unknown
  ) {
    console.error(
      '[ADMIN ARENA DETAIL] GET:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load Arena competition results.',
      },
      {
        status:
          500,
      }
    )
  }
}
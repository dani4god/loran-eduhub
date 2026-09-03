// app/api/admin/exam-arena/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'

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

// ============================================================
// GET ADMIN ARENAS
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    const auth =
      await requireAdmin(
        req
      )

    if (!auth.ok) {
      return auth.response
    }

    await connectDB()

    const url =
      new URL(
        req.url
      )

    const status =
      normalizeText(
        url.searchParams.get(
          'status'
        )
      )
        .toLowerCase()

    const search =
      normalizeText(
        url.searchParams.get(
          'search'
        )
      )

    const query:
      Record<
        string,
        any
      > = {
      creatorType:
        'admin',
    }

    if (
      status ===
        'preparing' ||
      status ===
        'lobby' ||
      status ===
        'completed' ||
      status ===
        'cancelled'
    ) {
      query.status =
        status
    }

    if (search) {
      const escaped =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )

      query.$or = [
        {
          name: {
            $regex:
              escaped,
            $options:
              'i',
          },
        },
        {
          roomCode: {
            $regex:
              escaped,
            $options:
              'i',
          },
        },
      ]
    }

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
          200
        )
        .lean()

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
      new Map<
        string,
        number
      >(
        participantCounts.map(
          (
            item:
              any
          ) => [
            String(
              item._id
            ),
            Number(
              item.count ||
                0
            ),
          ]
        )
      )

    const result =
      rooms.map(
        (
          room:
            any
        ) => {
          const subjects =
            Array.isArray(
              room.subjects
            )
              ? room.subjects
              : []

          const readySubjects =
            subjects.filter(
              (
                subject:
                  any
              ) =>
                subject
                  ?.generationStatus ===
                'ready'
            ).length

          const generatingSubjects =
            subjects.filter(
              (
                subject:
                  any
              ) =>
                subject
                  ?.generationStatus ===
                'generating'
            ).length

          const failedSubjects =
            subjects.filter(
              (
                subject:
                  any
              ) =>
                subject
                  ?.generationStatus ===
                'failed'
            ).length

          const totalQuestions =
            subjects.reduce(
              (
                total:
                  number,
                subject:
                  any
              ) =>
                total +
                Number(
                  subject
                    ?.questionCount ||
                    0
                ),
              0
            )

          const preparedQuestions =
            subjects.reduce(
              (
                total:
                  number,
                subject:
                  any
              ) =>
                total +
                (
                  Array.isArray(
                    subject
                      ?.questions
                  )
                    ? subject
                        .questions
                        .length
                    : 0
                ),
              0
            )

          const totalMinutes =
            subjects.reduce(
              (
                total:
                  number,
                subject:
                  any
              ) =>
                total +
                Number(
                  subject
                    ?.durationMinutes ||
                    0
                ),
              0
            )

          return {
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

            screenShareMode:
              room.screenShareMode ||
              'off',

            maxParticipants:
              Number(
                room.maxParticipants ||
                  50
              ),

            participantCount:
              countMap.get(
                String(
                  room._id
                )
              ) ||
              0,

            intermissionSeconds:
              Number(
                room.intermissionSeconds ||
                  15
              ),

            startedAt:
              room.startedAt ||
              null,

            createdAt:
              room.createdAt,

            subjects:
              subjects.map(
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
                    Number(
                      subject
                        .durationMinutes ||
                        0
                    ),

                  questionCount:
                    Number(
                      subject
                        .questionCount ||
                        0
                    ),

                  preparedQuestionCount:
                    Array.isArray(
                      subject
                        .questions
                    )
                      ? subject
                          .questions
                          .length
                      : 0,

                  generationStatus:
                    subject
                      .generationStatus ||
                    'pending',
                })
              ),

            preparation: {
              totalSubjects:
                subjects.length,

              readySubjects,

              generatingSubjects,

              failedSubjects,

              totalQuestions,

              preparedQuestions,

              percentage:
                totalQuestions >
                0
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          preparedQuestions /
                          totalQuestions
                        ) *
                          100
                      )
                    )
                  : 0,
            },

            totalMinutes,
          }
        }
      )

    return NextResponse.json({
      success:
        true,

      rooms:
        result,
    })
  } catch (
    error:
      unknown
  ) {
    console.error(
      '[ADMIN ARENA] GET error:',
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
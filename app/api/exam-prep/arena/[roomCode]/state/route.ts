// app/api/exam-prep/arena/[roomCode]/join/state/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

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

function toIdString(
  value: unknown
) {
  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  if (
    typeof value === 'object'
  ) {
    const maybeObject =
      value as any

    if (
      maybeObject?._id
    ) {
      return String(
        maybeObject._id
      )
    }
  }

  return String(
    value
  )
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
  value: unknown
) {
  const parsed =
    safeNumber(
      value,
      0
    )

  return Math.round(
    parsed * 100
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
    // ========================================================
    // 1. AUTHENTICATE STUDENT
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

    console.log(
      '[ARENA STATE] Looking for room:',
      {
        rawRoomCode:
          roomCode,

        cleanRoomCode,

        studentId:
          auth.student
            ?._id
            ?.toString?.() ||
          String(
            auth.student?._id ||
            ''
          ),
      }
    )

    if (
      !cleanRoomCode
    ) {
      console.warn(
        '[ARENA STATE] Empty room code received.'
      )

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
    // 3. DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // 4. FIND ROOM
    // ========================================================

    const room =
      await ExamCompetitionRoom
        .findOne({
          roomCode:
            cleanRoomCode,
        })

    console.log(
      '[ARENA STATE] Room lookup:',
      {
        found:
          Boolean(
            room
          ),

        requestedCode:
          cleanRoomCode,

        foundCode:
          room?.roomCode ||
          null,

        roomId:
          room?._id
            ?.toString?.() ||
          null,

        roomName:
          room?.name ||
          null,

        roomStatus:
          room?.status ||
          null,
      }
    )

    // ========================================================
    // 5. ROOM NOT FOUND DIAGNOSTICS
    // ========================================================

    if (
      !room
    ) {
      /*
       * Temporary diagnostic.
       *
       * If a room was just created but this lookup cannot find it,
       * print the most recently created Arena rooms.
       *
       * This will tell us immediately whether:
       *
       * 1. the room was not persisted;
       * 2. a different roomCode was saved;
       * 3. the POST and GET are talking to different databases;
       * 4. the page navigated using the wrong returned code.
       */

      const recentRooms =
        await ExamCompetitionRoom
          .find({})
          .select(
            '_id roomCode name status visibility creatorType createdAt updatedAt'
          )
          .sort({
            createdAt:
              -1,
          })
          .limit(
            10
          )
          .lean()

      console.error(
        '[ARENA STATE] Room not found.',
        {
          requestedCode:
            cleanRoomCode,

          recentRooms:
            recentRooms.map(
              (
                recentRoom:
                  any
              ) => ({
                id:
                  recentRoom
                    ?._id
                    ?.toString?.() ||
                  String(
                    recentRoom
                      ?._id ||
                    ''
                  ),

                roomCode:
                  recentRoom
                    ?.roomCode,

                name:
                  recentRoom
                    ?.name,

                status:
                  recentRoom
                    ?.status,

                visibility:
                  recentRoom
                    ?.visibility,

                creatorType:
                  recentRoom
                    ?.creatorType,

                createdAt:
                  recentRoom
                    ?.createdAt,

                updatedAt:
                  recentRoom
                    ?.updatedAt,
              })
            ),
        }
      )

      /*
       * Keep the browser response reasonably safe.
       *
       * We return the requested code for debugging, but do not
       * return the list of other Arena room codes to the client.
       */

      return NextResponse.json(
        {
          error:
            'Room not found.',

          roomCode:
            cleanRoomCode,
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // 6. PARTICIPANTS
    // ========================================================

    const participants =
      await ExamCompetitionParticipant
        .find({
          roomId:
            room._id,
        })
        .populate(
          'examPrepStudentId',
          'fullName'
        )
        .lean()

    const viewerStudentId =
      String(
        auth.student._id
      )

    const viewer =
      participants.find(
        (
          participant:
            any
        ) =>
          toIdString(
            participant
              ?.examPrepStudentId
          ) ===
          viewerStudentId
      ) ||
      null

    console.log(
      '[ARENA STATE] Participant state:',
      {
        roomCode:
          room.roomCode,

        participantCount:
          participants.length,

        viewerStudentId,

        viewerJoined:
          Boolean(
            viewer
          ),
      }
    )

    // ========================================================
    // 7. PRIVATE ROOM PROTECTION
    // ========================================================

    const isStudentCreator =
      room.creatorType ===
        'student' &&
      toIdString(
        room.creatorStudentId
      ) ===
        viewerStudentId

    if (
      room.visibility ===
        'private' &&
      !viewer &&
      !isStudentCreator
    ) {
      return NextResponse.json(
        {
          error:
            'You must join this private Arena room before viewing it.',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // 8. CALCULATE ARENA STATE
    // ========================================================

    const state =
      getArenaState(
        room
      )

    console.log(
      '[ARENA STATE] Calculated state:',
      {
        roomCode:
          room.roomCode,

        phase:
          state.phase,

        currentSubjectIndex:
          state.currentSubjectIndex,

        nextSubjectIndex:
          state.nextSubjectIndex,

        secondsLeft:
          state.secondsLeft,

        startedAt:
          room.startedAt ||
          null,
      }
    )

    // ========================================================
    // 9. AUTO-COMPLETE ROOM
    // ========================================================

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

      console.log(
        '[ARENA STATE] Room automatically completed:',
        {
          roomCode:
            room.roomCode,

          roomId:
            room._id
              .toString(),
        }
      )
    }

    // ========================================================
    // 10. CURRENT SUBJECT
    // ========================================================

    const currentSubjectIndex =
      Number(
        state.currentSubjectIndex
      )

    const current =
      Number.isInteger(
        currentSubjectIndex
      ) &&
      currentSubjectIndex >=
        0 &&
      room.subjects?.[
        currentSubjectIndex
      ]
        ? room.subjects[
            currentSubjectIndex
          ]
        : null

    // ========================================================
    // 11. VIEWER CURRENT RESULT
    // ========================================================

    const viewerResult =
      current &&
      viewer
        ? viewer
            .subjectResults
            ?.find(
              (
                result:
                  any
              ) =>
                result
                  .subject ===
                current
                  .subject
            ) ||
          null
        : null

    const viewerSubmitted =
      Boolean(
        viewerResult
      )

    // ========================================================
    // 12. TOTAL POSSIBLE SCORE
    // ========================================================

    const possible =
      totalPossible(
        room
      )

    // ========================================================
    // 13. LEADERBOARD
    // ========================================================

    const ranked =
      rankParticipants(
        participants,
        possible
      )

    /*
     * During a subject:
     *
     * A student must submit before seeing current-round scores.
     *
     * During intermission:
     *
     * Everyone may see scores for the subject that just ended.
     *
     * At completion:
     *
     * Everyone may see final totals and rankings.
     */

    const canSeeCurrentScores =
      Boolean(
        viewerResult
      ) ||
      state.phase ===
        'intermission' ||
      state.phase ===
        'completed'

    // ========================================================
    // 14. SCREEN SHARING STATE
    // ========================================================

    const screenShareMode =
      room.screenShareMode ||
      'off'

    const viewerScreenShareActive =
      Boolean(
        viewer
          ?.screenShareActive
      )

    const lastScreenShareHeartbeat =
      viewer
        ?.lastScreenShareHeartbeat ||
      null

    const screenShareRequired =
      screenShareMode ===
      'required'

    /*
     * Do not rely forever on screenShareActive alone.
     *
     * A browser may disappear without sending a final
     * "inactive" request.
     */

    const heartbeatTime =
      lastScreenShareHeartbeat
        ? new Date(
            lastScreenShareHeartbeat
          ).getTime()
        : 0

    const heartbeatFresh =
      heartbeatTime >
        0 &&
      Date.now() -
        heartbeatTime <=
        30_000

    const screenShareSatisfied =
      !screenShareRequired ||
      (
        viewerScreenShareActive &&
        heartbeatFresh
      )

    // ========================================================
    // 15. WHETHER QUESTIONS MAY BE RETURNED
    // ========================================================

    const canReceiveQuestions =
      state.phase ===
        'subject' &&
      Boolean(
        current
      ) &&
      Boolean(
        viewer
      ) &&
      !viewerSubmitted &&
      room.status !==
        'cancelled'

    // ========================================================
    // 16. SAFE CURRENT QUESTIONS
    // ========================================================

    /*
     * IMPORTANT:
     *
     * Never send:
     *
     * correctAnswer
     * explanation
     * fingerprint
     *
     * before the participant submits.
     */

    const safeQuestions =
      canReceiveQuestions &&
      current &&
      Array.isArray(
        current.questions
      )
        ? current.questions.map(
            (
              question:
                any
            ) => ({
              id:
                question.id,

              text:
                question.text,

              options: {
                a:
                  question
                    ?.options
                    ?.a,

                b:
                  question
                    ?.options
                    ?.b,

                c:
                  question
                    ?.options
                    ?.c,

                d:
                  question
                    ?.options
                    ?.d,
              },
            })
          )
        : []

    // ========================================================
    // 17. LEADERBOARD RESPONSE
    // ========================================================

    const leaderboard =
      ranked.map(
        (
          participant:
            any,
          index:
            number
        ) => {
          const currentResult =
            current
              ? participant
                  .subjectResults
                  ?.find(
                    (
                      result:
                        any
                    ) =>
                      result
                        .subject ===
                      current
                        .subject
                  ) ||
                null
              : null

          const participantId =
            toIdString(
              participant
                .examPrepStudentId
            )

          const completed =
            state.phase ===
            'completed'

          return {
            rank:
              index +
              1,

            studentId:
              participantId,

            name:
              participant
                ?.examPrepStudentId
                ?.fullName ||
              'Student',

            isViewer:
              participantId ===
              viewerStudentId,

            submitted:
              Boolean(
                currentResult
              ),

            currentSubjectScore:
              canSeeCurrentScores &&
              currentResult
                ? {
                    score:
                      safeNumber(
                        currentResult
                          .score
                      ),

                    total:
                      safeNumber(
                        currentResult
                          .total
                      ),

                    percentage:
                      roundPercentage(
                        currentResult
                          .percentage
                      ),

                    submittedAt:
                      currentResult
                        .submittedAt ||
                      null,
                  }
                : null,

            totalScore:
              completed
                ? safeNumber(
                    participant
                      .totalScore
                  )
                : null,

            totalPossible:
              completed
                ? possible
                : null,

            overallPercentage:
              completed
                ? roundPercentage(
                    participant
                      .calculatedPercentage ??
                    participant
                      .overallPercentage
                  )
                : null,

            totalDurationSeconds:
              completed
                ? safeNumber(
                    participant
                      .totalDurationSeconds
                  )
                : null,
          }
        }
      )

    // ========================================================
    // 18. VIEWER RESULT
    // ========================================================

    const safeViewerResult =
      viewerResult
        ? {
            score:
              safeNumber(
                viewerResult
                  .score
              ),

            total:
              safeNumber(
                viewerResult
                  .total
              ),

            percentage:
              roundPercentage(
                viewerResult
                  .percentage
              ),

            durationSeconds:
              safeNumber(
                viewerResult
                  .durationSeconds
              ),

            submittedAt:
              viewerResult
                .submittedAt ||
              null,
          }
        : null

    // ========================================================
    // 19. SUBJECT METADATA
    // ========================================================

    const subjects =
      Array.isArray(
        room.subjects
      )
        ? room.subjects.map(
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
                subject
                  .durationMinutes,

              questionCount:
                subject
                  .questionCount,

              generationStatus:
                subject
                  .generationStatus,

              ready:
                subject
                  .generationStatus ===
                  'ready' &&
                Array.isArray(
                  subject.questions
                ) &&
                subject
                  .questions
                  .length >=
                  Number(
                    subject
                      .questionCount ||
                    0
                  ),
            })
          )
        : []

    // ========================================================
    // 20. CURRENT SUBJECT SAFE RESPONSE
    // ========================================================

    const safeCurrentSubject =
      current
        ? {
            index:
              currentSubjectIndex,

            subject:
              current.subject,

            durationMinutes:
              current
                .durationMinutes,

            questionCount:
              current
                .questionCount,

            generationStatus:
              current
                .generationStatus,

            questions:
              safeQuestions,
          }
        : null

    // ========================================================
    // 21. FINAL RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      room: {
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

        official:
          room.creatorType ===
          'admin',

        creatorType:
          room.creatorType,

        screenShareMode,

        maxParticipants:
          room.maxParticipants,

        intermissionSeconds:
          room.intermissionSeconds,

        startedAt:
          room.startedAt ||
          null,

        subjects,
      },

      // ======================================================
      // ARENA STATE
      // ======================================================

      state,

      // ======================================================
      // VIEWER
      // ======================================================

      viewer: {
        joined:
          Boolean(
            viewer
          ),

        submitted:
          viewerSubmitted,

        isCreator:
          isStudentCreator,

        result:
          safeViewerResult,

        screenShare: {
          mode:
            screenShareMode,

          required:
            screenShareRequired,

          active:
            viewerScreenShareActive,

          heartbeatFresh,

          satisfied:
            screenShareSatisfied,

          lastHeartbeat:
            lastScreenShareHeartbeat,
        },
      },

      // ======================================================
      // BACKWARD COMPATIBILITY
      // ======================================================

      viewerJoined:
        Boolean(
          viewer
        ),

      viewerSubmitted,

      viewerResult:
        safeViewerResult,

      isCreator:
        isStudentCreator,

      // ======================================================
      // PARTICIPANTS
      // ======================================================

      participantCount:
        participants.length,

      leaderboard,

      // ======================================================
      // CURRENT SUBJECT
      // ======================================================

      currentSubject:
        safeCurrentSubject,
    })
  } catch (
    error
  ) {
    console.error(
      '[ARENA STATE] Unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load Arena state.',
      },
      {
        status:
          500,
      }
    )
  }
}
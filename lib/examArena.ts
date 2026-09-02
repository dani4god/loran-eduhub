// app/lib/examArena.ts

// ============================================================
// TYPES
// ============================================================

export type ArenaPhase =
  | 'lobby'
  | 'countdown'
  | 'subject'
  | 'intermission'
  | 'completed'

export type ArenaState = {
  phase: ArenaPhase

  currentSubjectIndex: number
  nextSubjectIndex?: number

  secondsLeft: number
  startsIn: number | null

  /*
   * Server-authoritative timing information.
   */
  competitionStartedAt: string | null

  roundStartedAt: string | null
  roundEndsAt: string | null

  elapsedSecondsWithinSubject: number
  subjectElapsedSeconds: number
  roundElapsedSeconds: number

  /*
   * Useful for frontend synchronization.
   */
  serverNow: string

  /*
   * Total seconds that have elapsed since the competition
   * officially started.
   */
  competitionElapsedSeconds: number

  /*
   * Current subject metadata where applicable.
   */
  currentSubject?: string | null

  /*
   * Intermission information.
   */
  intermissionStartedAt?: string | null
  intermissionEndsAt?: string | null
}

// ============================================================
// HELPERS
// ============================================================

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : fallback
}

function safePositiveInteger(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Math.floor(
      safeNumber(
        value,
        fallback
      )
    )

  return parsed > 0
    ? parsed
    : fallback
}

function toIso(
  value: number | Date | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null
  }

  return date.toISOString()
}

function secondsBetween(
  startMs: number,
  endMs: number
) {
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return 0
  }

  return Math.max(
    0,
    Math.floor(
      (endMs - startMs) /
      1000
    )
  )
}

function secondsRemaining(
  nowMs: number,
  endMs: number
) {
  return Math.max(
    0,
    Math.ceil(
      (endMs - nowMs) /
      1000
    )
  )
}

function getSubjects(
  room: any
) {
  return Array.isArray(
    room?.subjects
  )
    ? room.subjects
    : []
}

// ============================================================
// ARENA STATE
// ============================================================

export function getArenaState(
  room: any,
  now = new Date()
): ArenaState {
  const nowMs =
    now.getTime()

  const serverNow =
    now.toISOString()

  const subjects =
    getSubjects(room)

  // ==========================================================
  // 1. NOT STARTED
  // ==========================================================

  if (
    !room?.startedAt
  ) {
    return {
      phase:
        'lobby',

      currentSubjectIndex:
        -1,

      secondsLeft:
        0,

      startsIn:
        null,

      competitionStartedAt:
        null,

      roundStartedAt:
        null,

      roundEndsAt:
        null,

      elapsedSecondsWithinSubject:
        0,

      subjectElapsedSeconds:
        0,

      roundElapsedSeconds:
        0,

      serverNow,

      competitionElapsedSeconds:
        0,

      currentSubject:
        null,
    }
  }

  const startedAt =
    new Date(
      room.startedAt
    ).getTime()

  // ==========================================================
  // 2. INVALID START DATE SAFETY
  // ==========================================================

  if (
    !Number.isFinite(
      startedAt
    )
  ) {
    return {
      phase:
        'lobby',

      currentSubjectIndex:
        -1,

      secondsLeft:
        0,

      startsIn:
        null,

      competitionStartedAt:
        null,

      roundStartedAt:
        null,

      roundEndsAt:
        null,

      elapsedSecondsWithinSubject:
        0,

      subjectElapsedSeconds:
        0,

      roundElapsedSeconds:
        0,

      serverNow,

      competitionElapsedSeconds:
        0,

      currentSubject:
        null,
    }
  }

  const competitionStartedAt =
    toIso(
      startedAt
    )

  // ==========================================================
  // 3. COUNTDOWN
  // ==========================================================

  if (
    nowMs <
    startedAt
  ) {
    const seconds =
      secondsRemaining(
        nowMs,
        startedAt
      )

    return {
      phase:
        'countdown',

      currentSubjectIndex:
        subjects.length
          ? 0
          : -1,

      secondsLeft:
        seconds,

      startsIn:
        seconds,

      competitionStartedAt,

      roundStartedAt:
        subjects.length
          ? toIso(
              startedAt
            )
          : null,

      roundEndsAt:
        subjects.length
          ? toIso(
              startedAt +
                safePositiveInteger(
                  subjects[0]
                    ?.durationMinutes
                ) *
                  60 *
                  1000
            )
          : null,

      elapsedSecondsWithinSubject:
        0,

      subjectElapsedSeconds:
        0,

      roundElapsedSeconds:
        0,

      serverNow,

      competitionElapsedSeconds:
        0,

      currentSubject:
        subjects[0]
          ?.subject ||
        null,
    }
  }

  // ==========================================================
  // 4. NO SUBJECTS
  // ==========================================================

  if (
    subjects.length ===
    0
  ) {
    return {
      phase:
        'completed',

      currentSubjectIndex:
        -1,

      secondsLeft:
        0,

      startsIn:
        null,

      competitionStartedAt,

      roundStartedAt:
        null,

      roundEndsAt:
        null,

      elapsedSecondsWithinSubject:
        0,

      subjectElapsedSeconds:
        0,

      roundElapsedSeconds:
        0,

      serverNow,

      competitionElapsedSeconds:
        secondsBetween(
          startedAt,
          nowMs
        ),

      currentSubject:
        null,
    }
  }

  // ==========================================================
  // 5. WALK THROUGH SUBJECT ROUNDS
  // ==========================================================

  let cursor =
    startedAt

  const intermissionSeconds =
    Math.max(
      0,
      safePositiveInteger(
        room
          ?.intermissionSeconds,
        15
      )
    )

  for (
    let index = 0;
    index <
    subjects.length;
    index += 1
  ) {
    const subject =
      subjects[index]

    const durationMinutes =
      Math.max(
        1,
        safePositiveInteger(
          subject
            ?.durationMinutes,
          1
        )
      )

    const subjectDurationMs =
      durationMinutes *
      60 *
      1000

    const subjectStart =
      cursor

    const subjectEnd =
      subjectStart +
      subjectDurationMs

    // ========================================================
    // ACTIVE SUBJECT
    // ========================================================

    if (
      nowMs <
      subjectEnd
    ) {
      const elapsed =
        Math.min(
          durationMinutes *
            60,
          Math.max(
            0,
            secondsBetween(
              subjectStart,
              nowMs
            )
          )
        )

      return {
        phase:
          'subject',

        currentSubjectIndex:
          index,

        secondsLeft:
          secondsRemaining(
            nowMs,
            subjectEnd
          ),

        startsIn:
          0,

        competitionStartedAt,

        roundStartedAt:
          toIso(
            subjectStart
          ),

        roundEndsAt:
          toIso(
            subjectEnd
          ),

        /*
         * These aliases intentionally contain the same value so
         * existing/new submit code can consume whichever field it
         * expects.
         */
        elapsedSecondsWithinSubject:
          elapsed,

        subjectElapsedSeconds:
          elapsed,

        roundElapsedSeconds:
          elapsed,

        serverNow,

        competitionElapsedSeconds:
          secondsBetween(
            startedAt,
            nowMs
          ),

        currentSubject:
          subject
            ?.subject ||
          null,
      }
    }

    // ========================================================
    // INTERMISSION
    // ========================================================

    if (
      index <
      subjects.length -
        1
    ) {
      const intermissionStart =
        subjectEnd

      const nextStart =
        intermissionStart +
        intermissionSeconds *
          1000

      if (
        nowMs <
        nextStart
      ) {
        return {
          phase:
            'intermission',

          /*
           * currentSubjectIndex remains the round that has just
           * ended. This preserves the behavior of your existing
           * leaderboard/state code.
           */
          currentSubjectIndex:
            index,

          nextSubjectIndex:
            index +
            1,

          secondsLeft:
            secondsRemaining(
              nowMs,
              nextStart
            ),

          startsIn:
            null,

          competitionStartedAt,

          /*
           * The completed round's timing remains available.
           */
          roundStartedAt:
            toIso(
              subjectStart
            ),

          roundEndsAt:
            toIso(
              subjectEnd
            ),

          elapsedSecondsWithinSubject:
            durationMinutes *
            60,

          subjectElapsedSeconds:
            durationMinutes *
            60,

          roundElapsedSeconds:
            durationMinutes *
            60,

          serverNow,

          competitionElapsedSeconds:
            secondsBetween(
              startedAt,
              nowMs
            ),

          currentSubject:
            subject
              ?.subject ||
            null,

          intermissionStartedAt:
            toIso(
              intermissionStart
            ),

          intermissionEndsAt:
            toIso(
              nextStart
            ),
        }
      }

      cursor =
        nextStart
    }
  }

  // ==========================================================
  // 6. COMPLETED
  // ==========================================================

  const lastIndex =
    subjects.length -
    1

  const lastSubject =
    subjects[
      lastIndex
    ]

  const lastDurationSeconds =
    Math.max(
      1,
      safePositiveInteger(
        lastSubject
          ?.durationMinutes,
        1
      )
    ) *
    60

  /*
   * cursor currently represents the start of the final subject.
   */
  const finalRoundStart =
    cursor

  const finalRoundEnd =
    finalRoundStart +
    lastDurationSeconds *
      1000

  return {
    phase:
      'completed',

    currentSubjectIndex:
      lastIndex,

    secondsLeft:
      0,

    startsIn:
      null,

    competitionStartedAt,

    roundStartedAt:
      toIso(
        finalRoundStart
      ),

    roundEndsAt:
      toIso(
        finalRoundEnd
      ),

    elapsedSecondsWithinSubject:
      lastDurationSeconds,

    subjectElapsedSeconds:
      lastDurationSeconds,

    roundElapsedSeconds:
      lastDurationSeconds,

    serverNow,

    competitionElapsedSeconds:
      secondsBetween(
        startedAt,
        nowMs
      ),

    currentSubject:
      lastSubject
        ?.subject ||
      null,
  }
}

// ============================================================
// TOTAL POSSIBLE
// ============================================================

export function totalPossible(
  room: any
) {
  const subjects =
    getSubjects(room)

  return subjects.reduce(
    (
      sum:
        number,
      subject:
        any
    ) =>
      sum +
      Math.max(
        0,
        safePositiveInteger(
          subject
            ?.questionCount,
          0
        )
      ),
    0
  )
}

// ============================================================
// RANK PARTICIPANTS
// ============================================================

export function rankParticipants(
  participants:
    any[],
  possible:
    number
) {
  const safePossible =
    Math.max(
      0,
      safeNumber(
        possible
      )
    )

  return [
    ...participants,
  ]
    .map(
      (
        participant:
          any
      ) => {
        const score =
          Math.max(
            0,
            safeNumber(
              participant
                ?.totalScore
            )
          )

        const duration =
          Math.max(
            0,
            safeNumber(
              participant
                ?.totalDurationSeconds
            )
          )

        const calculatedPercentage =
          safePossible >
          0
            ? Math.round(
                (
                  score /
                  safePossible
                ) *
                  10000
              ) /
              100
            : 0

        return {
          ...participant,

          totalScore:
            score,

          totalDurationSeconds:
            duration,

          calculatedPercentage,
        }
      }
    )
    .sort(
      (
        a:
          any,
        b:
          any
      ) => {
        // ====================================================
        // 1. HIGHEST SCORE WINS
        // ====================================================

        if (
          b.totalScore !==
          a.totalScore
        ) {
          return (
            b.totalScore -
            a.totalScore
          )
        }

        // ====================================================
        // 2. FASTEST TOTAL COMPLETION TIME WINS TIE
        // ====================================================

        if (
          a.totalDurationSeconds !==
          b.totalDurationSeconds
        ) {
          return (
            a.totalDurationSeconds -
            b.totalDurationSeconds
          )
        }

        // ====================================================
        // 3. STABLE FALLBACK
        // ====================================================

        /*
         * If score AND time are identical, use joinedAt so the
         * ranking doesn't randomly swap every polling request.
         *
         * This is not treated as a competitive advantage;
         * it simply makes ordering deterministic.
         */

        const aJoined =
          a?.joinedAt
            ? new Date(
                a.joinedAt
              ).getTime()
            : 0

        const bJoined =
          b?.joinedAt
            ? new Date(
                b.joinedAt
              ).getTime()
            : 0

        if (
          aJoined !==
          bJoined
        ) {
          return (
            aJoined -
            bJoined
          )
        }

        return String(
          a?._id ||
          ''
        ).localeCompare(
          String(
            b?._id ||
            ''
          )
        )
      }
    )
}
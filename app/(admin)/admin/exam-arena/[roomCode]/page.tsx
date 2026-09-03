'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  useParams,
} from 'next/navigation'

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  Play,
  RefreshCw,
  School,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type RoundResult = {
  index: number
  subject: string
  submitted: boolean
  score:
    number | null
  total: number
  percentage:
    number | null
  durationSeconds:
    number | null
  submittedAt:
    string | null
}

type Participant = {
  rank: number
  participantId: string
  studentId: string
  name: string
  school: string
  regNumber: string
  email: string
  joinedAt:
    string | null
  completedRounds: number
  totalRounds: number
  rounds:
    RoundResult[]
  totalScore: number
  totalPossible: number
  overallPercentage: number
  totalDurationSeconds: number
}

type ArenaData = {
  room: {
    id: string
    roomCode: string
    name: string
    instructions: string
    visibility: string
    status: string
    phase: string
    maxParticipants: number
    participantCount: number
    startedAt:
      string | null
    createdAt: string
    intermissionSeconds: number

    subjects: Array<{
      index: number
      subject: string
      durationMinutes: number
      questionCount: number
      generationStatus: string
    }>
  }

  state:
    Record<
      string,
      any
    >

  currentRound:
    {
      index: number
      subject: string
      durationMinutes: number
      questionCount: number
    } | null

  participantCount: number

  leaderboard:
    Participant[]

  winner:
    {
      rank: number
      name: string
      school: string
      regNumber: string
      score: number
      total: number
      percentage: number
    } | null
}

// ============================================================
// HELPERS
// ============================================================

function formatDuration(
  seconds:
    number
) {
  const safe =
    Math.max(
      0,
      Number(
        seconds ||
          0
      )
    )

  const minutes =
    Math.floor(
      safe /
        60
    )

  const remaining =
    Math.floor(
      safe %
        60
    )

  return `${minutes}:${String(
    remaining
  ).padStart(
    2,
    '0'
  )}`
}

function phaseLabel(
  value:
    string
) {
  if (
    value ===
    'subject'
  ) {
    return 'Live Round'
  }

  if (
    value ===
    'intermission'
  ) {
    return 'Intermission'
  }

  if (
    value ===
    'countdown'
  ) {
    return 'Starting'
  }

  if (
    value ===
    'completed'
  ) {
    return 'Completed'
  }

  if (
    value ===
    'lobby'
  ) {
    return 'Lobby'
  }

  return value
    ? value
        .charAt(
          0
        )
        .toUpperCase() +
        value.slice(
          1
        )
    : 'Waiting'
}

// ============================================================
// PAGE
// ============================================================

export default function AdminArenaMonitorPage() {
  const params =
    useParams<{
      roomCode:
        string
    }>()

  const roomCode =
    String(
      params
        ?.roomCode ||
        ''
    )
      .trim()
      .toUpperCase()

  const [
    data,
    setData,
  ] =
    useState<
      ArenaData | null
    >(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    )

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    starting,
    setStarting,
  ] =
    useState(
      false
    )

  const [
    startMessage,
    setStartMessage,
  ] =
    useState('')

  const [
    countdown,
    setCountdown,
  ] =
    useState<
      number | null
    >(
      null
    )

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadArena =
    useCallback(
      async (
        silent =
          false
      ) => {
        if (
          !roomCode
        ) {
          return
        }

        if (
          silent
        ) {
          setRefreshing(
            true
          )
        } else {
          setLoading(
            true
          )
        }

        try {
          const response =
            await fetch(
              `/api/admin/exam-arena/${encodeURIComponent(
                roomCode
              )}`,
              {
                cache:
                  'no-store',
              }
            )

          const result =
            await response.json()

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
                'Could not load Arena.'
            )
          }

          setData(
            result
          )

          setError('')
        } catch (
          err:
            unknown
        ) {
          setError(
            err instanceof
            Error
              ? err.message
              : 'Could not load Arena.'
          )
        } finally {
          setLoading(
            false
          )

          setRefreshing(
            false
          )
        }
      },
      [
        roomCode,
      ]
    )

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      loadArena()
    },
    [
      loadArena,
    ]
  )

  // ==========================================================
  // LIVE POLLING
  // ==========================================================

  useEffect(
    () => {
      if (
        !data
      ) {
        return
      }

      if (
        data.room
          .status ===
          'completed' ||
        data.room
          .status ===
          'cancelled'
      ) {
        return
      }

      const interval =
        window.setInterval(
          () => {
            loadArena(
              true
            )
          },
          3000
        )

      return () =>
        window.clearInterval(
          interval
        )
    },
    [
      data,
      loadArena,
    ]
  )

  // ==========================================================
  // SYNCHRONIZED START COUNTDOWN
  // ==========================================================

  useEffect(
    () => {
      const startedAt =
        data?.room
          ?.startedAt

      if (
        !startedAt
      ) {
        setCountdown(
          null
        )

        return
      }

      const updateCountdown =
        () => {
          const startTime =
            new Date(
              startedAt
            ).getTime()

          const remaining =
            Math.max(
              0,
              Math.ceil(
                (
                  startTime -
                  Date.now()
                ) /
                  1000
              )
            )

          setCountdown(
            remaining
          )
        }

      updateCountdown()

      const interval =
        window.setInterval(
          updateCountdown,
          250
        )

      return () =>
        window.clearInterval(
          interval
        )
    },
    [
      data?.room
        ?.startedAt,
    ]
  )

  // ==========================================================
  // START COMPETITION
  // ==========================================================

  const startCompetition =
    async () => {
      if (
        !data ||
        !roomCode ||
        starting
      ) {
        return
      }

      if (
        data.participantCount <=
        0
      ) {
        setError(
          'At least one student must join before the competition can start.'
        )

        return
      }

      if (
        data.room.status !==
        'lobby'
      ) {
        setError(
          'This competition is not ready to start yet.'
        )

        return
      }

      if (
        data.room.startedAt
      ) {
        setError(
          'This competition has already started.'
        )

        return
      }

      const confirmed =
        window.confirm(
          `Start "${data.room.name}" now? ${data.participantCount} participant${
            data.participantCount ===
            1
              ? ''
              : 's'
          } will begin after the synchronized 10-second countdown.`
        )

      if (
        !confirmed
      ) {
        return
      }

      setStarting(
        true
      )

      setError('')
      setStartMessage('')

      try {
        const response =
          await fetch(
            `/api/exam-prep/arena/${encodeURIComponent(
              roomCode
            )}/start`,
            {
              method:
                'POST',
            }
          )

        const result =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            result?.error ||
              'Could not start competition.'
          )
        }

        if (
          result?.alreadyStarted
        ) {
          setStartMessage(
            'Competition has already started.'
          )
        } else {
          setStartMessage(
            'Competition started. Students are entering the synchronized countdown.'
          )
        }

        await loadArena(
          true
        )
      } catch (
        err:
          unknown
      ) {
        setError(
          err instanceof
          Error
            ? err.message
            : 'Could not start competition.'
        )
      } finally {
        setStarting(
          false
        )
      }
    }

  // ==========================================================
  // TOTAL SUBMISSIONS
  // ==========================================================

  const roundSubmissions =
    useMemo(
      () =>
        data
          ?.leaderboard
          ?.reduce(
            (
              total,
              participant
            ) =>
              total +
              participant
                .completedRounds,
            0
          ) ||
        0,
      [
        data,
      ]
    )

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading competition...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // UNAVAILABLE
  // ==========================================================

  if (
    !data
  ) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Trophy className="mx-auto text-slate-300" />

        <h1 className="mt-4 text-xl font-black">
          Competition unavailable
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error ||
            'Could not load this competition.'}
        </p>

        <Link
          href="/admin/exam-arena"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft
            size={
              15
            }
          />

          Back to Arena
        </Link>
      </div>
    )
  }

  const {
    room,
    leaderboard,
    winner,
  } =
    data

  const isLobby =
    room.status ===
      'lobby' &&
    !room.startedAt

  const hasParticipants =
    data.participantCount >
    0

  const hasStarted =
    Boolean(
      room.startedAt
    )

  const isCompleted =
    room.status ===
      'completed' ||
    room.phase ===
      'completed'

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/exam-arena"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft
                size={
                  14
                }
              />

              Official Arena
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                {room.name}
              </h1>

              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                Official
              </span>

              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase text-white">
                {phaseLabel(
                  room.phase
                )}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <code className="rounded-lg bg-slate-950 px-2.5 py-1 font-black tracking-widest text-white">
                {room.roomCode}
              </code>

              <span>
                {room.subjects.length}{' '}
                round
                {room.subjects.length ===
                1
                  ? ''
                  : 's'}
              </span>

              <span className="capitalize">
                {room.visibility}
              </span>
            </div>
          </div>

          {/* ==================================================
              HEADER ACTIONS
          =================================================== */}

          <div className="flex flex-col gap-2 sm:flex-row">

            {isLobby && (
              <button
                type="button"
                onClick={
                  startCompetition
                }
                disabled={
                  starting ||
                  !hasParticipants
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {starting ? (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Play
                    size={
                      14
                    }
                  />
                )}

                {starting
                  ? 'Starting...'
                  : !hasParticipants
                    ? 'Waiting for Participants'
                    : 'Start Competition'}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                loadArena(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw
                size={
                  14
                }
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ====================================================
            START SUCCESS MESSAGE
        ===================================================== */}

        {startMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {startMessage}
          </div>
        )}

        {/* ====================================================
            LOBBY START PANEL
        ===================================================== */}

        {isLobby && (
          <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock3
                    size={
                      21
                    }
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                    Competition Lobby
                  </p>

                  <h2 className="mt-1 text-lg font-black text-amber-950">
                    {hasParticipants
                      ? `${data.participantCount} participant${
                          data.participantCount ===
                          1
                            ? ''
                            : 's'
                        } waiting for you to start`
                      : 'Waiting for students to join'}
                  </h2>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-700">
                    Students remain in the lobby until an administrator starts this official competition.
                    Once started, every participant receives the same synchronized 10-second countdown
                    before the first subject begins.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  startCompetition
                }
                disabled={
                  starting ||
                  !hasParticipants
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {starting ? (
                  <Loader2
                    size={
                      17
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Play
                    size={
                      17
                    }
                  />
                )}

                {starting
                  ? 'Starting...'
                  : hasParticipants
                    ? 'Start Competition'
                    : 'Waiting for Participants'}
              </button>
            </div>
          </section>
        )}

        {/* ====================================================
            SYNCHRONIZED COUNTDOWN
        ===================================================== */}

        {hasStarted &&
          countdown !==
            null &&
          countdown >
            0 && (
            <section className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
              <div className="px-5 py-7 text-center sm:px-7">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Play
                    size={
                      21
                    }
                  />
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  Synchronized Start
                </p>

                <p className="mt-2 text-6xl font-black tracking-tight text-blue-950">
                  {countdown}
                </p>

                <p className="mt-2 text-sm font-bold text-blue-700">
                  Competition begins in{' '}
                  {countdown}{' '}
                  second
                  {countdown ===
                  1
                    ? ''
                    : 's'}
                </p>

                <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-blue-600">
                  Every participant is using the same server start time, so the first round begins
                  simultaneously for everyone.
                </p>
              </div>
            </section>
          )}

        {/* ====================================================
            LIVE STATUS
        ===================================================== */}

        {hasStarted &&
          (
            countdown ===
              null ||
            countdown <=
              0
          ) &&
          !isCompleted && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>

                <div>
                  <p className="text-sm font-black text-emerald-900">
                    Competition is live
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-700">
                    Scores and round submissions update automatically.
                  </p>
                </div>
              </div>
            </section>
          )}

        {/* ====================================================
            STATS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Users
              className="text-blue-600"
              size={
                19
              }
            />

            <p className="mt-3 text-2xl font-black">
              {data.participantCount}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Participants
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Trophy
              className="text-amber-500"
              size={
                19
              }
            />

            <p className="mt-3 text-2xl font-black">
              {room.subjects.length}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Rounds
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <CheckCircle2
              className="text-emerald-600"
              size={
                19
              }
            />

            <p className="mt-3 text-2xl font-black">
              {roundSubmissions}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Round submissions
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Users
              className="text-purple-600"
              size={
                19
              }
            />

            <p className="mt-3 text-2xl font-black">
              {room.maxParticipants}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Capacity
            </p>
          </div>
        </div>

        {/* ====================================================
            CURRENT ROUND
        ===================================================== */}

        {data.currentRound && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
              Current round
            </p>

            <p className="mt-1 font-black text-blue-950">
              Round{' '}
              {data.currentRound.index +
                1}
              :{' '}
              {data.currentRound.subject}
            </p>

            <p className="mt-1 text-xs text-blue-700">
              {data.currentRound.questionCount}{' '}
              questions ·{' '}
              {data.currentRound.durationMinutes}{' '}
              minutes
            </p>
          </div>
        )}

        {/* ====================================================
            WINNER
        ===================================================== */}

        {winner && (
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 p-[1px] shadow-lg">
            <div className="rounded-[23px] bg-slate-950 px-5 py-6 text-white sm:px-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                    <Crown
                      size={
                        28
                      }
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                      Competition Winner
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {winner.name}
                    </h2>

                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                      <School
                        size={
                          14
                        }
                      />

                      {winner.school}
                    </p>

                    {winner.regNumber && (
                      <p className="mt-1 text-xs text-slate-500">
                        {winner.regNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 px-6 py-4 text-center">
                  <p className="text-3xl font-black text-amber-300">
                    {winner.score}/
                    {winner.total}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {winner.percentage.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            PARTICIPANTS
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-slate-900">
                  Competition Results
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Scores update automatically as students submit each round.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                {data.participantCount}{' '}
                participant
                {data.participantCount ===
                1
                  ? ''
                  : 's'}
              </div>
            </div>
          </div>

          {leaderboard.length ===
          0 ? (
            <div className="px-6 py-14 text-center">
              <UserRound
                size={
                  34
                }
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-bold text-slate-600">
                No participants yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Students will appear here after joining the Arena.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[10px] font-black uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">
                      Rank
                    </th>

                    <th className="px-4 py-3">
                      Student
                    </th>

                    <th className="px-4 py-3">
                      School
                    </th>

                    {room.subjects.map(
                      (
                        subject
                      ) => (
                        <th
                          key={
                            subject.index
                          }
                          className="px-4 py-3 text-center"
                        >
                          {subject.subject}
                        </th>
                      )
                    )}

                    <th className="px-4 py-3 text-center">
                      Total
                    </th>

                    <th className="px-4 py-3 text-center">
                      %
                    </th>

                    <th className="px-4 py-3 text-center">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map(
                    (
                      participant
                    ) => (
                      <tr
                        key={
                          participant.participantId
                        }
                        className="text-sm transition hover:bg-slate-50/70"
                      >
                        {/* RANK */}

                        <td className="px-4 py-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-black ${
                              participant.rank ===
                              1
                                ? 'bg-amber-100 text-amber-700'
                                : participant.rank ===
                                    2
                                  ? 'bg-slate-200 text-slate-700'
                                  : participant.rank ===
                                      3
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {participant.rank ===
                            1 ? (
                              <Award
                                size={
                                  16
                                }
                                className="text-amber-500"
                              />
                            ) : (
                              participant.rank
                            )}
                          </div>
                        </td>

                        {/* STUDENT */}

                        <td className="px-4 py-4">
                          <p className="font-black text-slate-900">
                            {participant.name}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {participant.regNumber}
                          </p>
                        </td>

                        {/* SCHOOL */}

                        <td className="max-w-[240px] px-4 py-4">
                          <p className="truncate text-xs font-semibold text-slate-600">
                            {participant.school}
                          </p>
                        </td>

                        {/* ROUND SCORES */}

                        {participant.rounds.map(
                          (
                            round
                          ) => (
                            <td
                              key={`${participant.participantId}-${round.index}`}
                              className="px-4 py-4 text-center"
                            >
                              {round.submitted ? (
                                <div>
                                  <p className="font-black text-slate-800">
                                    {round.score}/
                                    {round.total}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {Number(
                                      round.percentage ||
                                        0
                                    ).toFixed(
                                      1
                                    )}
                                    %
                                  </p>

                                  {round.durationSeconds !==
                                    null && (
                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                      {formatDuration(
                                        round.durationSeconds
                                      )}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                                  Waiting
                                </span>
                              )}
                            </td>
                          )
                        )}

                        {/* TOTAL */}

                        <td className="px-4 py-4 text-center">
                          <p className="font-black text-slate-900">
                            {participant.totalScore}/
                            {participant.totalPossible}
                          </p>

                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {participant.completedRounds}/
                            {participant.totalRounds}{' '}
                            rounds
                          </p>
                        </td>

                        {/* PERCENTAGE */}

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`font-black ${
                              participant.overallPercentage >=
                              70
                                ? 'text-emerald-600'
                                : participant.overallPercentage >=
                                    50
                                  ? 'text-blue-600'
                                  : 'text-slate-600'
                            }`}
                          >
                            {participant.overallPercentage.toFixed(
                              1
                            )}
                            %
                          </span>
                        </td>

                        {/* TIME */}

                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock3
                              size={
                                12
                              }
                            />

                            {formatDuration(
                              participant.totalDurationSeconds
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ====================================================
            COMPLETED FOOTER
        ===================================================== */}

        {isCompleted && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <CheckCircle2
              size={
                28
              }
              className="mx-auto text-emerald-600"
            />

            <h3 className="mt-3 font-black text-slate-900">
              Competition completed
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Final scores and rankings are shown above.
            </p>

            <Link
              href="/admin/exam-arena"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-600"
            >
              <ArrowLeft
                size={
                  14
                }
              />

              Back to Official Arenas
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
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
  // INITIAL
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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* HEADER */}

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

              <span>
                {room.visibility}
              </span>
            </div>
          </div>

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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm"
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Users className="text-blue-600" size={19} />

            <p className="mt-3 text-2xl font-black">
              {data.participantCount}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Participants
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Trophy className="text-amber-500" size={19} />

            <p className="mt-3 text-2xl font-black">
              {room.subjects.length}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Rounds
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <CheckCircle2 className="text-emerald-600" size={19} />

            <p className="mt-3 text-2xl font-black">
              {roundSubmissions}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Round submissions
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Users className="text-purple-600" size={19} />

            <p className="mt-3 text-2xl font-black">
              {room.maxParticipants}
            </p>

            <p className="text-[10px] font-bold uppercase text-slate-400">
              Capacity
            </p>
          </div>
        </div>

        {/* CURRENT ROUND */}

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

        {/* WINNER */}

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

        {/* PARTICIPANTS */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-black text-slate-900">
              Competition Results
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Scores update automatically as students submit each round.
            </p>
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
                        className="text-sm"
                      >
                        <td className="px-4 py-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700">
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

                        <td className="px-4 py-4">
                          <p className="font-black text-slate-900">
                            {participant.name}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {participant.regNumber}
                          </p>
                        </td>

                        <td className="max-w-[240px] px-4 py-4">
                          <p className="truncate text-xs font-semibold text-slate-600">
                            {participant.school}
                          </p>
                        </td>

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
                                </div>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                                  Waiting
                                </span>
                              )}
                            </td>
                          )
                        )}

                        <td className="px-4 py-4 text-center">
                          <p className="font-black text-slate-900">
                            {participant.totalScore}/
                            {participant.totalPossible}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-center font-black text-blue-600">
                          {participant.overallPercentage.toFixed(
                            1
                          )}
                          %
                        </td>

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
      </div>
    </div>
  )
}
// app/(admin)/admin/exam-arena/page.tsx

'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  Copy,
  Eye,
  FileQuestion,
  Globe2,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type SubjectCatalogCategory = {
  value: string
  label: string
  subjects: string[]
}

type SelectedSubject = {
  subject: string
  durationMinutes: number
  questionCount: number
}

type GenerationStatus =
  | 'pending'
  | 'generating'
  | 'ready'
  | 'failed'

type AdminArenaSubject = {
  index: number
  subject: string
  durationMinutes: number
  questionCount: number
  preparedQuestionCount: number
  generationStatus: GenerationStatus
}

type AdminArenaRoom = {
  id: string
  roomCode: string
  name: string
  instructions: string
  visibility:
    | 'public'
    | 'private'
  status:
    | 'preparing'
    | 'lobby'
    | 'completed'
    | 'cancelled'
  screenShareMode:
    | 'off'
    | 'optional'
    | 'required'
  maxParticipants: number
  participantCount: number
  intermissionSeconds: number
  startedAt:
    | string
    | null
  createdAt: string
  totalMinutes: number

  subjects:
    AdminArenaSubject[]

  preparation: {
    totalSubjects: number
    readySubjects: number
    generatingSubjects: number
    failedSubjects: number
    totalQuestions: number
    preparedQuestions: number
    percentage: number
  }
}

type PreparationItem = {
  subject: string
  status:
    | 'waiting'
    | 'generating'
    | 'ready'
    | 'failed'
  current: number
  total: number
  error?: string
}

// ============================================================
// CONSTANTS
// ============================================================

const DURATION_OPTIONS = [
  10,
  15,
  20,
  25,
  30,
  45,
  60,
  90,
  120,
]

const QUESTION_OPTIONS = [
  10,
  20,
  30,
  40,
  50,
]

const INTERMISSION_OPTIONS = [
  {
    value:
      5,
    label:
      '5 seconds',
  },
  {
    value:
      10,
    label:
      '10 seconds',
  },
  {
    value:
      15,
    label:
      '15 seconds',
  },
  {
    value:
      30,
    label:
      '30 seconds',
  },
  {
    value:
      60,
    label:
      '1 minute',
  },
]

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(
  value: any,
  fallback:
    string
) {
  return (
    value?.error ||
    value?.message ||
    fallback
  )
}

function statusLabel(
  status:
    AdminArenaRoom['status']
) {
  if (
    status ===
    'lobby'
  ) {
    return 'Ready'
  }

  if (
    status ===
    'preparing'
  ) {
    return 'Preparing'
  }

  if (
    status ===
    'completed'
  ) {
    return 'Completed'
  }

  return 'Cancelled'
}

function roomStatusClass(
  status:
    AdminArenaRoom['status']
) {
  if (
    status ===
    'lobby'
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (
    status ===
    'preparing'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (
    status ===
    'completed'
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function preparationIcon(
  status:
    PreparationItem['status']
) {
  if (
    status ===
    'ready'
  ) {
    return (
      <CheckCircle2
        size={17}
        className="text-emerald-500"
      />
    )
  }

  if (
    status ===
    'generating'
  ) {
    return (
      <Loader2
        size={17}
        className="animate-spin text-blue-600"
      />
    )
  }

  if (
    status ===
    'failed'
  ) {
    return (
      <AlertCircle
        size={17}
        className="text-red-500"
      />
    )
  }

  return (
    <Circle
      size={15}
      className="text-slate-300"
    />
  )
}

// ============================================================
// PAGE
// ============================================================

export default function AdminExamArenaPage() {
  // ==========================================================
  // DATA
  // ==========================================================

  const [
    rooms,
    setRooms,
  ] =
    useState<
      AdminArenaRoom[]
    >([])

  const [
    catalog,
    setCatalog,
  ] =
    useState<
      SubjectCatalogCategory[]
    >([])

  const [
    loadingRooms,
    setLoadingRooms,
  ] =
    useState(
      true
    )

  const [
    loadingCatalog,
    setLoadingCatalog,
  ] =
    useState(
      true
    )

  // ==========================================================
  // FORM
  // ==========================================================

  const [
    name,
    setName,
  ] =
    useState('')

  const [
    instructions,
    setInstructions,
  ] =
    useState('')

  const [
    visibility,
    setVisibility,
  ] =
    useState<
      'public' |
      'private'
    >(
      'public'
    )

  const [
    screenShareMode,
    setScreenShareMode,
  ] =
    useState<
      'off' |
      'optional' |
      'required'
    >(
      'off'
    )

  const [
    maxParticipants,
    setMaxParticipants,
  ] =
    useState(
      100
    )

  const [
    intermissionSeconds,
    setIntermissionSeconds,
  ] =
    useState(
      15
    )

  const [
    selected,
    setSelected,
  ] =
    useState<
      SelectedSubject[]
    >([])

  // ==========================================================
  // UI
  // ==========================================================

  const [
    creating,
    setCreating,
  ] =
    useState(
      false
    )

  const [
    preparation,
    setPreparation,
  ] =
    useState<
      PreparationItem[]
    >([])

  const [
    createdRoomCode,
    setCreatedRoomCode,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      | 'all'
      | 'preparing'
      | 'lobby'
      | 'completed'
      | 'cancelled'
    >(
      'all'
    )

  const [
    showCreator,
    setShowCreator,
  ] =
    useState(
      true
    )

  // ==========================================================
  // LOAD SUBJECT CATALOG
  // ==========================================================

  const loadCatalog =
    useCallback(
      async () => {
        setLoadingCatalog(
          true
        )

        try {
          const res =
            await fetch(
              '/api/exam-prep/subjects',
              {
                cache:
                  'no-store',
              }
            )

          const data =
            await res.json()

          if (
            !res.ok
          ) {
            throw new Error(
              getErrorMessage(
                data,
                'Could not load subjects.'
              )
            )
          }

          setCatalog(
            Array.isArray(
              data
                ?.categories
            )
              ? data.categories
              : []
          )
        } catch (
          err:
            unknown
        ) {
          setError(
            err instanceof
            Error
              ? err.message
              : 'Could not load subject catalog.'
          )
        } finally {
          setLoadingCatalog(
            false
          )
        }
      },
      []
    )

  // ==========================================================
  // LOAD ADMIN ARENAS
  // ==========================================================

  const loadRooms =
    useCallback(
      async () => {
        setLoadingRooms(
          true
        )

        try {
          const params =
            new URLSearchParams()

          if (
            activeFilter !==
            'all'
          ) {
            params.set(
              'status',
              activeFilter
            )
          }

          if (
            search.trim()
          ) {
            params.set(
              'search',
              search.trim()
            )
          }

          const suffix =
            params.toString()

          const res =
            await fetch(
              `/api/admin/exam-arena${
                suffix
                  ? `?${suffix}`
                  : ''
              }`,
              {
                cache:
                  'no-store',
              }
            )

          const data =
            await res.json()

          if (
            !res.ok
          ) {
            throw new Error(
              getErrorMessage(
                data,
                'Could not load Arena rooms.'
              )
            )
          }

          setRooms(
            Array.isArray(
              data?.rooms
            )
              ? data.rooms
              : []
          )
        } catch (
          err:
            unknown
        ) {
          setError(
            err instanceof
            Error
              ? err.message
              : 'Could not load Arena rooms.'
          )
        } finally {
          setLoadingRooms(
            false
          )
        }
      },
      [
        activeFilter,
        search,
      ]
    )

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      loadCatalog()
    },
    [
      loadCatalog,
    ]
  )

  useEffect(
    () => {
      const timeout =
        setTimeout(
          () => {
            loadRooms()
          },
          search
            ? 300
            : 0
        )

      return () =>
        clearTimeout(
          timeout
        )
    },
    [
      loadRooms,
      search,
      activeFilter,
    ]
  )

  // ==========================================================
  // SUBJECT ACTIONS
  // ==========================================================

  const selectedNames =
    useMemo(
      () =>
        new Set(
          selected.map(
            (
              item
            ) =>
              item.subject
          )
        ),
      [
        selected,
      ]
    )

  const toggleSubject =
    (
      subject:
        string
    ) => {
      setError('')

      setSelected(
        (
          current
        ) => {
          if (
            current.some(
              (
                item
              ) =>
                item
                  .subject ===
                subject
            )
          ) {
            return current.filter(
              (
                item
              ) =>
                item
                  .subject !==
                subject
            )
          }

          if (
            current.length >=
            6
          ) {
            setError(
              'A competition can contain a maximum of 6 subjects.'
            )

            return current
          }

          return [
            ...current,
            {
              subject,

              durationMinutes:
                30,

              questionCount:
                50,
            },
          ]
        }
      )
    }

  const updateSubject =
    (
      subject:
        string,
      patch:
        Partial<
          SelectedSubject
        >
    ) => {
      setSelected(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item
                .subject ===
              subject
                ? {
                    ...item,
                    ...patch,
                  }
                : item
          )
      )
    }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalQuestions =
    useMemo(
      () =>
        selected.reduce(
          (
            total,
            item
          ) =>
            total +
            item.questionCount,
          0
        ),
      [
        selected,
      ]
    )

  const totalMinutes =
    useMemo(
      () =>
        selected.reduce(
          (
            total,
            item
          ) =>
            total +
            item.durationMinutes,
          0
        ),
      [
        selected,
      ]
    )

  const totalIntermissionSeconds =
    Math.max(
      0,
      selected.length -
        1
    ) *
    intermissionSeconds

  // ==========================================================
  // RESET
  // ==========================================================

  const resetCreator =
    () => {
      setName('')
      setInstructions('')
      setVisibility(
        'public'
      )
      setScreenShareMode(
        'off'
      )
      setMaxParticipants(
        100
      )
      setIntermissionSeconds(
        15
      )
      setSelected([])
      setPreparation([])
      setCreatedRoomCode('')
    }

  // ==========================================================
  // CREATE + PREPARE
  // ==========================================================

  const createArena =
    async () => {
      setError('')
      setSuccess('')
      setCreatedRoomCode('')

      const cleanName =
        name.trim()

      if (
        cleanName.length <
        3
      ) {
        setError(
          'Enter a competition name of at least 3 characters.'
        )

        return
      }

      if (
        selected.length ===
        0
      ) {
        setError(
          'Select at least one subject.'
        )

        return
      }

      if (
        selected.length >
        6
      ) {
        setError(
          'You can select a maximum of 6 subjects.'
        )

        return
      }

      if (
        maxParticipants <
          1 ||
        maxParticipants >
          500
      ) {
        setError(
          'Maximum participants must be between 1 and 500.'
        )

        return
      }

      setCreating(
        true
      )

      const progress:
        PreparationItem[] =
        selected.map(
          (
            item
          ) => ({
            subject:
              item.subject,

            status:
              'waiting',

            current:
              0,

            total:
              item.questionCount,
          })
        )

      setPreparation(
        progress
      )

      try {
        // ------------------------------------------------------
        // CREATE ROOM
        // ------------------------------------------------------

        const createResponse =
          await fetch(
            '/api/exam-prep/arena',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  name:
                    cleanName,

                  instructions:
                    instructions.trim(),

                  visibility,

                  screenShareMode,

                  maxParticipants,

                  intermissionSeconds,

                  subjects:
                    selected.map(
                      (
                        item
                      ) => ({
                        subject:
                          item.subject,

                        durationMinutes:
                          item.durationMinutes,

                        questionCount:
                          item.questionCount,
                      })
                    ),
                }),
            }
          )

        const createData =
          await createResponse.json()

        if (
          !createResponse.ok
        ) {
          throw new Error(
            getErrorMessage(
              createData,
              'Could not create competition.'
            )
          )
        }

        const roomCode =
          String(
            createData
              ?.roomCode ||
            createData
              ?.room
              ?.roomCode ||
            ''
          )
            .trim()
            .toUpperCase()

        if (
          !roomCode
        ) {
          throw new Error(
            'Arena was created but no room code was returned.'
          )
        }

        setCreatedRoomCode(
          roomCode
        )

        // ------------------------------------------------------
        // PREPARE SUBJECTS SEQUENTIALLY
        // ------------------------------------------------------

        for (
          let index =
              0;
          index <
          selected.length;
          index +=
            1
        ) {
          const currentSubject =
            selected[
              index
            ]

          setPreparation(
            (
              current
            ) =>
              current.map(
                (
                  item,
                  itemIndex
                ) =>
                  itemIndex ===
                  index
                    ? {
                        ...item,
                        status:
                          'generating',
                      }
                    : item
              )
          )

          try {
            const prepResponse =
              await fetch(
                `/api/exam-prep/arena/${encodeURIComponent(
                  roomCode
                )}/prepare`,
                {
                  method:
                    'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify({
                      subjectIndex:
                        index,
                    }),
                }
              )

            const prepData =
              await prepResponse.json()

            if (
              !prepResponse.ok
            ) {
              throw new Error(
                getErrorMessage(
                  prepData,
                  `Could not prepare ${currentSubject.subject}.`
                )
              )
            }

            const preparedCount =
              Number(
                prepData
                  ?.questionCount ||
                currentSubject
                  .questionCount
              )

            setPreparation(
              (
                current
              ) =>
                current.map(
                  (
                    item,
                    itemIndex
                  ) =>
                    itemIndex ===
                    index
                      ? {
                          ...item,

                          status:
                            'ready',

                          current:
                            preparedCount,
                        }
                      : item
                )
            )
          } catch (
            prepError:
              unknown
          ) {
            const message =
              prepError instanceof
              Error
                ? prepError.message
                : `Could not prepare ${currentSubject.subject}.`

            setPreparation(
              (
                current
              ) =>
                current.map(
                  (
                    item,
                    itemIndex
                  ) =>
                    itemIndex ===
                    index
                      ? {
                          ...item,

                          status:
                            'failed',

                          error:
                            message,
                        }
                      : item
                )
            )

            throw new Error(
              `${currentSubject.subject}: ${message}`
            )
          }
        }

        setSuccess(
          `Official Arena ${roomCode} is ready for participants.`
        )

        await loadRooms()
      } catch (
        err:
          unknown
      ) {
        setError(
          err instanceof
          Error
            ? err.message
            : 'Could not create Arena.'
        )

        /*
         * We deliberately do NOT clear createdRoomCode or
         * preparation state here.
         *
         * If room creation succeeded but subject 3 failed,
         * the admin can see exactly where preparation stopped.
         */
        await loadRooms()
      } finally {
        setCreating(
          false
        )
      }
    }

  // ==========================================================
  // PREPARATION PERCENTAGE
  // ==========================================================

  const progressTotal =
    preparation.reduce(
      (
        total,
        item
      ) =>
        total +
        item.total,
      0
    )

  const progressCompleted =
    preparation.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.status ===
          'ready'
            ? item.total
            : item.current
        ),
      0
    )

  const progressPercentage =
    progressTotal >
    0
      ? Math.round(
          (
            progressCompleted /
            progressTotal
          ) *
            100
        )
      : 0

  // ==========================================================
  // COPY CODE
  // ==========================================================

  const copyRoomCode =
    async (
      roomCode:
        string
    ) => {
      try {
        await navigator
          .clipboard
          .writeText(
            roomCode
          )

        setSuccess(
          `Room code ${roomCode} copied.`
        )
      } catch {
        setError(
          'Could not copy room code.'
        )
      }
    }

  // ==========================================================
  // STATS
  // ==========================================================

  const stats =
    useMemo(
      () => ({
        total:
          rooms.length,

        preparing:
          rooms.filter(
            (
              room
            ) =>
              room.status ===
              'preparing'
          ).length,

        ready:
          rooms.filter(
            (
              room
            ) =>
              room.status ===
              'lobby'
          ).length,

        completed:
          rooms.filter(
            (
              room
            ) =>
              room.status ===
              'completed'
          ).length,
      }),
      [
        rooms,
      ]
    )

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Trophy
                  size={
                    20
                  }
                />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Official Exam Arena
                </h1>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Create and manage synchronized Loran EduHub competitions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowCreator(
                (
                  value
                ) =>
                  !value
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showCreator ? (
              <ChevronUp
                size={
                  17
                }
              />
            ) : (
              <Plus
                size={
                  17
                }
              />
            )}

            {showCreator
              ? 'Hide Creator'
              : 'Create Arena'}
          </button>
        </div>

        {/* ====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={
                18
              }
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X
                size={
                  16
                }
              />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={
                18
              }
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {success}
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
            >
              <X
                size={
                  16
                }
              />
            </button>
          </div>
        )}

        {/* ====================================================
            STATS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label:
                'Official Arenas',
              value:
                stats.total,
              icon:
                Trophy,
            },
            {
              label:
                'Preparing',
              value:
                stats.preparing,
              icon:
                Sparkles,
            },
            {
              label:
                'Ready',
              value:
                stats.ready,
              icon:
                CheckCircle2,
            },
            {
              label:
                'Completed',
              value:
                stats.completed,
              icon:
                Trophy,
            },
          ].map(
            (
              item
            ) => {
              const Icon =
                item.icon

              return (
                <div
                  key={
                    item.label
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">
                        {item.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon
                        size={
                          19
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            }
          )}
        </div>

        {/* ====================================================
            CREATOR
        ===================================================== */}

        {showCreator && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-5 text-white sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/10 p-2.5">
                  <Zap
                    size={
                      19
                    }
                  />
                </div>

                <div>
                  <h2 className="font-black">
                    Create Official Competition
                  </h2>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-blue-100">
                    Configure the competition once. Questions are prepared once and the same stored question pack is used for every participant.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">

              {/* LEFT */}

              <div className="space-y-7 p-4 sm:p-6">

                {/* BASIC DETAILS */}

                <section>
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900">
                      Competition details
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Give students enough information to understand the competition before joining.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-xs font-bold text-slate-700">
                        Competition name
                      </span>

                      <input
                        value={
                          name
                        }
                        onChange={(
                          event
                        ) =>
                          setName(
                            event
                              .target
                              .value
                          )
                        }
                        maxLength={
                          120
                        }
                        placeholder="e.g. National Science Challenge"
                        disabled={
                          creating
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="text-xs font-bold text-slate-700">
                        Instructions
                      </span>

                      <textarea
                        value={
                          instructions
                        }
                        onChange={(
                          event
                        ) =>
                          setInstructions(
                            event
                              .target
                              .value
                          )
                        }
                        rows={
                          4
                        }
                        placeholder="Competition rules, materials allowed, special instructions..."
                        disabled={
                          creating
                        }
                        className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                      />
                    </label>
                  </div>
                </section>

                {/* ACCESS */}

                <section>
                  <h3 className="font-bold text-slate-900">
                    Room configuration
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <label>
                      <span className="text-xs font-bold text-slate-700">
                        Visibility
                      </span>

                      <select
                        value={
                          visibility
                        }
                        onChange={(
                          event
                        ) =>
                          setVisibility(
                            event
                              .target
                              .value as
                              | 'public'
                              | 'private'
                          )
                        }
                        disabled={
                          creating
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                      >
                        <option value="public">
                          Public
                        </option>

                        <option value="private">
                          Private
                        </option>
                      </select>
                    </label>

                    <label>
                      <span className="text-xs font-bold text-slate-700">
                        Maximum participants
                      </span>

                      <input
                        type="number"
                        min={
                          1
                        }
                        max={
                          500
                        }
                        value={
                          maxParticipants
                        }
                        onChange={(
                          event
                        ) =>
                          setMaxParticipants(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        disabled={
                          creating
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold text-slate-700">
                        Between subjects
                      </span>

                      <select
                        value={
                          intermissionSeconds
                        }
                        onChange={(
                          event
                        ) =>
                          setIntermissionSeconds(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        disabled={
                          creating
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                      >
                        {INTERMISSION_OPTIONS.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                </section>

                {/* SUBJECT CATALOG */}

                <section>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Competition subjects
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Select up to 6 subjects. Configure each round separately below.
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                      {selected.length}/6 selected
                    </div>
                  </div>

                  {loadingCatalog ? (
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                      <Loader2
                        size={
                          16
                        }
                        className="animate-spin"
                      />

                      Loading subjects...
                    </div>
                  ) : (
                    <div className="mt-5 space-y-5">
                      {catalog.map(
                        (
                          category
                        ) => (
                          <div
                            key={
                              category.value
                            }
                          >
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              {category.label}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {category.subjects.map(
                                (
                                  subject
                                ) => {
                                  const isSelected =
                                    selectedNames.has(
                                      subject
                                    )

                                  return (
                                    <button
                                      key={
                                        subject
                                      }
                                      type="button"
                                      disabled={
                                        creating
                                      }
                                      onClick={() =>
                                        toggleSubject(
                                          subject
                                        )
                                      }
                                      className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/40'
                                      } disabled:opacity-50`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        {isSelected && (
                                          <Check
                                            size={
                                              13
                                            }
                                          />
                                        )}

                                        {subject}
                                      </span>
                                    </button>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                {/* SELECTED ROUNDS */}

                {selected.length >
                  0 && (
                  <section>
                    <h3 className="font-bold text-slate-900">
                      Round configuration
                    </h3>

                    <div className="mt-4 space-y-3">
                      {selected.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              item.subject
                            }
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                                  {index +
                                    1}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900">
                                    {item.subject}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Round {index +
                                      1}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  creating
                                }
                                onClick={() =>
                                  toggleSubject(
                                    item.subject
                                  )
                                }
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                title="Remove subject"
                              >
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <label>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Time
                                </span>

                                <select
                                  value={
                                    item.durationMinutes
                                  }
                                  disabled={
                                    creating
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateSubject(
                                      item.subject,
                                      {
                                        durationMinutes:
                                          Number(
                                            event
                                              .target
                                              .value
                                          ),
                                      }
                                    )
                                  }
                                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold"
                                >
                                  {DURATION_OPTIONS.map(
                                    (
                                      duration
                                    ) => (
                                      <option
                                        key={
                                          duration
                                        }
                                        value={
                                          duration
                                        }
                                      >
                                        {duration} minutes
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>

                              <label>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Questions
                                </span>

                                <select
                                  value={
                                    item.questionCount
                                  }
                                  disabled={
                                    creating
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateSubject(
                                      item.subject,
                                      {
                                        questionCount:
                                          Number(
                                            event
                                              .target
                                              .value
                                          ),
                                      }
                                    )
                                  }
                                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold"
                                >
                                  {QUESTION_OPTIONS.map(
                                    (
                                      count
                                    ) => (
                                      <option
                                        key={
                                          count
                                        }
                                        value={
                                          count
                                        }
                                      >
                                        {count} questions
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT SUMMARY */}

              <aside className="border-t border-slate-100 bg-slate-50/80 p-4 sm:p-6 xl:border-l xl:border-t-0">
                <div className="xl:sticky xl:top-6">
                  <h3 className="font-black text-slate-900">
                    Competition summary
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <FileQuestion
                          size={
                            15
                          }
                        />
                        Subjects
                      </span>

                      <b className="text-sm">
                        {selected.length}
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <Sparkles
                          size={
                            15
                          }
                        />
                        Questions
                      </span>

                      <b className="text-sm">
                        {totalQuestions}
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <Timer
                          size={
                            15
                          }
                        />
                        Exam time
                      </span>

                      <b className="text-sm">
                        {totalMinutes} min
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <Users
                          size={
                            15
                          }
                        />
                        Capacity
                      </span>

                      <b className="text-sm">
                        {maxParticipants}
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        {visibility ===
                        'public' ? (
                          <Globe2
                            size={
                              15
                            }
                          />
                        ) : (
                          <Lock
                            size={
                              15
                            }
                          />
                        )}
                        Visibility
                      </span>

                      <b className="text-sm capitalize">
                        {visibility}
                      </b>
                    </div>
                  </div>

                  {selected.length >
                    1 && (
                    <p className="mt-3 text-[10px] leading-4 text-slate-400">
                      Intermissions add approximately{' '}
                      {totalIntermissionSeconds}{' '}
                      seconds to the complete competition.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      creating ||
                      !name.trim() ||
                      selected.length ===
                        0
                    }
                    onClick={
                      createArena
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2
                        size={
                          17
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Sparkles
                        size={
                          17
                        }
                      />
                    )}

                    {creating
                      ? 'Preparing Arena...'
                      : 'Create & Prepare Arena'}
                  </button>

                  {!creating &&
                    createdRoomCode &&
                    preparation.every(
                      (
                        item
                      ) =>
                        item.status ===
                        'ready'
                    ) && (
                      <button
                        type="button"
                        onClick={
                          resetCreator
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Create another Arena
                      </button>
                    )}
                </div>
              </aside>
            </div>

            {/* ==================================================
                PREPARATION PROGRESS
            =================================================== */}

            {preparation.length >
              0 && (
              <div className="border-t border-slate-100 bg-white px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Question preparation
                    </h3>

                    {createdRoomCode && (
                      <p className="mt-1 text-xs text-slate-500">
                        Room{' '}
                        <span className="font-black text-blue-600">
                          {createdRoomCode}
                        </span>
                      </p>
                    )}
                  </div>

                  <p className="text-sm font-black text-slate-700">
                    {progressPercentage}%
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{
                      width:
                        `${progressPercentage}%`,
                    }}
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  />
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {preparation.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.subject
                        }
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="mt-0.5 shrink-0">
                          {preparationIcon(
                            item.status
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-slate-800">
                            {item.subject}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {item.status ===
                            'ready'
                              ? `${item.total}/${item.total} questions ready`
                              : item.status ===
                                  'generating'
                                ? 'Generating question pack...'
                                : item.status ===
                                    'failed'
                                  ? item.error ||
                                    'Preparation failed'
                                  : 'Waiting'}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {createdRoomCode &&
                  preparation.every(
                    (
                      item
                    ) =>
                      item.status ===
                      'ready'
                  ) && (
                    <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          size={
                            22
                          }
                          className="text-emerald-600"
                        />

                        <div>
                          <p className="text-sm font-black text-emerald-800">
                            Arena ready
                          </p>

                          <p className="text-xs text-emerald-700">
                            Students can now join with code{' '}
                            <b>
                              {createdRoomCode}
                            </b>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyRoomCode(
                            createdRoomCode
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm"
                      >
                        <Copy
                          size={
                            14
                          }
                        />
                        Copy room code
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            ROOM MANAGEMENT
        ===================================================== */}

        <section>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Official competitions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Monitor preparation, room capacity and competition status.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={
                    15
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search name or code..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:w-56"
                />
              </div>

              <select
                value={
                  activeFilter
                }
                onChange={(
                  event
                ) =>
                  setActiveFilter(
                    event
                      .target
                      .value as
                      typeof activeFilter
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="preparing">
                  Preparing
                </option>

                <option value="lobby">
                  Ready
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <button
                type="button"
                onClick={
                  loadRooms
                }
                disabled={
                  loadingRooms
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw
                  size={
                    14
                  }
                  className={
                    loadingRooms
                      ? 'animate-spin'
                      : ''
                  }
                />

                Refresh
              </button>
            </div>
          </div>

          {loadingRooms ? (
            <div className="mt-5 flex min-h-52 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="text-center">
                <Loader2
                  size={
                    26
                  }
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-xs text-slate-500">
                  Loading official competitions...
                </p>
              </div>
            </div>
          ) : rooms.length ===
            0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Trophy
                size={
                  32
                }
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-bold text-slate-700">
                No official competitions found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Create the first official Arena above.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {rooms.map(
                (
                  room
                ) => (
                  <article
                    key={
                      room.id
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${roomStatusClass(
                              room.status
                            )}`}>
                              {statusLabel(
                                room.status
                              )}
                            </span>

                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                              OFFICIAL
                            </span>
                          </div>

                          <h3 className="mt-3 truncate font-black text-slate-900">
                            {room.name}
                          </h3>
                        </div>

                        <Trophy
                          size={
                            20
                          }
                          className="shrink-0 text-amber-500"
                        />
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <code className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black tracking-widest text-white">
                          {room.roomCode}
                        </code>

                        <button
                          type="button"
                          onClick={() =>
                            copyRoomCode(
                              room.roomCode
                            )
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                        >
                          <Copy
                            size={
                              14
                            }
                          />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                          <p className="text-lg font-black text-slate-900">
                            {room.participantCount}
                          </p>

                          <p className="text-[9px] font-bold uppercase text-slate-400">
                            Joined
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                          <p className="text-lg font-black text-slate-900">
                            {room.subjects.length}
                          </p>

                          <p className="text-[9px] font-bold uppercase text-slate-400">
                            Subjects
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                          <p className="text-lg font-black text-slate-900">
                            {room.totalMinutes}
                          </p>

                          <p className="text-[9px] font-bold uppercase text-slate-400">
                            Minutes
                          </p>
                        </div>
                      </div>

                      {/* PREPARATION */}

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold uppercase tracking-wide text-slate-400">
                            Preparation
                          </span>

                          <span className="font-black text-slate-600">
                            {room.preparation.percentage}%
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            style={{
                              width:
                                `${room.preparation.percentage}%`,
                            }}
                            className="h-full rounded-full bg-blue-600"
                          />
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {room.subjects.map(
                            (
                              subject
                            ) => (
                              <div
                                key={`${room.id}-${subject.index}`}
                                className="flex items-center justify-between gap-3 text-[11px]"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  {subject.generationStatus ===
                                  'ready' ? (
                                    <CheckCircle2
                                      size={
                                        13
                                      }
                                      className="shrink-0 text-emerald-500"
                                    />
                                  ) : subject.generationStatus ===
                                    'generating' ? (
                                    <Loader2
                                      size={
                                        13
                                      }
                                      className="shrink-0 animate-spin text-blue-500"
                                    />
                                  ) : subject.generationStatus ===
                                    'failed' ? (
                                    <AlertCircle
                                      size={
                                        13
                                      }
                                      className="shrink-0 text-red-500"
                                    />
                                  ) : (
                                    <Circle
                                      size={
                                        12
                                      }
                                      className="shrink-0 text-slate-300"
                                    />
                                  )}

                                  <span className="truncate font-semibold text-slate-600">
                                    {subject.subject}
                                  </span>
                                </span>

                                <span className="shrink-0 text-slate-400">
                                  {subject.preparedQuestionCount}/
                                  {subject.questionCount}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users
                            size={
                              12
                            }
                          />
                          Capacity {room.maxParticipants}
                        </span>

                        <span className="flex items-center gap-1">
                          {room.visibility ===
                          'public' ? (
                            <Globe2
                              size={
                                12
                              }
                            />
                          ) : (
                            <Lock
                              size={
                                12
                              }
                            />
                          )}

                          <span className="capitalize">
                            {room.visibility}
                          </span>
                        </span>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
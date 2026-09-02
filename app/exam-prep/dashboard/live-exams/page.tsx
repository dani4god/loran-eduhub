// app/exam-prep/dashboard/live-exams/page.tsx

'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Eye,
  EyeOff,
  FileQuestion,
  Globe2,
  Loader2,
  Lock,
  MonitorUp,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type SubjectCategory = {
  value: string
  label: string
  subjects: string[]
}

type RoomSubject = {
  subject: string
  durationMinutes: number
  questionCount: number
}

type ScreenShareMode =
  | 'off'
  | 'optional'
  | 'required'

type Visibility =
  | 'public'
  | 'private'

type CompetitionRoom = {
  _id?: string
  roomCode: string
  name: string

  instructions?: string

  visibility?: Visibility

  status?:
    | 'preparing'
    | 'lobby'
    | 'active'
    | 'completed'
    | 'cancelled'

  creatorType?: 'student' | 'admin'

  screenShareMode?: ScreenShareMode

  participantCount?: number

  maxParticipants?: number

  subjects?: Array<{
    subject?: string
    name?: string
    durationMinutes?: number
    questionCount?: number
  }>

  createdAt?: string
}

type StudentMe = {
  student?: {
    _id?: string
    fullName?: string
    email?: string
    regNumber?: string
  }

  subscription?: unknown
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_DURATION = 30
const DEFAULT_QUESTION_COUNT = 50

const MAX_SUBJECTS = 6

// ============================================================
// SMALL COMPONENT
// ============================================================

function Spinner({
  size = 18,
}: {
  size?: number
}) {
  return (
    <Loader2
      size={size}
      className="animate-spin"
    />
  )
}

// ============================================================
// PAGE
// ============================================================

export default function ExamArenaPage() {
  const router = useRouter()

  // ----------------------------------------------------------
  // AUTH / INITIAL PAGE
  // ----------------------------------------------------------

  const [checkingSession, setCheckingSession] =
    useState(true)

  const [student, setStudent] =
    useState<StudentMe['student'] | null>(null)

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const [categories, setCategories] =
    useState<SubjectCategory[]>([])

  const [rooms, setRooms] =
    useState<CompetitionRoom[]>([])

  const [loadingRooms, setLoadingRooms] =
    useState(true)

  // ----------------------------------------------------------
  // GENERAL UI
  // ----------------------------------------------------------

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [showCreate, setShowCreate] =
    useState(false)

  const [search, setSearch] =
    useState('')

  // ----------------------------------------------------------
  // JOIN ROOM
  // ----------------------------------------------------------

  const [joinCode, setJoinCode] =
    useState('')

  const [joining, setJoining] =
    useState(false)

  // ----------------------------------------------------------
  // CREATE ROOM
  // ----------------------------------------------------------

  const [roomName, setRoomName] =
    useState('')

  const [instructions, setInstructions] =
    useState('')

  const [visibility, setVisibility] =
    useState<Visibility>('public')

  const [
    screenShareMode,
    setScreenShareMode,
  ] = useState<ScreenShareMode>('off')

  const [selectedSubjects, setSelectedSubjects] =
    useState<RoomSubject[]>([])

  const [creating, setCreating] =
    useState(false)

  // ==========================================================
  // SESSION
  // ==========================================================

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch(
          '/api/exam-prep/me',
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )

        if (cancelled) return

        if (res.status === 401) {
          router.replace(
            '/exam-prep/login'
          )
          return
        }

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error ||
              'Could not verify your Exam Prep account.'
          )
        }

        setStudent(
          data?.student || data
        )
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Could not verify your session.'
          )
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false)
        }
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [router])

  // ==========================================================
  // SUBJECT CATALOG
  // ==========================================================

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch(
          '/api/exam-prep/subjects',
          {
            cache: 'no-store',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error ||
              'Could not load subjects.'
          )
        }

        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        )
      } catch (err) {
        console.error(
          'Arena subject catalog:',
          err
        )
      }
    }

    loadSubjects()
  }, [])

  // ==========================================================
  // LOAD PUBLIC / AVAILABLE ROOMS
  // ==========================================================

  const loadRooms =
    useCallback(async () => {
      setLoadingRooms(true)

      try {
        const res = await fetch(
          '/api/exam-prep/arena',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            router.replace(
              '/exam-prep/login'
            )
            return
          }

          throw new Error(
            data?.error ||
              'Could not load Exam Arena rooms.'
          )
        }

        const foundRooms =
          Array.isArray(data?.rooms)
            ? data.rooms
            : Array.isArray(data)
              ? data
              : []

        setRooms(foundRooms)
      } catch (err: any) {
        setError(
          err?.message ||
            'Could not load Exam Arena rooms.'
        )
      } finally {
        setLoadingRooms(false)
      }
    }, [router])

  useEffect(() => {
    if (!checkingSession) {
      loadRooms()
    }
  }, [
    checkingSession,
    loadRooms,
  ])

  // ==========================================================
  // SUBJECT SELECTION
  // ==========================================================

  const subjectIsSelected = (
    subject: string
  ) =>
    selectedSubjects.some(
      (item) =>
        item.subject === subject
    )

  const toggleSubject = (
    subject: string
  ) => {
    setError('')

    setSelectedSubjects(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.subject ===
              subject
          )

        if (exists) {
          return current.filter(
            (item) =>
              item.subject !==
              subject
          )
        }

        if (
          current.length >=
          MAX_SUBJECTS
        ) {
          setError(
            `You can select up to ${MAX_SUBJECTS} subjects for one competition.`
          )

          return current
        }

        return [
          ...current,
          {
            subject,
            durationMinutes:
              DEFAULT_DURATION,
            questionCount:
              DEFAULT_QUESTION_COUNT,
          },
        ]
      }
    )
  }

  const updateSelectedSubject = (
    subject: string,
    field:
      | 'durationMinutes'
      | 'questionCount',
    value: number
  ) => {
    setSelectedSubjects(
      (current) =>
        current.map(
          (item) => {
            if (
              item.subject !== subject
            ) {
              return item
            }

            if (
              field ===
              'durationMinutes'
            ) {
              return {
                ...item,
                durationMinutes:
                  Math.min(
                    180,
                    Math.max(
                      5,
                      value || 5
                    )
                  ),
              }
            }

            return {
              ...item,
              questionCount:
                Math.min(
                  50,
                  Math.max(
                    10,
                    value || 10
                  )
                ),
            }
          }
        )
    )
  }

  // ==========================================================
  // CREATE ROOM
  // ==========================================================

  const createRoom = async (
    event: FormEvent
  ) => {
    event.preventDefault()

    setError('')
    setMessage('')

    const cleanName =
      roomName.trim()

    if (
      cleanName.length < 3
    ) {
      setError(
        'Enter a competition room name.'
      )
      return
    }

    if (
      selectedSubjects.length ===
      0
    ) {
      setError(
        'Select at least one subject.'
      )
      return
    }

    setCreating(true)

    try {
      const res = await fetch(
        '/api/exam-prep/arena',
        {
          method: 'POST',

          credentials:
            'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: cleanName,

            instructions:
              instructions.trim(),

            visibility,

            screenShareMode,

            subjects:
              selectedSubjects.map(
                (item) => ({
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

      const data =
        await res.json()

      if (!res.ok) {
        if (
          data?.requiresLogin
        ) {
          router.replace(
            '/exam-prep/login'
          )
          return
        }

        if (
          data?.requiresPayment
        ) {
          router.push(
            '/exam-prep/dashboard/subscribe'
          )
          return
        }

        throw new Error(
          data?.error ||
            'Could not create the competition room.'
        )
      }

      const roomCode =
        data?.roomCode ||
        data?.room?.roomCode

      if (!roomCode) {
        throw new Error(
          'The room was created but no room code was returned.'
        )
      }

      router.push(
        `/exam-prep/dashboard/live-exams/${encodeURIComponent(
          roomCode
        )}`
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not create competition.'
      )
    } finally {
      setCreating(false)
    }
  }

  // ==========================================================
  // JOIN ROOM
  // ==========================================================

  const joinRoom = async (
    codeOverride?: string
  ) => {
    setError('')
    setMessage('')

    const code =
      String(
        codeOverride ||
          joinCode
      )
        .trim()
        .toUpperCase()

    if (!code) {
      setError(
        'Enter a room code.'
      )
      return
    }

    setJoining(true)

    try {
      const res = await fetch(
        `/api/exam-prep/arena/${encodeURIComponent(
          code
        )}/join`,
        {
          method: 'POST',
          credentials:
            'include',
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        if (
          data?.requiresLogin
        ) {
          router.replace(
            '/exam-prep/login'
          )
          return
        }

        if (
          data?.requiresPayment
        ) {
          router.push(
            '/exam-prep/dashboard/subscribe'
          )
          return
        }

        throw new Error(
          data?.error ||
            'Could not join this competition.'
        )
      }

      router.push(
        `/exam-prep/dashboard/live-exams/${encodeURIComponent(
          code
        )}`
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not join competition.'
      )
    } finally {
      setJoining(false)
    }
  }

  // ==========================================================
  // COPY CODE
  // ==========================================================

  const copyRoomCode = async (
    roomCode: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        roomCode
      )

      setMessage(
        `Room code ${roomCode} copied.`
      )

      window.setTimeout(
        () => setMessage(''),
        2500
      )
    } catch {
      setError(
        'Could not copy the room code.'
      )
    }
  }

  // ==========================================================
  // FILTER ROOMS
  // ==========================================================

  const filteredRooms =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase()

      if (!term) {
        return rooms
      }

      return rooms.filter(
        (room) =>
          room.name
            ?.toLowerCase()
            .includes(term) ||
          room.roomCode
            ?.toLowerCase()
            .includes(term) ||
          room.subjects?.some(
            (item) =>
              (
                item.subject ||
                item.name ||
                ''
              )
                .toLowerCase()
                .includes(term)
          )
      )
    }, [rooms, search])

  // ==========================================================
  // LOADING
  // ==========================================================

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">

          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Loading Loran Exam Arena...
          </p>

        </div>
      </main>
    )
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="border-b border-white/10 bg-slate-950/95">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

          <div>

            <Link
              href="/exam-prep/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={15} />

              Exam Prep Dashboard
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-950/30">
                <Trophy size={24} />
              </div>

              <div>

                <h1 className="text-2xl font-black sm:text-3xl">
                  Loran Exam Arena
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Create a competition or
                  challenge other students
                  live.
                </p>

              </div>

            </div>

          </div>

          {/* THIS IS THE STUDENT CREATE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setShowCreate(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Plus size={18} />

            Create Competition
          </button>

        </div>

      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* MESSAGES */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError('')
              }
            >
              <X size={16} />
            </button>

          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        {/* ==================================================
            HERO ACTION CARDS
        =================================================== */}

        <section className="grid gap-5 lg:grid-cols-2">

          {/* CREATE */}

          <button
            type="button"
            onClick={() =>
              setShowCreate(true)
            }
            className="group relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600/25 to-purple-600/10 p-6 text-left transition hover:border-indigo-400/50 sm:p-7"
          >

            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative">

              <div className="flex items-start justify-between gap-5">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                  <Crown size={23} />
                </div>

                <ChevronRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />

              </div>

              <h2 className="mt-5 text-xl font-black">
                Create Your Own Live Exam
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                Choose up to six subjects,
                set the time and number of
                questions for each subject,
                invite friends and compete
                live.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-indigo-300">
                <Plus size={16} />

                Create Exam Room
              </div>

            </div>

          </button>

          {/* JOIN */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
              <UserPlus size={22} />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Join With a Room Code
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter the room code shared by
              the competition creator.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">

              <input
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /\s/g,
                        ''
                      )
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    joinRoom()
                  }
                }}
                placeholder="ENTER ROOM CODE"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono text-sm font-bold uppercase text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <button
                onClick={() =>
                  joinRoom()
                }
                disabled={
                  joining ||
                  !joinCode.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joining ? (
                  <Spinner size={16} />
                ) : (
                  <Users size={16} />
                )}

                Join
              </button>

            </div>

          </div>

        </section>

        {/* ==================================================
            HOW ARENA WORKS
        =================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              icon: (
                <BookOpen size={19} />
              ),
              title:
                'Multiple Subjects',
              text:
                'Physics, Chemistry, Mathematics and other senior secondary subjects.',
            },

            {
              icon: (
                <Clock size={19} />
              ),
              title:
                'Timed Rounds',
              text:
                'Each subject runs as a synchronized timed round for everyone.',
            },

            {
              icon: (
                <Sparkles size={19} />
              ),
              title:
                'AI Questions',
              text:
                'Competition questions can use mixed WAEC, NECO, JAMB and IGCSE standards.',
            },

            {
              icon: (
                <Trophy size={19} />
              ),
              title:
                'Live Ranking',
              text:
                'Scores are compared and the overall winner emerges after all rounds.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-indigo-300">
                {item.icon}
              </div>

              <p className="mt-4 text-sm font-black">
                {item.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {item.text}
              </p>

            </div>
          ))}

        </section>

        {/* ==================================================
            AVAILABLE ROOMS
        =================================================== */}

        <section>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                Competition Lobby
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Available Exam Rooms
              </h2>

            </div>

            <div className="flex gap-2">

              <div className="relative">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search rooms..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-60"
                />

              </div>

              <button
                onClick={loadRooms}
                disabled={loadingRooms}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08]"
              >
                <RefreshCcw
                  size={16}
                  className={
                    loadingRooms
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>

            </div>

          </div>

          {loadingRooms ? (
            <div className="flex min-h-52 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">

              <div className="text-center">

                <Spinner size={28} />

                <p className="mt-3 text-sm text-slate-500">
                  Loading competition
                  rooms...
                </p>

              </div>

            </div>
          ) : filteredRooms.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
                <Trophy size={25} />
              </div>

              <h3 className="mt-4 text-lg font-black">
                No active competitions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Be the first student to
                create an Exam Arena room
                and invite others to
                compete.
              </p>

              <button
                onClick={() =>
                  setShowCreate(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black transition hover:bg-indigo-500"
              >
                <Plus size={17} />

                Create First Competition
              </button>

            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">

              {filteredRooms.map(
                (room) => {
                  const subjects =
                    Array.isArray(
                      room.subjects
                    )
                      ? room.subjects
                      : []

                  const participantCount =
                    Number(
                      room.participantCount ||
                        0
                    )

                  return (
                    <article
                      key={
                        room._id ||
                        room.roomCode
                      }
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-400/30 sm:p-6"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-300">
                              {room.creatorType ===
                              'admin'
                                ? 'Official'
                                : 'Student Room'}
                            </span>

                            {room.visibility ===
                            'private' ? (
                              <Lock
                                size={
                                  13
                                }
                                className="text-amber-400"
                              />
                            ) : (
                              <Globe2
                                size={
                                  13
                                }
                                className="text-green-400"
                              />
                            )}

                          </div>

                          <h3 className="mt-3 text-lg font-black">
                            {room.name}
                          </h3>

                          <button
                            onClick={() =>
                              copyRoomCode(
                                room.roomCode
                              )
                            }
                            className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500 transition hover:text-white"
                          >
                            {room.roomCode}

                            <Copy
                              size={12}
                            />
                          </button>

                        </div>

                        <div className="rounded-xl bg-white/5 px-3 py-2 text-center">

                          <Users
                            size={15}
                            className="mx-auto text-blue-300"
                          />

                          <p className="mt-1 text-xs font-bold">
                            {
                              participantCount
                            }
                          </p>

                        </div>

                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">

                        {subjects.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={`${room.roomCode}-${index}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300"
                            >
                              {item.subject ||
                                item.name ||
                                'Subject'}
                            </span>
                          )
                        )}

                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs text-slate-500">

                        <span className="inline-flex items-center gap-1.5">

                          <FileQuestion
                            size={13}
                          />

                          {
                            subjects.length
                          }{' '}
                          subject
                          {subjects.length ===
                          1
                            ? ''
                            : 's'}

                        </span>

                        {room.screenShareMode &&
                          room.screenShareMode !==
                            'off' && (
                            <span className="inline-flex items-center gap-1.5">

                              <MonitorUp
                                size={
                                  13
                                }
                              />

                              Screen share{' '}
                              {
                                room.screenShareMode
                              }

                            </span>
                          )}

                      </div>

                      <button
                        onClick={() =>
                          joinRoom(
                            room.roomCode
                          )
                        }
                        disabled={
                          joining
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-black transition hover:bg-indigo-600"
                      >
                        Enter Competition

                        <ChevronRight
                          size={16}
                        />
                      </button>

                    </article>
                  )
                }
              )}

            </div>
          )}

        </section>

      </div>

      {/* ======================================================
          CREATE COMPETITION MODAL
      ======================================================= */}

      {showCreate && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">

          <div className="mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-7">

              <div>

                <div className="flex items-center gap-2 text-indigo-300">

                  <Trophy size={18} />

                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    New Exam Arena
                  </span>

                </div>

                <h2 className="mt-2 text-2xl font-black">
                  Create Live Competition
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure the exam.
                  Everyone who joins will
                  receive the same question
                  set and synchronized
                  rounds.
                </p>

              </div>

              <button
                onClick={() =>
                  !creating &&
                  setShowCreate(false)
                }
                className="rounded-xl bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={createRoom}
              className="space-y-8 p-5 sm:p-7"
            >

              {/* ROOM DETAILS */}

              <div className="grid gap-5 md:grid-cols-2">

                <label className="block">

                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Competition Name
                  </span>

                  <input
                    value={roomName}
                    onChange={(event) =>
                      setRoomName(
                        event.target
                          .value
                      )
                    }
                    required
                    maxLength={100}
                    placeholder="e.g. Science Champions Arena"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />

                </label>

                <label className="block">

                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Visibility
                  </span>

                  <select
                    value={visibility}
                    onChange={(
                      event
                    ) =>
                      setVisibility(
                        event.target
                          .value as Visibility
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="public">
                      Public — anyone can
                      discover it
                    </option>

                    <option value="private">
                      Private — room code
                      required
                    </option>

                  </select>

                </label>

              </div>

              {/* INSTRUCTIONS */}

              <label className="block">

                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Competition Instructions
                </span>

                <textarea
                  value={instructions}
                  onChange={(event) =>
                    setInstructions(
                      event.target.value
                    )
                  }
                  rows={3}
                  maxLength={1000}
                  placeholder="Optional rules or instructions for participants..."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

              </label>

              {/* SCREEN SHARING */}

              <div>

                <div className="flex items-center gap-2">

                  <MonitorUp
                    size={17}
                    className="text-indigo-300"
                  />

                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Screen Sharing
                  </p>

                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">

                  {[
                    {
                      value:
                        'off' as ScreenShareMode,

                      title:
                        'Not Required',

                      description:
                        'Participants do not need to share their screen.',

                      icon: EyeOff,
                    },

                    {
                      value:
                        'optional' as ScreenShareMode,

                      title:
                        'Optional',

                      description:
                        'Students may share their screen if they choose.',

                      icon: Eye,
                    },

                    {
                      value:
                        'required' as ScreenShareMode,

                      title:
                        'Required',

                      description:
                        'Question interface locks until screen sharing is active.',

                      icon: ShieldCheck,
                    },
                  ].map(
                    (option) => {
                      const Icon =
                        option.icon

                      const active =
                        screenShareMode ===
                        option.value

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setScreenShareMode(
                              option.value
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <Icon
                              size={18}
                              className={
                                active
                                  ? 'text-indigo-300'
                                  : 'text-slate-500'
                              }
                            />

                            {active && (
                              <Check
                                size={
                                  16
                                }
                                className="text-green-400"
                              />
                            )}

                          </div>

                          <p className="mt-3 text-sm font-black">
                            {
                              option.title
                            }
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {
                              option.description
                            }
                          </p>

                        </button>
                      )
                    }
                  )}

                </div>

              </div>

              {/* SUBJECT CATALOG */}

              <div>

                <div className="flex flex-wrap items-end justify-between gap-3">

                  <div>

                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Competition Subjects
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Select 1–
                      {MAX_SUBJECTS}{' '}
                      subjects.
                    </p>

                  </div>

                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-300">
                    {
                      selectedSubjects.length
                    }
                    /
                    {MAX_SUBJECTS}{' '}
                    selected
                  </span>

                </div>

                <div className="mt-5 space-y-5">

                  {categories.map(
                    (category) => (
                      <div
                        key={
                          category.value
                        }
                      >

                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                          {
                            category.label
                          }
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {Array.isArray(
                            category.subjects
                          ) &&
                            category.subjects.map(
                              (
                                subject
                              ) => {
                                const active =
                                  subjectIsSelected(
                                    subject
                                  )

                                return (
                                  <button
                                    key={
                                      subject
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleSubject(
                                        subject
                                      )
                                    }
                                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                      active
                                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200'
                                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                                    }`}
                                  >
                                    {
                                      subject
                                    }
                                  </button>
                                )
                              }
                            )}

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* CONFIGURE SELECTED SUBJECTS */}

              {selectedSubjects.length >
                0 && (
                <div>

                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Configure Each Round
                  </p>

                  <div className="mt-3 space-y-3">

                    {selectedSubjects.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.subject
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >

                          <div className="flex items-center justify-between gap-4">

                            <div className="flex min-w-0 items-center gap-3">

                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-xs font-black text-indigo-300">
                                {
                                  index +
                                  1
                                }
                              </span>

                              <p className="truncate text-sm font-black">
                                {
                                  item.subject
                                }
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleSubject(
                                  item.subject
                                )
                              }
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <X
                                size={
                                  15
                                }
                              />
                            </button>

                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">

                            <label>

                              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">

                                <Clock
                                  size={
                                    12
                                  }
                                />

                                Minutes

                              </span>

                              <input
                                type="number"
                                min={
                                  5
                                }
                                max={
                                  180
                                }
                                value={
                                  item.durationMinutes
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSelectedSubject(
                                    item.subject,
                                    'durationMinutes',
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                                }
                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                              />

                            </label>

                            <label>

                              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">

                                <FileQuestion
                                  size={
                                    12
                                  }
                                />

                                Questions

                              </span>

                              <input
                                type="number"
                                min={
                                  10
                                }
                                max={
                                  50
                                }
                                value={
                                  item.questionCount
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSelectedSubject(
                                    item.subject,
                                    'questionCount',
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                                }
                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                              />

                            </label>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* INFO */}

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">

                <div className="flex gap-3">

                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />

                  <div>

                    <p className="text-sm font-black text-blue-100">
                      How questions are
                      prepared
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-200/70">
                      Loran Exam Arena
                      prepares one stored
                      question pack for
                      every subject. Every
                      participant receives
                      the same questions.
                      Competition questions
                      are generated to match
                      mixed WAEC, NECO,
                      JAMB and IGCSE
                      standards.
                    </p>

                  </div>

                </div>

              </div>

              {/* SUBMIT */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={creating}
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    selectedSubjects.length ===
                      0 ||
                    !roomName.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Spinner
                        size={
                          16
                        }
                      />

                      Creating Room...
                    </>
                  ) : (
                    <>
                      <Trophy
                        size={
                          17
                        }
                      />

                      Create Competition
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  )
}
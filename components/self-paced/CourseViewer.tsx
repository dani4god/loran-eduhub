// components/self-paced/CourseViewer.tsx

'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import SelfPacedContent from '@/components/self-paced/SelfPacedContent'
import AIStudyAssistant from '@/components/self-paced/AIStudyAssistant'

import {
  Lock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
  BookOpen,
} from 'lucide-react'

interface CourseViewerProps {
  courseId: string
}

interface CourseLink {
  label: string
  url: string
}

interface CoursePage {
  _id: string
  title: string
  content: string
  links?: CourseLink[]
}

interface CourseQuestion {
  _id: string
  type: 'mcq' | 'fill' | 'trueFalse'
  question: string
  options?: string[]
}

interface CourseWeek {
  weekNumber: number
  title: string
  locked: boolean
  pages: CoursePage[]
  durationMinutes: number | null
  questionCount: number
  passed: boolean
  lastScore: number | null
  attemptsUsed: number
  questions: CourseQuestion[]
}

interface WeeklyWorkshop {
  enabled: boolean
  dayOfWeek?: string
  time?: string
  description?: string
}

interface CourseData {
  courseId: string
  title: string
  tutorName: string
  coachingEnabled: boolean
  coachingHourlyRate: number
  discordEnabled: boolean
  discordDescription: string
  weeklyWorkshop?: WeeklyWorkshop
  weeks: CourseWeek[]
  unlockedWeek: number
  isComplete: boolean

  /*
   * Kept optional for compatibility in case another version
   * of the content endpoint returns a course-level lock.
   */
  locked?: boolean
}

interface ExamResult {
  percentage: number
  score: number
  total: number
  passed: boolean
  passMark: number
  attemptsRemaining: number
  error?: string
}

export default function CourseViewer({
  courseId,
}: CourseViewerProps) {
  const router = useRouter()

  const [data, setData] = useState<CourseData | null>(null)

  const [activeWeek, setActiveWeek] = useState<number | null>(
    null
  )

  const [activePage, setActivePage] = useState(0)

  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState('')

  const [inExam, setInExam] = useState(false)

  const [answers, setAnswers] = useState<
    Record<string, string>
  >({})

  const [secondsLeft, setSecondsLeft] = useState(0)

  const [submitting, setSubmitting] = useState(false)

  const [result, setResult] = useState<ExamResult | null>(
    null
  )

  const contentRef = useRef<HTMLDivElement>(null)

  const submitLockRef = useRef(false)

  // ==========================================================
  // LOAD COURSE
  // ==========================================================

  const load = useCallback(async () => {
    try {
      setLoadError('')

      const response = await fetch(
        `/api/self-paced/courses/${courseId}/content`,
        {
          cache: 'no-store',
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(
          responseData?.error || 'Unable to load this course.'
        )
      }

      const courseData = responseData as CourseData

      setData(courseData)

      setActiveWeek((currentWeek) => {
        /*
         * Initial course load:
         * open the highest currently unlocked week.
         */
        if (currentWeek === null) {
          return courseData.unlockedWeek
        }

        /*
         * If the selected week still exists and remains
         * accessible, preserve the student's position.
         */
        const existingWeek = courseData.weeks.find(
          (current) =>
            current.weekNumber === currentWeek
        )

        if (existingWeek && !existingWeek.locked) {
          return currentWeek
        }

        return courseData.unlockedWeek
      })
    } catch (error) {
      console.error(
        'Failed to load self-paced course:',
        error
      )

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load this course.'
      )
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  // ==========================================================
  // CURRENT WEEK / PAGE
  // ==========================================================

  const week = data?.weeks?.find(
    (currentWeek) =>
      currentWeek.weekNumber === activeWeek
  )

  const page = week?.pages?.[activePage]

  const isLastPage =
    !!week &&
    week.pages.length > 0 &&
    activePage === week.pages.length - 1

  /*
   * Your current content endpoint does not return a top-level
   * "locked" property, so default this to false.
   *
   * Individual future weeks are still protected by
   * currentWeek.locked.
   */
  const isLocked = data?.locked ?? false

  // ==========================================================
  // KEEP PAGE INDEX VALID
  // ==========================================================

  useEffect(() => {
    if (!week) {
      return
    }

    if (week.pages.length === 0) {
      if (activePage !== 0) {
        setActivePage(0)
      }

      return
    }

    if (activePage >= week.pages.length) {
      setActivePage(0)
    }
  }, [week, activePage])

  // ==========================================================
  // SCROLL TO CONTENT
  // ==========================================================

  useEffect(() => {
    contentRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    })
  }, [
    activeWeek,
    activePage,
    inExam,
    result,
  ])

  // ==========================================================
  // START EXAM
  // ==========================================================

  const startExam = () => {
    if (!week) {
      return
    }

    if (
      week.durationMinutes === null ||
      week.durationMinutes <= 0
    ) {
      alert('This exam does not have a valid duration.')
      return
    }

    if (!week.questions?.length) {
      alert('This exam does not contain any questions yet.')
      return
    }

    submitLockRef.current = false

    setAnswers({})
    setResult(null)

    setSecondsLeft(
      week.durationMinutes * 60
    )

    setInExam(true)
  }

  // ==========================================================
  // SUBMIT EXAM
  // ==========================================================

  const submitExam = useCallback(async () => {
    if (
      submitLockRef.current ||
      submitting ||
      activeWeek === null
    ) {
      return
    }

    submitLockRef.current = true
    setSubmitting(true)

    try {
      const response = await fetch(
        `/api/self-paced/courses/${courseId}/weeks/${activeWeek}/submit-exam`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            answers,
          }),
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        alert(
          responseData?.error ||
            'Failed to submit the exam. Please try again.'
        )

        submitLockRef.current = false
        return
      }

      setResult(responseData as ExamResult)
      setInExam(false)

      await load()
    } catch (error) {
      console.error(
        'Failed to submit self-paced exam:',
        error
      )

      alert(
        'Something went wrong while submitting your exam. Please try again.'
      )

      submitLockRef.current = false
    } finally {
      setSubmitting(false)
    }
  }, [
    activeWeek,
    answers,
    courseId,
    load,
    submitting,
  ])

  // ==========================================================
  // EXAM TIMER
  // ==========================================================

  useEffect(() => {
    if (!inExam) {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer)

          void submitExam()

          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [inExam, submitExam])

  // ==========================================================
  // DOWNLOAD CERTIFICATE
  // ==========================================================

  const downloadCert = async () => {
    try {
      const response = await fetch(
        `/api/self-paced/courses/${courseId}/certificate`
      )

      if (response.status === 400) {
        const responseData = await response.json()

        if (responseData.reviewRequired) {
          router.push(
            `/dashboard/self-paced/course/${courseId}/review`
          )

          return
        }

        alert(
          responseData.error ||
            'Could not download certificate'
        )

        return
      }

      if (!response.ok) {
        alert(
          'Failed to download certificate. Please try again.'
        )

        return
      }

      const blob = await response.blob()

      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = 'Certificate.pdf'

      document.body.appendChild(anchor)

      anchor.click()

      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(
        'Certificate download failed:',
        error
      )

      alert(
        'Something went wrong downloading your certificate.'
      )
    }
  }

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const fmt = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(
      seconds % 60
    )
      .toString()
      .padStart(2, '0')}`

  // ==========================================================
  // SELECT WEEK
  // ==========================================================

  const selectWeek = (selectedWeek: CourseWeek) => {
    if (selectedWeek.locked) {
      return
    }

    setActiveWeek(selectedWeek.weekNumber)
    setActivePage(0)
    setInExam(false)
    setResult(null)
    setAnswers({})
    setSecondsLeft(0)
    submitLockRef.current = false
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center lg:min-h-screen">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-3 text-xs text-gray-400">
            Loading course...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // LOAD ERROR
  // ==========================================================

  if (loadError || !data) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 lg:min-h-screen">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />

          <h2 className="text-lg font-bold text-gray-900">
            Unable to load course
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {loadError ||
              'The course could not be loaded.'}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void load()
            }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-gray-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row">

          {/* =================================================
              WEEK NAVIGATION
          ================================================== */}

          <aside className="shrink-0 space-y-1 lg:w-64">
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Self-paced course
              </p>

              <h2 className="text-sm font-bold leading-5 text-gray-900">
                {data.title}
              </h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {data.weeks.map((currentWeek) => (
                <button
                  type="button"
                  key={currentWeek.weekNumber}
                  onClick={() =>
                    selectWeek(currentWeek)
                  }
                  disabled={currentWeek.locked}
                  className={`flex min-w-[190px] items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition lg:w-full lg:min-w-0 ${
                    activeWeek ===
                    currentWeek.weekNumber
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 lg:bg-transparent'
                  } ${
                    currentWeek.locked
                      ? 'cursor-not-allowed opacity-40'
                      : ''
                  }`}
                >
                  {currentWeek.locked ? (
                    <Lock size={13} />
                  ) : currentWeek.passed ? (
                    <CheckCircle2
                      size={13}
                      className="shrink-0 text-green-500"
                    />
                  ) : (
                    <Clock
                      size={13}
                      className="shrink-0 text-gray-300"
                    />
                  )}

                  <span className="truncate">
                    Week {currentWeek.weekNumber}:{' '}
                    {currentWeek.title}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* =================================================
              MAIN
          ================================================== */}

          <main className="min-w-0 flex-1">

            {/* COURSE COMPLETE */}

            {!isLocked && data.isComplete && (
              <div className="mb-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-5 text-center sm:flex-row sm:text-left">
                <div>
                  <p className="text-sm font-bold text-green-800">
                    🎉 Course Complete!
                  </p>

                  <p className="text-xs text-green-600">
                    You've passed every week. Your
                    certificate is ready.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadCert}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <Download size={15} />

                  Download Certificate
                </button>
              </div>
            )}

            {/* =================================================
                COURSE LOCKED
            ================================================== */}

            {isLocked ? (
              <div className="rounded-2xl border-2 border-red-100 bg-white p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />

                <h3 className="mb-2 font-bold text-gray-900">
                  Course Locked
                </h3>

                <p className="mx-auto mb-4 max-w-sm text-sm text-gray-500">
                  You've used all 3 attempts on this
                  week's exam without reaching 70%. Book
                  a coaching session with your tutor to
                  have this course unlocked.
                </p>

                {data.coachingEnabled && (
                  <Link
                    href={`/dashboard/self-paced/course/${courseId}/book`}
                    className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Book a Session
                  </Link>
                )}
              </div>
            ) : week ? (
              <div
                ref={contentRef}
                className="max-w-full overflow-x-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-7"
              >

                {/* =============================================
                    LESSON
                ============================================== */}

                {!inExam &&
                  !result &&
                  page && (
                    <>
                      {/* PAGE META */}

                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-blue-600">
                          Page {activePage + 1} of{' '}
                          {week.pages.length}
                        </p>

                        <div className="hidden items-center gap-1 text-[10px] font-medium text-indigo-600 sm:flex">
                          <Sparkles size={11} />

                          Loran AI available
                        </div>
                      </div>

                      {/* TITLE */}

                      <h1 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
                        {page.title}
                      </h1>

                      {/* AI INFO CARD */}

                      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 sm:p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                          <Bot size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 sm:text-sm">
                            Need help understanding this
                            lesson?
                          </p>

                          <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:text-xs">
                            Loran AI knows the lesson
                            you're reading. Use the{' '}
                            <strong className="text-blue-700">
                              Ask Loran AI
                            </strong>{' '}
                            button to get explanations,
                            examples, summaries or a
                            practice quiz.
                          </p>
                        </div>
                      </div>

                      {/* CONTENT */}

                      <div className="mb-6">
                        <SelfPacedContent
                          html={page.content}
                        />
                      </div>

                      {/* LINKS */}

                      {!!page.links?.length && (
                        <div className="mb-6 flex flex-wrap gap-2">
                          {page.links.map(
                            (link, index) => (
                              <a
                                key={`${link.url}-${index}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                              >
                                <ExternalLink
                                  size={13}
                                  className="shrink-0"
                                />

                                <span className="truncate">
                                  {link.label}
                                </span>
                              </a>
                            )
                          )}
                        </div>
                      )}

                      {/* COACHING */}

                      {data.coachingEnabled && (
                        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-purple-100 bg-purple-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs leading-5 text-purple-700">
                            Finding this concept difficult
                            even after using the AI study
                            assistant? Book a one-on-one
                            session with{' '}
                            <strong>
                              {data.tutorName}
                            </strong>
                            .
                          </p>

                          <Link
                            href={`/dashboard/self-paced/course/${courseId}/book`}
                            className="shrink-0 self-start rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 sm:self-auto"
                          >
                            Book Session
                          </Link>
                        </div>
                      )}

                      {/* NAVIGATION */}

                      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePage(
                              (current) =>
                                Math.max(
                                  0,
                                  current - 1
                                )
                            )
                          }
                          disabled={activePage === 0}
                          className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 sm:justify-start"
                        >
                          <ChevronLeft size={15} />

                          Previous
                        </button>

                        {!isLastPage ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePage(
                                (current) =>
                                  current + 1
                              )
                            }
                            className="flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                          >
                            Next Page

                            <ChevronRight size={15} />
                          </button>
                        ) : week.passed ? (
                          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                            <CheckCircle2 size={15} />

                            Passed with{' '}
                            {week.lastScore}%
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={startExam}
                            disabled={
                              !week.durationMinutes ||
                              week.questions.length === 0
                            }
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Start Week{' '}
                            {week.weekNumber} Exam (
                            {week.durationMinutes ?? 0}{' '}
                            min, {week.questionCount}{' '}
                            questions)
                          </button>
                        )}
                      </div>
                    </>
                  )}

                {/* NO LESSON PAGES */}

                {!inExam &&
                  !result &&
                  !page && (
                    <div className="py-12 text-center">
                      <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />

                      <h2 className="font-bold text-gray-900">
                        No lesson page available
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                        This week does not currently have
                        lesson content available.
                      </p>

                      {!week.passed &&
                        week.questions.length > 0 &&
                        !!week.durationMinutes && (
                          <button
                            type="button"
                            onClick={startExam}
                            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                          >
                            Start Week{' '}
                            {week.weekNumber} Exam
                          </button>
                        )}
                    </div>
                  )}

                {/* =============================================
                    EXAM
                ============================================== */}

                {inExam && (
                  <div>
                    <div className="sticky top-14 z-10 mb-5 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/95 pb-3 pt-1 backdrop-blur lg:top-0">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          Assessment
                        </p>

                        <h2 className="truncate font-bold text-gray-900">
                          {week.title} — Exam
                        </h2>
                      </div>

                      <span
                        className={`shrink-0 font-mono text-lg font-bold ${
                          secondsLeft < 60
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {fmt(secondsLeft)}
                      </span>
                    </div>

                    {/* AI DISABLED NOTICE */}

                    <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <Lock
                        size={14}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <p className="text-xs leading-5 text-amber-700">
                        Loran AI is unavailable while an
                        exam is in progress. You can use
                        the study assistant again after
                        submitting your assessment.
                      </p>
                    </div>

                    {/* QUESTIONS */}

                    <div className="space-y-5">
                      {week.questions.map(
                        (question, index) => (
                          <div
                            key={question._id}
                            className="rounded-xl bg-gray-50 p-4 sm:p-5"
                          >
                            <p className="mb-3 text-sm font-semibold leading-6 text-gray-800">
                              {index + 1}.{' '}
                              {question.question}
                            </p>

                            {question.type ===
                              'mcq' &&
                              question.options?.map(
                                (
                                  option,
                                  optionIndex
                                ) => (
                                  <label
                                    key={`${question._id}-${optionIndex}`}
                                    className={`mb-1.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                                      answers[
                                        question._id
                                      ] === option
                                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                                        : 'border-transparent text-gray-700 hover:bg-white'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={
                                        question._id
                                      }
                                      checked={
                                        answers[
                                          question._id
                                        ] === option
                                      }
                                      onChange={() =>
                                        setAnswers(
                                          (
                                            currentAnswers
                                          ) => ({
                                            ...currentAnswers,

                                            [question._id]:
                                              option,
                                          })
                                        )
                                      }
                                      className="mt-0.5 shrink-0"
                                    />

                                    <span>
                                      {option}
                                    </span>
                                  </label>
                                )
                              )}

                            {question.type ===
                              'trueFalse' &&
                              [
                                'true',
                                'false',
                              ].map((value) => (
                                <label
                                  key={value}
                                  className={`mb-1.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm capitalize transition ${
                                    answers[
                                      question._id
                                    ] === value
                                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                                      : 'border-transparent text-gray-700 hover:bg-white'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={
                                      question._id
                                    }
                                    checked={
                                      answers[
                                        question._id
                                      ] === value
                                    }
                                    onChange={() =>
                                      setAnswers(
                                        (
                                          currentAnswers
                                        ) => ({
                                          ...currentAnswers,

                                          [question._id]:
                                            value,
                                        })
                                      )
                                    }
                                  />

                                  {value}
                                </label>
                              ))}

                            {question.type ===
                              'fill' && (
                              <input
                                value={
                                  answers[
                                    question._id
                                  ] || ''
                                }
                                onChange={(event) =>
                                  setAnswers(
                                    (
                                      currentAnswers
                                    ) => ({
                                      ...currentAnswers,

                                      [question._id]:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                placeholder="Type your answer..."
                              />
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-400">
                        Answer as many questions as
                        possible before the timer reaches
                        zero.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          void submitExam()
                        }
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting && (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        )}

                        {submitting
                          ? 'Submitting...'
                          : 'Submit Exam'}
                      </button>
                    </div>
                  </div>
                )}

                {/* =============================================
                    RESULT
                ============================================== */}

                {result && !inExam && (
                  <div
                    className={`rounded-xl p-5 sm:p-6 ${
                      result.passed
                        ? 'border border-green-100 bg-green-50'
                        : 'border border-orange-100 bg-orange-50'
                    }`}
                  >
                    <div className="mb-4 text-center">
                      <p className="mb-1 text-3xl font-bold">
                        {result.percentage}%
                      </p>

                      <p className="text-xs text-gray-500">
                        You scored {result.score} out of{' '}
                        {result.total}
                      </p>

                      <p
                        className={`mt-2 text-sm font-semibold ${
                          result.passed
                            ? 'text-green-700'
                            : 'text-orange-700'
                        }`}
                      >
                        {result.passed
                          ? '🎉 Passed!'
                          : `Not quite — you need ${result.passMark}% to pass`}
                      </p>
                    </div>

                    {/* PASSED */}

                    {result.passed && (
                      <div className="rounded-xl border border-green-100 bg-white p-4 text-center">
                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />

                        <p className="text-sm font-semibold text-gray-800">
                          Week {activeWeek} completed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Your progress has been saved.
                          You can continue to the next
                          unlocked week.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            const nextWeek =
                              data.weeks.find(
                                (currentWeek) =>
                                  currentWeek.weekNumber ===
                                  (activeWeek || 0) +
                                    1
                              )

                            if (
                              nextWeek &&
                              !nextWeek.locked
                            ) {
                              selectWeek(nextWeek)
                            } else {
                              setResult(null)
                              setActivePage(0)
                            }
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Continue

                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}

                    {/* FAILED */}

                    {!result.passed && (
                      <div className="space-y-3 rounded-lg bg-white p-4">
                        <p className="text-sm font-medium text-gray-700">
                          Here's what to do next:
                        </p>

                        <ol className="list-decimal space-y-2 pl-4 text-xs leading-5 text-gray-600">
                          <li>
                            Go back and restudy{' '}
                            <strong>
                              Week {activeWeek}
                            </strong>
                            .
                          </li>

                          <li>
                            Use Loran AI while reviewing
                            the lesson to ask about
                            concepts you don't understand.
                          </li>

                          <li>
                            Make sure you understand each
                            page before retaking the exam.
                            You need{' '}
                            <strong>
                              {result.passMark}%
                            </strong>{' '}
                            to unlock Week{' '}
                            {(activeWeek || 0) + 1}.
                          </li>

                          {data.coachingEnabled && (
                            <li>
                              Still stuck? Book a
                              one-on-one session with{' '}
                              <strong>
                                {data.tutorName}
                              </strong>
                              .
                            </li>
                          )}
                        </ol>

                        {result.attemptsRemaining > 0 ? (
                          <p className="text-xs font-semibold text-orange-600">
                            {result.attemptsRemaining}{' '}
                            attempt
                            {result.attemptsRemaining !==
                            1
                              ? 's'
                              : ''}{' '}
                            remaining
                          </p>
                        ) : (
                          <p className="text-xs font-semibold text-red-600">
                            No attempts remaining — this
                            course is now locked. You'll
                            need to book a session with
                            your tutor to unlock it.
                          </p>
                        )}

                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage(0)
                              setResult(null)
                              setAnswers({})
                              setSecondsLeft(0)

                              submitLockRef.current =
                                false
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white"
                          >
                            <BookOpenIcon />

                            Restudy Week {activeWeek}
                          </button>

                          {data.coachingEnabled && (
                            <Link
                              href={`/dashboard/self-paced/course/${courseId}/book`}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white"
                            >
                              Book a Session with{' '}
                              {data.tutorName}
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-amber-500" />

                <h3 className="font-bold text-gray-900">
                  Week unavailable
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  We couldn't find the selected week.
                </p>
              </div>
            )}

            {/* =================================================
                COMMUNITY / WORKSHOP
            ================================================== */}

            {!isLocked && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {data.discordEnabled && (
                  <div className="min-w-0 flex-1 rounded-xl bg-indigo-50 p-4 sm:min-w-[200px]">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-indigo-700">
                      <MessageSquare size={12} />

                      Community
                    </p>

                    <p className="mb-2 text-xs leading-5 text-indigo-600">
                      {data.discordDescription}
                    </p>

                    <Link
                      href="/dashboard/self-paced/discord"
                      className="text-xs font-bold text-indigo-700 underline"
                    >
                      Connect your Discord account →
                    </Link>
                  </div>
                )}

                {data.weeklyWorkshop?.enabled && (
                  <div className="min-w-0 flex-1 rounded-xl bg-purple-50 p-4 sm:min-w-[200px]">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-purple-700">
                      <Calendar size={12} />

                      Free Weekly Workshop
                    </p>

                    <p className="text-xs leading-5 text-purple-600">
                      {data.weeklyWorkshop.dayOfWeek}{' '}
                      {data.weeklyWorkshop.time}{' '}
                      {data.weeklyWorkshop.description
                        ? `— ${data.weeklyWorkshop.description}`
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =====================================================
          AI STUDY ASSISTANT

          Only mounted while the student is actively reading
          a lesson. It is removed during exams and result view.
      ====================================================== */}

      {!isLocked &&
        !inExam &&
        !result &&
        week &&
        page &&
        page._id && (
          <AIStudyAssistant
            key={`${courseId}-${week.weekNumber}-${page._id}`}
            courseId={courseId}
            courseTitle={data.title}
            weekNumber={week.weekNumber}
            weekTitle={week.title}
            pageId={page._id}
            pageTitle={page.title}
          />
        )}
    </>
  )
}

// ============================================================
// SMALL LOCAL ICON
// ============================================================

function BookOpenIcon() {
  return <BookOpen size={13} />
}
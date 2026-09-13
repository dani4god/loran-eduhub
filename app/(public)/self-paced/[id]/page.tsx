// app/(public)/self-paced/[id]/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CoursePublicReviews from '@/components/self-paced/CoursePublicReviews'
import PreviewVideoEmbed from '@/components/self-paced/PreviewVideoEmbed'

import {
  Layers,
  MessageSquare,
  Calendar,
  User,
  Play,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'

// ============================================================
// DESCRIPTION TYPES
// ============================================================

type DescriptionBlock =
  | {
      type: 'paragraph'
      content: string
    }
  | {
      type: 'bullet-list'
      items: string[]
    }
  | {
      type: 'number-list'
      items: string[]
    }
  | {
      type: 'heading'
      content: string
    }

// ============================================================
// DESCRIPTION HELPERS
// ============================================================

function cleanDescriptionText(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
}

function parseDescription(
  description: unknown
): DescriptionBlock[] {
  const text = cleanDescriptionText(description)

  if (!text) {
    return []
  }

  const lines = text.split('\n')
  const blocks: DescriptionBlock[] = []

  let paragraphLines: string[] = []
  let bulletItems: string[] = []
  let numberItems: string[] = []

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return
    }

    blocks.push({
      type: 'paragraph',
      content: paragraphLines.join(' ').trim(),
    })

    paragraphLines = []
  }

  const flushBullets = () => {
    if (!bulletItems.length) {
      return
    }

    blocks.push({
      type: 'bullet-list',
      items: [...bulletItems],
    })

    bulletItems = []
  }

  const flushNumbers = () => {
    if (!numberItems.length) {
      return
    }

    blocks.push({
      type: 'number-list',
      items: [...numberItems],
    })

    numberItems = []
  }

  const flushLists = () => {
    flushBullets()
    flushNumbers()
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushLists()
      return
    }

    // Bullet:
    // - Item
    // * Item
    // • Item
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)

    if (bulletMatch) {
      flushParagraph()
      flushNumbers()

      bulletItems.push(bulletMatch[1].trim())
      return
    }

    // Numbered:
    // 1. Item
    // 2) Item
    const numberMatch = line.match(/^\d+[.)]\s+(.+)$/)

    if (numberMatch) {
      flushParagraph()
      flushBullets()

      numberItems.push(numberMatch[1].trim())
      return
    }

    // Headings such as:
    // What You Will Learn:
    // COURSE OBJECTIVES
    const looksLikeHeading =
      line.length <= 80 &&
      (
        line.endsWith(':') ||
        (
          line === line.toUpperCase() &&
          line.length >= 4 &&
          /[A-Z]/.test(line)
        )
      )

    if (looksLikeHeading) {
      flushParagraph()
      flushLists()

      blocks.push({
        type: 'heading',
        content: line.replace(/:$/, ''),
      })

      return
    }

    flushLists()
    paragraphLines.push(line)
  })

  flushParagraph()
  flushLists()

  return blocks
}

function getDescriptionPreview(
  description: unknown,
  maxLength = 210
) {
  const text = cleanDescriptionText(description)
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) {
    return 'Explore this self-paced course and learn through carefully structured lessons, practical activities, and assessments.'
  }

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

// ============================================================
// COURSE DESCRIPTION COMPONENT
// ============================================================

function CourseDescription({
  description,
}: {
  description: unknown
}) {
  const blocks = useMemo(
    () => parseDescription(description),
    [description]
  )

  if (!blocks.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5">
        <p className="text-sm leading-7 text-gray-500">
          No detailed course description has been provided yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3
              key={`heading-${index}`}
              className="pt-2 text-base font-bold text-gray-900 sm:text-lg"
            >
              {block.content}
            </h3>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={`paragraph-${index}`}
              className="text-sm leading-7 text-gray-600 sm:text-[15px]"
            >
              {block.content}
            </p>
          )
        }

        if (block.type === 'bullet-list') {
          return (
            <div
              key={`bullets-${index}`}
              className="space-y-3"
            >
              {block.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>

                  <p className="flex-1 text-sm leading-6 text-gray-600 sm:text-[15px]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          )
        }

        return (
          <div
            key={`numbers-${index}`}
            className="space-y-3"
          >
            {block.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-start gap-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  {itemIndex + 1}
                </div>

                <p className="flex-1 text-sm leading-6 text-gray-600 sm:text-[15px]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SelfPacedCourseDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ==========================================================
  // FETCH PUBLIC COURSE
  // ==========================================================

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled = false

    const loadCourse = async () => {
      setLoading(true)

      try {
        const response = await fetch(
          `/api/self-paced/courses/${id}/public`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (cancelled) {
          return
        }

        if (!response.ok) {
          setCourse({
            error:
              data?.error ||
              'Course not found.',
          })

          return
        }

        setCourse(data)
      } catch (error) {
        console.error(
          'Could not load public course:',
          error
        )

        if (!cancelled) {
          setCourse({
            error: 'Could not load course.',
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCourse()

    return () => {
      cancelled = true
    }
  }, [id])

  // ==========================================================
  // SAFE WEEKS
  // ==========================================================

  const weeks = useMemo(() => {
    return Array.isArray(course?.weeks)
      ? course.weeks
      : []
  }, [course?.weeks])

  // ==========================================================
  // STATISTICS
  //
  // Use stats from the API first.
  // If unavailable, calculate from safe public data.
  // ==========================================================

  const totalWeeks = useMemo(() => {
    if (
      typeof course?.stats?.weeks === 'number'
    ) {
      return course.stats.weeks
    }

    return weeks.length
  }, [course, weeks])

  const totalPages = useMemo(() => {
    if (
      typeof course?.stats?.lessonPages === 'number'
    ) {
      return course.stats.lessonPages
    }

    return weeks.reduce(
      (total: number, week: any) => {
        const pages = Array.isArray(week?.pages)
          ? week.pages
          : []

        return total + pages.length
      },
      0
    )
  }, [course, weeks])

  const totalQuestions = useMemo(() => {
    if (
      typeof course?.stats?.questions === 'number'
    ) {
      return course.stats.questions
    }

    return weeks.reduce(
      (total: number, week: any) => {
        const count =
          Number(
            week?.exam?.questionCount
          ) || 0

        return total + count
      },
      0
    )
  }, [course, weeks])

  const totalAssessments = useMemo(() => {
    if (
      typeof course?.stats?.assessments === 'number'
    ) {
      return course.stats.assessments
    }

    return weeks.filter(
      (week: any) =>
        Number(
          week?.exam?.questionCount
        ) > 0
    ).length
  }, [course, weeks])

  // ==========================================================
  // DESCRIPTION PREVIEW
  // ==========================================================

  const descriptionPreview = useMemo(
    () =>
      getDescriptionPreview(
        course?.description
      ),
    [course?.description]
  )

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>

        <Footer />
      </>
    )
  }

  // ==========================================================
  // COURSE NOT FOUND
  // ==========================================================

  if (!course || course.error) {
    return (
      <>
        <Navbar />

        <div className="flex min-h-screen items-center justify-center px-4 pt-16">
          <div className="text-center">
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              Course not found
            </h1>

            <p className="text-sm text-gray-500">
              {course?.error ||
                'This course is unavailable.'}
            </p>
          </div>
        </div>

        <Footer />
      </>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 pb-16 pt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">

          {/* ====================================================
              HERO
          ==================================================== */}

          <section className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

            {/* Cover */}

            <div className="relative h-52 bg-gray-100 sm:h-72 lg:h-80">
              {course.coverImageUrl ? (
                <img
                  src={course.coverImageUrl}
                  alt={course.title || 'Course cover'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Layers className="h-12 w-12 text-gray-300" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
            </div>

            {/* Hero Content */}

            <div className="p-5 sm:p-7 lg:p-8">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <GraduationCap className="h-3.5 w-3.5" />
                Self-Paced Course
              </div>

              <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>

              <p className="mb-6 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
                {descriptionPreview}
              </p>

              {/* Tutor */}

              {course.tutor && (
                <div className="mb-6 flex items-center gap-3">
                  {course.tutor.profileImage ? (
                    <img
                      src={course.tutor.profileImage}
                      alt={`${course.tutor.firstName || ''} ${course.tutor.lastName || ''}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User
                        size={16}
                        className="text-blue-600"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-400">
                      Course Tutor
                    </p>

                    <p className="text-sm font-semibold text-gray-800">
                      {course.tutor.firstName}{' '}
                      {course.tutor.lastName}
                    </p>
                  </div>
                </div>
              )}

              {/* Price + CTA */}

              <div className="flex flex-col gap-5 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Course Access
                  </p>

                  <span
                    className={`text-2xl font-bold ${
                      course.isFree
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {course.isFree
                      ? 'Free'
                      : `₦${Number(
                          course.price || 0
                        ).toLocaleString('en-NG')}`}
                  </span>

                  <p className="mt-2 text-xs text-gray-400">
                    Want to know what learners think?{' '}
                    <a
                      href="#reviews"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Read student reviews
                    </a>
                  </p>
                </div>

                <Link
                  href={`/self-paced/${course._id}/purchase`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
                >
                  {course.isFree
                    ? 'Get This Course'
                    : 'Purchase This Course'}

                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* ====================================================
              ABOUT THIS COURSE
          ==================================================== */}

          <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 lg:p-8">

            <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  About This Course
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Learn what this course covers, who it is designed
                  for, and what you can expect as you progress.
                </p>
              </div>
            </div>

            <div className="max-w-4xl">
              <CourseDescription
                description={course.description}
              />
            </div>
          </section>

          {/* ====================================================
              COURSE PREVIEW
          ==================================================== */}

          {course.previewVideoUrl && (
            <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Play
                    size={17}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Course Preview
                  </h2>

                  <p className="text-xs text-gray-500">
                    Watch a short preview before enrolling.
                  </p>
                </div>
              </div>

              <PreviewVideoEmbed
                url={course.previewVideoUrl}
              />
            </section>
          )}

          {/* ====================================================
              WHAT'S INSIDE THIS COURSE
          ==================================================== */}

          <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">

            {/* Section Heading */}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                What's Inside This Course
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Explore the complete course structure and see the
                topics you will study from week to week.
              </p>
            </div>

            {/* ==================================================
                COURSE STATISTICS
            ================================================== */}

            <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">

              {/* Weeks */}

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {totalWeeks}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {totalWeeks === 1
                    ? 'Week'
                    : 'Weeks'}
                </p>
              </div>

              {/* Lessons */}

              <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {totalPages}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {totalPages === 1
                    ? 'Lesson'
                    : 'Lessons'}
                </p>
              </div>

              {/* Questions */}

              <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {totalQuestions}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {totalQuestions === 1
                    ? 'Question'
                    : 'Questions'}
                </p>
              </div>

              {/* Assessments */}

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {totalAssessments}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {totalAssessments === 1
                    ? 'Assessment'
                    : 'Assessments'}
                </p>
              </div>
            </div>

            {/* ==================================================
                PROGRESSION NOTICE
            ================================================== */}

            <div className="mb-7 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">

                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <p className="text-sm leading-6 text-blue-900">
                  This course is self-paced and structured week by
                  week. Each week unlocks after you pass the previous
                  week's assessment with a score of{' '}
                  <strong>70% or higher.</strong>
                </p>
              </div>
            </div>

            {/* ==================================================
                SINGLE COURSE OUTLINE
            ================================================== */}

            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Course Outline
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your learning journey across {totalWeeks}{' '}
                  {totalWeeks === 1
                    ? 'week'
                    : 'weeks'}.
                </p>
              </div>

              {weeks.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-100">

                  {weeks.map(
                    (
                      week: any,
                      weekIndex: number
                    ) => {
                      const weekNumber =
                        week?.weekNumber ||
                        weekIndex + 1

                      return (
                        <div
                          key={
                            week?._id ||
                            week?.weekNumber ||
                            weekIndex
                          }
                          className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-gray-50 sm:px-5 sm:py-5"
                        >
                          {/* Week Number */}

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                            {weekNumber}
                          </div>

                          {/* Week Information */}

                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                              Week {weekNumber}
                            </p>

                            <h4 className="text-sm font-semibold leading-6 text-gray-900 sm:text-base">
                              {week?.title ||
                                `Week ${weekNumber}`}
                            </h4>
                          </div>

                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                        </div>
                      )
                    }
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <Layers className="mx-auto mb-2 h-6 w-6 text-gray-300" />

                  <p className="text-sm text-gray-500">
                    The course outline is not available yet.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ====================================================
              REVIEWS
          ==================================================== */}

          <section
            id="reviews"
            className="mb-6 scroll-mt-24"
          >
            <CoursePublicReviews
              courseId={id}
            />
          </section>

          {/* ====================================================
              COURSE EXTRAS
          ==================================================== */}

          {(
            course.coachingEnabled ||
            course.discordEnabled ||
            course.weeklyWorkshop?.enabled
          ) && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {/* Coaching */}

              {course.coachingEnabled && (
                <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    1-on-1 Coaching Available
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Get additional personal support from your
                    instructor.
                  </p>
                </div>
              )}

              {/* Discord */}

              {course.discordEnabled && (
                <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    Discord Community Included
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Connect with your course community and continue
                    learning together.
                  </p>
                </div>
              )}

              {/* Weekly Workshop */}

              {course.weeklyWorkshop?.enabled && (
                <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    Free Weekly Workshop
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {course.weeklyWorkshop.dayOfWeek}{' '}
                    {course.weeklyWorkshop.time}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
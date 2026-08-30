// app/(public)/lesson-notes/[id]/page.tsx

'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  useParams,
} from 'next/navigation'

import Link from 'next/link'

import Navbar from '@/components/layout/Navbar'

import Footer from '@/components/layout/Footer'

import SelfPacedContent from '@/components/self-paced/SelfPacedContent'

import PreviewVideoEmbed from '@/components/self-paced/PreviewVideoEmbed'

import LessonNoteFooterAd from '@/components/lesson-notes/LessonNoteFooterAd'

import {
  Lock,
  User,
  BookOpen,
  ExternalLink,
  FileText,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface LessonLink {
  label: string
  url: string
}

interface LessonPage {
  _id?: string | null
  title: string
  content: string
  links: LessonLink[]
}

interface LessonWeek {
  _id?: string | null
  weekNumber: number
  title: string
  pages: LessonPage[]
}

interface LockedWeek {
  _id?: string | null
  weekNumber: number
  title: string
}

interface LessonNote {
  _id: string
  title: string
  description: string

  coverImageUrl?: string | null
  previewVideoUrl?: string | null

  price: number
  isFree: boolean

  studentClass: string
  category?: string | null
  subject: string

  purchaseCount: number
  totalWeeks: number

  tutor?: {
    firstName: string
    lastName: string
    profileImage?: string | null
    bio?: string
  } | null

  previewWeeks: LessonWeek[]

  lockedWeekTitles: LockedWeek[]

  error?: string
}

// ============================================================
// COMPONENT
// ============================================================

export default function LessonNoteDetailPage() {
  const params =
    useParams()

  const id =
    params.id as string

  const [
    note,
    setNote,
  ] =
    useState<LessonNote | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  // ==========================================================
  // LOAD NOTE
  // ==========================================================

  useEffect(() => {
    let cancelled =
      false

    const loadNote =
      async () => {
        setLoading(
          true
        )

        setError(
          ''
        )

        try {
          const response =
            await fetch(
              `/api/lesson-notes/${id}/public`,
              {
                cache:
                  'no-store',
              }
            )

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                'Failed to load lesson note'
            )
          }

          if (
            !cancelled
          ) {
            setNote(
              data
            )
          }
        } catch (
          err: any
        ) {
          console.error(
            'Lesson note fetch error:',
            err
          )

          if (
            !cancelled
          ) {
            setError(
              err?.message ||
                'Failed to load lesson note'
            )
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            )
          }
        }
      }

    if (id) {
      loadNote()
    }

    return () => {
      cancelled =
        true
    }
  }, [id])

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>

        <Footer />
      </>
    )
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !note
  ) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center px-4">

          <div className="text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />

            <h1 className="font-semibold text-gray-800 mb-1">
              Lesson note unavailable
            </h1>

            <p className="text-gray-400 text-sm">
              {error ||
                'This lesson note could not be found.'}
            </p>

            <Link
              href="/lesson-notes"
              className="inline-block mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
            >
              Browse Lesson Notes
            </Link>
          </div>

        </div>

        <Footer />
      </>
    )
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-24 pb-16">

        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* =================================================
              HEADER CARD
          ================================================== */}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">

            {note.coverImageUrl ? (
              <img
                src={
                  note.coverImageUrl
                }
                alt={
                  note.title
                }
                className="w-full h-48 sm:h-64 object-cover"
              />
            ) : (
              <div className="h-48 sm:h-64 bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-300" />
              </div>
            )}

            <div className="p-5 sm:p-7">

              <div className="flex flex-wrap gap-2 mb-3">

                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  {note.subject}
                </span>

                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {note.studentClass?.toUpperCase()}
                </span>

                {note.category && (
                  <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                    {note.category}
                  </span>
                )}

              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3">
                {note.title}
              </h1>

              {/* Tutor */}

              {note.tutor && (
                <div className="flex items-center gap-3 mb-5">

                  {note.tutor.profileImage ? (
                    <img
                      src={
                        note.tutor.profileImage
                      }
                      alt={`${note.tutor.firstName} ${note.tutor.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <User
                        size={
                          17
                        }
                        className="text-blue-600"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {note.tutor.firstName}{' '}
                      {note.tutor.lastName}
                    </p>

                    <p className="text-xs text-gray-400">
                      Lesson note author
                    </p>
                  </div>

                </div>
              )}

              {note.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  {note.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">

                <div>
                  <p
                    className={`text-xl font-bold ${
                      note.isFree
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {note.isFree
                      ? 'Free'
                      : `₦${note.price.toLocaleString(
                          'en-NG'
                        )}`}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {note.totalWeeks}{' '}
                    week
                    {note.totalWeeks ===
                    1
                      ? ''
                      : 's'}{' '}
                    of content
                  </p>
                </div>

                {!note.isFree && (
                  <Link
                    href={`/lesson-notes/${id}/purchase`}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold text-center transition-colors"
                  >
                    Purchase Full Access
                  </Link>
                )}

                {note.isFree && (
                  <span className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-semibold">
                    Full Content Available
                  </span>
                )}

              </div>

            </div>
          </div>

          {/* =================================================
              PREVIEW VIDEO
          ================================================== */}

          {note.previewVideoUrl && (
            <section className="mb-6">

              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Preview Video
              </h2>

              <PreviewVideoEmbed
                url={
                  note.previewVideoUrl
                }
              />

            </section>
          )}

          {/* =================================================
              LESSON CONTENT
          ================================================== */}

          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">

            <div className="mb-6">

              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {note.isFree
                  ? 'Lesson Content'
                  : 'Free Preview'}
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                {note.isFree
                  ? 'This lesson note is free. All weeks are available below.'
                  : 'Weeks 1 and 2 are available as a free preview.'}
              </p>

            </div>

            {/* Weeks */}

            {note.previewWeeks.length ===
            0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No lesson content has been added yet.
              </p>
            ) : (
              <div className="space-y-8">

                {note.previewWeeks.map(
                  (
                    week
                  ) => (
                    <section
                      key={
                        week._id ||
                        week.weekNumber
                      }
                      className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0"
                    >

                      <div className="mb-5">

                        <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Week{' '}
                          {
                            week.weekNumber
                          }
                        </span>

                        <h3 className="text-lg font-bold text-gray-900">
                          {
                            week.title
                          }
                        </h3>

                      </div>

                      {/* Pages */}

                      <div className="space-y-7">

                        {week.pages?.map(
                          (
                            page,
                            pageIndex
                          ) => (
                            <article
                              key={
                                page._id ||
                                `${week.weekNumber}-${pageIndex}`
                              }
                            >

                              {page.title && (
                                <h4 className="text-base font-bold text-gray-800 mb-3">
                                  {
                                    page.title
                                  }
                                </h4>
                              )}

                              <div className="lesson-note-public-content">
                                <SelfPacedContent
                                  html={
                                    page.content ||
                                    ''
                                  }
                                />
                              </div>

                              {/* Resource links */}

                              {page.links &&
                                page.links.length >
                                  0 && (
                                  <div className="mt-4 border-t border-gray-100 pt-4">

                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Resources
                                    </p>

                                    <div className="flex flex-col gap-2">

                                      {page.links.map(
                                        (
                                          link,
                                          linkIndex
                                        ) => (
                                          <a
                                            key={`${link.url}-${linkIndex}`}
                                            href={
                                              link.url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                          >
                                            <ExternalLink
                                              size={
                                                14
                                              }
                                            />

                                            {link.label ||
                                              link.url}
                                          </a>
                                        )
                                      )}

                                    </div>

                                  </div>
                                )}

                            </article>
                          )
                        )}

                      </div>

                    </section>
                  )
                )}

              </div>
            )}

            {/* =================================================
                LOCKED WEEKS
            ================================================== */}

            {!note.isFree &&
              note.lockedWeekTitles
                .length >
                0 && (
                <div className="mt-8">

                  <div className="border-t border-gray-100 pt-6 mb-4">

                    <div className="flex items-center gap-2">

                      <Lock
                        size={
                          17
                        }
                        className="text-gray-400"
                      />

                      <h3 className="font-bold text-gray-800">
                        Full lesson content
                      </h3>

                    </div>

                    <p className="text-sm text-gray-400 mt-1">
                      Purchase this lesson note to access the remaining weeks.
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">

                    {note.lockedWeekTitles.map(
                      (
                        week
                      ) => (
                        <div
                          key={
                            week._id ||
                            week.weekNumber
                          }
                          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                        >

                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <Lock
                              size={
                                13
                              }
                              className="text-gray-400"
                            />
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">
                              Week{' '}
                              {
                                week.weekNumber
                              }
                            </p>

                            <p className="text-sm font-medium text-gray-600">
                              {
                                week.title
                              }
                            </p>
                          </div>

                        </div>
                      )
                    )}

                  </div>

                  <div className="text-center mt-6">

                    <Link
                      href={`/lesson-notes/${id}/purchase`}
                      className="inline-flex justify-center px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Purchase Full Lesson Note
                    </Link>

                  </div>

                </div>
              )}

          </section>

          <LessonNoteFooterAd />

        </div>

      </main>

      <Footer />
    </>
  )
}
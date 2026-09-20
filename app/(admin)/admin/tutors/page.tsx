// app/(admin)/admin/tutors/page.tsx

'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  useSession,
} from 'next-auth/react'

import {
  useRouter,
} from 'next/navigation'

import toast from 'react-hot-toast'

import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Mail,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Users,
  MessageSquare,
  DollarSign,
  PlayCircle,
  CalendarClock,
  PauseCircle,
} from 'lucide-react'

import AdminLayout from '@/components/admin/AdminLayout'

import ScheduleInterviewModal from '@/components/admin/ScheduleInterviewModal'

import AdminTutorApprovalModal from '@/components/admin/AdminTutorApprovalModal'

import TutorCourseEditor from '@/components/admin/TutorCourseEditor'

// ============================================================
// TYPES
// ============================================================

type TutorStatus =
  | 'pending'
  | 'approved'
  | 'disapproved'
  | 'suspended'
  | 'paused'

type TutorAction =
  | 'approve'
  | 'disapprove'
  | 'suspend'
  | 'pause'
  | 'reactivate'

interface TutorCourse {
  _id: string
  name: string
  category: string
}

interface TutorQualification {
  degree: string
  institution: string
  year: string
}

interface TutorPricing {
  monthly: number
  threeMonths: number
  sixMonths: number
  oneYear: number
}

interface Tutor {
  _id: string

  firstName: string

  lastName: string

  email: string

  phone: string

  bio: string

  status: TutorStatus

  qualifications:
    TutorQualification[]

  courses:
    TutorCourse[]

  profileImage?: string

  videoLink?: string

  resume?: string

  discordUsername?: string

  discordId?: string

  pricing?: TutorPricing

  studentCount: number

  createdAt: string

  updatedAt: string
}

// ============================================================
// TABS
// ============================================================

const TABS: {
  value: string
  label: string
}[] = [
  {
    value: 'all',
    label: 'All',
  },

  {
    value: 'pending',
    label: 'Pending',
  },

  {
    value: 'approved',
    label: 'Approved',
  },

  {
    value: 'disapproved',
    label: 'Disapproved',
  },

  {
    value: 'suspended',
    label: 'Suspended',
  },

  {
    value: 'paused',
    label: 'Paused',
  },
]

// ============================================================
// STATUS STYLES
// ============================================================

const STATUS_STYLES:
  Record<
    string,
    string
  > = {
  pending:
    'bg-yellow-100 text-yellow-700',

  approved:
    'bg-green-100 text-green-700',

  disapproved:
    'bg-red-100 text-red-700',

  suspended:
    'bg-gray-200 text-gray-600',

  paused:
    'bg-orange-100 text-orange-700',
}

// ============================================================
// PAGE
// ============================================================

export default function AdminTutors() {
  const {
    data:
      session,

    status:
      sessionStatus,
  } =
    useSession()

  const router =
    useRouter()

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    tutors,
    setTutors,
  ] =
    useState<
      Tutor[]
    >([])

  const [
    statusCounts,
    setStatusCounts,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({})

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState(
      ''
    )

  const [
    tab,
    setTab,
  ] =
    useState(
      'pending'
    )

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      1
    )

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(
      1
    )

  const [
    selectedTutor,
    setSelectedTutor,
  ] =
    useState<
      Tutor |
      null
    >(
      null
    )

  const [
    interviewTutor,
    setInterviewTutor,
  ] =
    useState<
      Tutor |
      null
    >(
      null
    )

  const [
    approvingTutor,
    setApprovingTutor,
  ] =
    useState<
      Tutor |
      null
    >(
      null
    )

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(
      false
    )

  // ==========================================================
  // ADMIN AUTHENTICATION
  // ==========================================================

  useEffect(
    () => {
      if (
        sessionStatus ===
        'unauthenticated'
      ) {
        router.push(
          '/auth/admin/login'
        )
      }

      if (
        sessionStatus ===
          'authenticated' &&
        session?.user?.role !==
          'admin'
      ) {
        router.push(
          '/unauthorized'
        )
      }
    },
    [
      sessionStatus,
      session,
      router,
    ]
  )

  // ==========================================================
  // FETCH WHEN FILTERS CHANGE
  // ==========================================================

  useEffect(
    () => {
      if (
        sessionStatus ===
          'authenticated' &&
        session?.user?.role ===
          'admin'
      ) {
        fetchTutors()
      }
    },
    [
      currentPage,
      tab,
      searchTerm,
      sessionStatus,
      session,
    ]
  )

  // ==========================================================
  // FETCH TUTORS
  // ==========================================================

  const fetchTutors =
    async () => {
      try {
        setLoading(
          true
        )

        const params =
          new URLSearchParams({
            page:
              String(
                currentPage
              ),

            status:
              tab,

            search:
              searchTerm,
          })

        const response =
          await fetch(
            `/api/admin/tutors?${params.toString()}`,
            {
              cache:
                'no-store',
            }
          )

        const data =
          await response.json()

        if (
          response.ok
        ) {
          setTutors(
            data.tutors ||
              []
          )

          setTotalPages(
            data.pages ||
              1
          )

          setStatusCounts(
            data.statusCounts ||
              {}
          )

          return
        }

        toast.error(
          data.error ||
            'Failed to fetch tutors'
        )

        setTutors(
          []
        )
      } catch (
        error
      ) {
        console.error(
          'Fetch tutors:',
          error
        )

        toast.error(
          'Failed to fetch tutors'
        )

        setTutors(
          []
        )
      } finally {
        setLoading(
          false
        )
      }
    }

  // ==========================================================
  // TUTOR ACTION
  // ==========================================================

  const handleAction =
    async (
      tutorId:
        string,

      action:
        TutorAction
    ) => {
      setActionLoading(
        true
      )

      try {
        const response =
          await fetch(
            `/api/admin/tutors/${tutorId}/${action}`,
            {
              method:
                'PATCH',
            }
          )

        const data =
          await response.json()

        if (
          response.ok
        ) {
          toast.success(
            data.message ||
              'Tutor updated successfully'
          )

          /*
           * Close the details modal because its tutor object
           * contains the old status.
           */
          setSelectedTutor(
            null
          )

          await fetchTutors()

          return
        }

        toast.error(
          data.error ||
            `Failed to ${action} tutor`
        )
      } catch (
        error
      ) {
        console.error(
          'Tutor action:',
          error
        )

        toast.error(
          'An error occurred'
        )
      } finally {
        setActionLoading(
          false
        )
      }
    }

  // ==========================================================
  // DELETE TUTOR
  // ==========================================================

  const handleDeleteTutor =
    async (
      tutor:
        Tutor
    ) => {
      const confirmed =
        window.confirm(
          `Permanently remove ${tutor.firstName} ${tutor.lastName}? This withdraws all their students.`
        )

      if (
        !confirmed
      ) {
        return
      }

      setActionLoading(
        true
      )

      try {
        const response =
          await fetch(
            `/api/admin/tutors/${tutor._id}`,
            {
              method:
                'DELETE',
            }
          )

        const data =
          await response
            .json()
            .catch(
              () => ({})
            )

        if (
          !response.ok
        ) {
          toast.error(
            data.error ||
              'Could not remove tutor'
          )

          return
        }

        toast.success(
          'Tutor removed'
        )

        setSelectedTutor(
          null
        )

        await fetchTutors()
      } catch (
        error
      ) {
        console.error(
          'Delete tutor:',
          error
        )

        toast.error(
          'Could not remove tutor'
        )
      } finally {
        setActionLoading(
          false
        )
      }
    }

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (
    sessionStatus ===
    'loading'
  ) {
    return (
      <AdminLayout>
        <div className="flex h-80 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  if (
    session?.user?.role !==
    'admin'
  ) {
    return null
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Tutors
            </h1>

            <p className="mt-0.5 text-sm text-gray-500">
              Review applications and manage tutor accounts
            </p>
          </div>

          <button
            type="button"
            onClick={
              fetchTutors
            }
            disabled={
              loading
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map(
            (
              item
            ) => (
              <button
                type="button"
                key={
                  item.value
                }
                onClick={() => {
                  setTab(
                    item.value
                  )

                  setCurrentPage(
                    1
                  )
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  tab ===
                  item.value
                    ? 'bg-red-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    tab ===
                    item.value
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }`}
                >
                  {statusCounts[
                    item.value
                  ] ??
                    0}
                </span>
              </button>
            )
          )}
        </div>

        {/* ===================================================
            SEARCH
        ==================================================== */}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={
              searchTerm
            }
            onChange={(
              event
            ) => {
              setSearchTerm(
                event
                  .target
                  .value
              )

              setCurrentPage(
                1
              )
            }}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {/* ===================================================
            TUTOR CARDS
        ==================================================== */}

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        ) : tutors.length ===
          0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">
            No tutors found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map(
              (
                tutor
              ) => (
                <div
                  key={
                    tutor._id
                  }
                  className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm"
                >
                  {/* PROFILE */}

                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                      {tutor.profileImage ? (
                        <img
                          src={
                            tutor.profileImage
                          }
                          alt={
                            tutor.firstName
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-500">
                          {tutor
                            .firstName?.[
                            0
                          ]}

                          {tutor
                            .lastName?.[
                            0
                          ]}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {tutor.firstName}{' '}
                        {tutor.lastName}
                      </p>

                      <p className="truncate text-xs text-gray-400">
                        {tutor.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUS_STYLES[
                          tutor.status
                        ] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tutor.status}
                    </span>
                  </div>

                  {/* COURSES */}

                  <div className="mb-3 flex flex-wrap gap-1">
                    {tutor
                      .courses
                      ?.slice(
                        0,
                        2
                      )
                      .map(
                        (
                          course
                        ) => (
                          <span
                            key={
                              course._id
                            }
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                          >
                            {course.name}
                          </span>
                        )
                      )}

                    {tutor
                      .courses
                      ?.length >
                      2 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                        +
                        {tutor
                          .courses
                          .length -
                          2}
                      </span>
                    )}
                  </div>

                  {/* STATS */}

                  <div className="mb-3 flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users
                        size={
                          11
                        }
                      />

                      {tutor.studentCount}{' '}
                      students
                    </span>

                    <span className="flex min-w-0 items-center gap-1">
                      <MessageSquare
                        size={
                          11
                        }
                        className={
                          tutor.discordUsername
                            ? 'text-indigo-500'
                            : 'text-gray-300'
                        }
                      />

                      <span className="truncate">
                        {tutor.discordUsername
                          ? `@${tutor.discordUsername}`
                          : 'Not connected'}
                      </span>
                    </span>
                  </div>

                  {/* CARD ACTIONS */}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTutor(
                          tutor
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye
                        size={
                          13
                        }
                      />

                      Details
                    </button>

                    {/* PENDING */}

                    {tutor.status ===
                      'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setInterviewTutor(
                              tutor
                            )
                          }
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Schedule Interview"
                        >
                          <CalendarClock
                            size={
                              16
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setApprovingTutor(
                              tutor
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                          title="Approve Tutor"
                        >
                          <CheckCircle
                            size={
                              16
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              tutor._id,
                              'disapprove'
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Reject Tutor"
                        >
                          <XCircle
                            size={
                              16
                            }
                          />
                        </button>
                      </>
                    )}

                    {/* APPROVED */}

                    {tutor.status ===
                      'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            tutor._id,
                            'suspend'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        className="rounded-lg p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                        title="Suspend Tutor"
                      >
                        <Ban
                          size={
                            16
                          }
                        />
                      </button>
                    )}

                    {/* SUSPENDED */}

                    {tutor.status ===
                      'suspended' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            tutor._id,
                            'reactivate'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                        title="Reactivate Tutor"
                      >
                        <PlayCircle
                          size={
                            16
                          }
                        />
                      </button>
                    )}

                    {/* PAUSED */}

                    {tutor.status ===
                      'paused' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            tutor._id,
                            'reactivate'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                        title="Reactivate Tutor"
                      >
                        <PlayCircle
                          size={
                            16
                          }
                        />
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {totalPages >
          1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (
                    page
                  ) =>
                    Math.max(
                      1,
                      page -
                        1
                    )
                )
              }
              disabled={
                currentPage ===
                1
              }
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft
                size={
                  16
                }
              />
            </button>

            <span className="text-xs text-gray-500">
              Page{' '}
              {currentPage}{' '}
              of{' '}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (
                    page
                  ) =>
                    Math.min(
                      totalPages,
                      page +
                        1
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight
                size={
                  16
                }
              />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          TUTOR DETAILS MODAL
      ====================================================== */}

      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-2xl sm:rounded-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4">
              <h2 className="text-base font-bold text-gray-900">
                Tutor Details
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedTutor(
                    null
                  )
                }
                className="rounded-lg p-1.5 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="space-y-5 p-5">

              {/* PROFILE */}

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                  {selectedTutor.profileImage ? (
                    <img
                      src={
                        selectedTutor.profileImage
                      }
                      alt={
                        selectedTutor.firstName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-gray-500">
                      {selectedTutor
                        .firstName?.[
                        0
                      ]}

                      {selectedTutor
                        .lastName?.[
                        0
                      ]}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedTutor.firstName}{' '}
                      {selectedTutor.lastName}
                    </h3>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUS_STYLES[
                          selectedTutor.status
                        ] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {selectedTutor.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">
                    {selectedTutor.email}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedTutor.phone ||
                      'No phone provided'}
                  </p>
                </div>
              </div>

              {/* STATS */}

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <Users
                    size={
                      14
                    }
                    className="mx-auto mb-1 text-blue-500"
                  />

                  <p className="text-sm font-bold text-gray-900">
                    {selectedTutor.studentCount}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Students
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <MessageSquare
                    size={
                      14
                    }
                    className={`mx-auto mb-1 ${
                      selectedTutor.discordUsername
                        ? 'text-indigo-500'
                        : 'text-gray-300'
                    }`}
                  />

                  <p className="truncate text-xs font-bold text-gray-900">
                    {selectedTutor.discordUsername
                      ? `@${selectedTutor.discordUsername}`
                      : 'Not linked'}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Discord
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <DollarSign
                    size={
                      14
                    }
                    className="mx-auto mb-1 text-green-500"
                  />

                  <p className="text-xs font-bold text-gray-900">
                    ₦
                    {(
                      selectedTutor
                        .pricing
                        ?.monthly ??
                      0
                    ).toLocaleString()}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Monthly rate
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <Clock
                    size={
                      14
                    }
                    className="mx-auto mb-1 text-gray-400"
                  />

                  <p className="text-xs font-bold text-gray-900">
                    {new Date(
                      selectedTutor.createdAt
                    ).toLocaleDateString(
                      'en-NG',
                      {
                        day:
                          'numeric',

                        month:
                          'short',

                        year:
                          'numeric',
                      }
                    )}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Joined
                  </p>
                </div>
              </div>

              {/* PRICING */}

              {selectedTutor.pricing && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Pricing
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="font-bold">
                        ₦
                        {selectedTutor
                          .pricing
                          .monthly
                          .toLocaleString()}
                      </p>

                      <p className="text-gray-400">
                        Monthly
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="font-bold">
                        ₦
                        {selectedTutor
                          .pricing
                          .threeMonths
                          .toLocaleString()}
                      </p>

                      <p className="text-gray-400">
                        3 Months
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="font-bold">
                        ₦
                        {selectedTutor
                          .pricing
                          .sixMonths
                          .toLocaleString()}
                      </p>

                      <p className="text-gray-400">
                        6 Months
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="font-bold">
                        ₦
                        {selectedTutor
                          .pricing
                          .oneYear
                          .toLocaleString()}
                      </p>

                      <p className="text-gray-400">
                        1 Year
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BIO */}

              {selectedTutor.bio && (
                <div>
                  <h4 className="mb-1.5 text-sm font-semibold text-gray-900">
                    Professional Bio
                  </h4>

                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {selectedTutor.bio}
                  </p>
                </div>
              )}

              {/* QUALIFICATIONS */}

              {selectedTutor
                .qualifications
                ?.length >
                0 && (
                <div>
                  <h4 className="mb-1.5 text-sm font-semibold text-gray-900">
                    Qualifications
                  </h4>

                  <div className="space-y-1.5">
                    {selectedTutor
                      .qualifications
                      .map(
                        (
                          qualification,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="rounded-lg bg-gray-50 p-2.5 text-sm"
                          >
                            <p className="font-medium text-gray-800">
                              {qualification.degree}
                            </p>

                            <p className="text-xs text-gray-500">
                              {qualification.institution}{' '}
                              (
                              {qualification.year}
                              )
                            </p>
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}

              {/* COURSES */}

              {selectedTutor
                .courses
                ?.length >
                0 && (
                <div>
                  <h4 className="mb-1.5 text-sm font-semibold text-gray-900">
                    Courses Taught
                  </h4>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedTutor
                      .courses
                      .map(
                        (
                          course
                        ) => (
                          <span
                            key={
                              course._id
                            }
                            className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700"
                          >
                            {course.name}
                          </span>
                        )
                      )}
                  </div>
                </div>
              )}

              {/* COURSE EDITOR */}

              <TutorCourseEditor
                tutorId={
                  selectedTutor._id
                }
                currentCourseIds={
                  selectedTutor
                    .courses
                    .map(
                      (
                        course
                      ) =>
                        course._id
                    )
                }
                onSaved={
                  fetchTutors
                }
              />

              {/* EXTERNAL LINKS */}

              <div className="flex flex-wrap gap-4">
                {selectedTutor.videoLink && (
                  <a
                    href={
                      selectedTutor.videoLink
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink
                      size={
                        14
                      }
                    />

                    Video Introduction
                  </a>
                )}

                {selectedTutor.resume && (
                  <a
                    href={
                      selectedTutor.resume
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink
                      size={
                        14
                      }
                    />

                    Resume
                  </a>
                )}

                <a
                  href={`mailto:${selectedTutor.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:underline"
                >
                  <Mail
                    size={
                      14
                    }
                  />

                  Email Tutor
                </a>
              </div>

              {/* =================================================
                  ACCOUNT ACTIONS
              ================================================== */}

              <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">

                {/* PENDING */}

                {selectedTutor.status ===
                  'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setInterviewTutor(
                          selectedTutor
                        )
                      }
                      className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Schedule Interview
                    </button>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setApprovingTutor(
                            selectedTutor
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            selectedTutor._id,
                            'disapprove'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading
                          ? 'Processing...'
                          : 'Reject'}
                      </button>
                    </div>
                  </>
                )}

                {/* APPROVED */}

                {selectedTutor.status ===
                  'approved' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        selectedTutor._id,
                        'suspend'
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {actionLoading
                      ? 'Processing...'
                      : 'Suspend Account'}
                  </button>
                )}

                {/* SUSPENDED */}

                {selectedTutor.status ===
                  'suspended' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        selectedTutor._id,
                        'reactivate'
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <PlayCircle
                        size={
                          16
                        }
                      />

                      {actionLoading
                        ? 'Reactivating...'
                        : 'Reactivate Account'}
                    </span>
                  </button>
                )}

                {/* PAUSED */}

                {selectedTutor.status ===
                  'paused' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        selectedTutor._id,
                        'reactivate'
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <PlayCircle
                        size={
                          16
                        }
                      />

                      {actionLoading
                        ? 'Reactivating...'
                        : 'Reactivate Account'}
                    </span>
                  </button>
                )}

                {/* DELETE */}

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteTutor(
                      selectedTutor
                    )
                  }
                  disabled={
                    actionLoading
                  }
                  className="w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {actionLoading
                    ? 'Processing...'
                    : 'Remove Tutor Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INTERVIEW MODAL
      ====================================================== */}

      {interviewTutor && (
        <ScheduleInterviewModal
          tutor={
            interviewTutor
          }
          onClose={() =>
            setInterviewTutor(
              null
            )
          }
        />
      )}

      {/* =====================================================
          APPROVAL MODAL
      ====================================================== */}

      {approvingTutor && (
        <AdminTutorApprovalModal
          tutor={
            approvingTutor as any
          }
          onClose={() =>
            setApprovingTutor(
              null
            )
          }
          onApproved={
            fetchTutors
          }
        />
      )}
    </AdminLayout>
  )
}
// components/tutor/PaymentsHistory.tsx

'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  GraduationCap,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface PayoutRow {
  _id: string

  studentName: string

  studentEmail?:
    | string
    | null

  courseName: string

  grossAmount: number

  commissionAmount: number

  netAmount: number

  status:
    | 'pending'
    | 'processing'
    | 'paid'
    | 'failed'

  paidAt:
    | string
    | null

  createdAt: string

  sourceModel:
    | 'Payment'
    | 'SelfPacedEnrollment'
    | 'CoachingBooking'
    | 'LessonNotePurchase'

  paystackReference?:
    | string
    | null
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface Counts {
  all: number
  pending: number
  processing: number
  paid: number
  failed: number
}

interface Totals {
  totalEarned: number
  totalPending: number
  totalGross: number
  totalCommission: number
}

const PAGE_SIZE =
  20

const STATUS_STYLES: Record<
  string,
  {
    color: string
    icon: any
  }
> = {
  pending: {
    color:
      'bg-yellow-100 text-yellow-700',

    icon:
      Clock,
  },

  processing: {
    color:
      'bg-blue-100 text-blue-700',

    icon:
      Clock,
  },

  paid: {
    color:
      'bg-green-100 text-green-700',

    icon:
      CheckCircle2,
  },

  failed: {
    color:
      'bg-red-100 text-red-700',

    icon:
      XCircle,
  },
}

function getSourceInfo(
  sourceModel?:
    string
) {
  switch (
    sourceModel
  ) {
    case 'Payment':
      return {
        label:
          'Course Enrollment',

        icon:
          GraduationCap,
      }

    case 'SelfPacedEnrollment':
      return {
        label:
          'Self-Paced Course',

        icon:
          GraduationCap,
      }

    case 'CoachingBooking':
      return {
        label:
          'Coaching Session',

        icon:
          BookOpen,
      }

    case 'LessonNotePurchase':
      return {
        label:
          'Lesson Note Purchase',

        icon:
          FileText,
      }

    default:
      return {
        label:
          'Payment',

        icon:
          Wallet,
      }
  }
}

function formatMoney(
  amount:
    number
) {
  return `₦${Number(
    amount ||
      0
  ).toLocaleString(
    'en-NG'
  )}`
}

function formatDate(
  date?:
    | string
    | null
) {
  if (!date) {
    return ''
  }

  return new Date(
    date
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
  )
}

export default function PaymentsHistory() {
  const [
    payments,
    setPayments,
  ] =
    useState<
      PayoutRow[]
    >([])

  const [
    totals,
    setTotals,
  ] =
    useState<Totals>({
      totalEarned:
        0,

      totalPending:
        0,

      totalGross:
        0,

      totalCommission:
        0,
    })

  const [
    counts,
    setCounts,
  ] =
    useState<Counts>({
      all:
        0,

      pending:
        0,

      processing:
        0,

      paid:
        0,

      failed:
        0,
    })

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>({
      page:
        1,

      limit:
        PAGE_SIZE,

      totalCount:
        0,

      totalPages:
        1,

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    })

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const loadPayments =
    useCallback(
      async (
        page:
          number
      ) => {
        try {
          setLoading(
            true
          )

          setError(
            null
          )

          const response =
            await fetch(
              `/api/tutor/payments?page=${page}&limit=${PAGE_SIZE}`,
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
              data.error ||
                'Failed to load payments'
            )
          }

          setPayments(
            data.payments ||
              []
          )

          setTotals({
            totalEarned:
              Number(
                data.totalEarned ||
                  0
              ),

            totalPending:
              Number(
                data.totalPending ||
                  0
              ),

            totalGross:
              Number(
                data.totalGross ||
                  0
              ),

            totalCommission:
              Number(
                data.totalCommission ||
                  0
              ),
          })

          setCounts({
            all:
              Number(
                data.counts
                  ?.all ||
                  0
              ),

            pending:
              Number(
                data.counts
                  ?.pending ||
                  0
              ),

            processing:
              Number(
                data.counts
                  ?.processing ||
                  0
              ),

            paid:
              Number(
                data.counts
                  ?.paid ||
                  0
              ),

            failed:
              Number(
                data.counts
                  ?.failed ||
                  0
              ),
          })

          setPagination(
            data.pagination ||
              {
                page:
                  1,

                limit:
                  PAGE_SIZE,

                totalCount:
                  0,

                totalPages:
                  1,

                hasNextPage:
                  false,

                hasPreviousPage:
                  false,
              }
          )
        } catch (
          error: any
        ) {
          console.error(
            error
          )

          setError(
            error?.message ||
              'Failed to load payment history'
          )
        } finally {
          setLoading(
            false
          )
        }
      },
      []
    )

  useEffect(
    () => {
      void loadPayments(
        1
      )
    },
    [
      loadPayments,
    ]
  )

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page >
        pagination.totalPages ||
      page ===
        pagination.page ||
      loading
    ) {
      return
    }

    void loadPayments(
      page
    )
  }

  if (
    loading &&
    payments.length ===
      0
  ) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (
    error &&
    payments.length ===
      0
  ) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* SUMMARY */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-white rounded-2xl border border-gray-100 p-4">

          <CheckCircle2
            size={
              16
            }
            className="text-green-500 mb-2"
          />

          <p className="text-lg font-bold text-gray-900">
            {formatMoney(
              totals.totalEarned
            )}
          </p>

          <p className="text-xs text-gray-500">
            Total paid to you
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            {
              counts.paid
            }{' '}
            paid payout
            {counts.paid ===
            1
              ? ''
              : 's'}
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">

          <Clock
            size={
              16
            }
            className="text-yellow-500 mb-2"
          />

          <p className="text-lg font-bold text-gray-900">
            {formatMoney(
              totals.totalPending
            )}
          </p>

          <p className="text-xs text-gray-500">
            Pending payout
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            {counts.pending +
              counts.processing}{' '}
            awaiting payout
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">

          <Wallet
            size={
              16
            }
            className="text-blue-500 mb-2"
          />

          <p className="text-lg font-bold text-gray-900">
            {formatMoney(
              totals.totalGross
            )}
          </p>

          <p className="text-xs text-gray-500">
            Total gross sales
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            {
              counts.all
            }{' '}
            transaction
            {counts.all ===
            1
              ? ''
              : 's'}
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">

          <Wallet
            size={
              16
            }
            className="text-purple-500 mb-2"
          />

          <p className="text-lg font-bold text-gray-900">
            {formatMoney(
              totals.totalCommission
            )}
          </p>

          <p className="text-xs text-gray-500">
            Platform commission
          </p>

        </div>

      </div>

      {/* PAYMENT HISTORY */}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-3">

          <div>

            <h3 className="text-sm font-bold text-gray-900">
              Payment History
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              Courses, self-paced courses,
              coaching and lesson-note earnings
            </p>

          </div>

          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full shrink-0">
            {
              pagination.totalCount
            }{' '}
            payment
            {pagination.totalCount ===
            1
              ? ''
              : 's'}
          </span>

        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs border-b border-blue-100">
            Loading payments...
          </div>
        )}

        <div className="divide-y divide-gray-50">

          {payments.length ===
          0 ? (
            <p className="text-center text-gray-400 text-sm py-10">
              No payment history yet.
            </p>
          ) : (
            payments.map(
              (
                payment
              ) => {
                const status =
                  STATUS_STYLES[
                    payment.status
                  ] ||
                  STATUS_STYLES.pending

                const StatusIcon =
                  status.icon

                const source =
                  getSourceInfo(
                    payment.sourceModel
                  )

                const SourceIcon =
                  source.icon

                return (
                  <div
                    key={
                      payment._id
                    }
                    className="p-4"
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${status.color}`}
                      >
                        <StatusIcon
                          size={
                            15
                          }
                        />
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <p className="text-sm font-semibold text-gray-900">
                            {
                              payment.courseName
                            }
                          </p>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded-full">

                            <SourceIcon
                              size={
                                10
                              }
                            />

                            {
                              source.label
                            }

                          </span>

                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {
                            payment.studentName
                          }
                          {' · '}
                          {formatMoney(
                            payment.grossAmount
                          )}{' '}
                          gross
                        </p>

                        {payment.studentEmail && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {
                              payment.studentEmail
                            }
                          </p>
                        )}

                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatDate(
                            payment.createdAt
                          )}
                        </p>

                        {payment.paystackReference && (
                          <p className="text-[10px] text-gray-400 mt-1 break-all">
                            Ref:{' '}
                            {
                              payment.paystackReference
                            }
                          </p>
                        )}

                      </div>

                      <div className="text-right shrink-0">

                        <p className="text-sm font-bold text-gray-900">
                          {formatMoney(
                            payment.netAmount
                          )}
                        </p>

                        <p className="text-[10px] text-gray-400 mt-0.5">
                          You earn
                        </p>

                        <span
                          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${status.color}`}
                        >
                          {
                            payment.status
                          }
                        </span>

                        {payment.status ===
                          'paid' &&
                          payment.paidAt && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              Paid{' '}
                              {formatDate(
                                payment.paidAt
                              )}
                            </p>
                          )}

                      </div>

                    </div>

                    <div className="mt-3 ml-12 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">

                      <span>
                        Gross:{' '}
                        <strong className="text-gray-700">
                          {formatMoney(
                            payment.grossAmount
                          )}
                        </strong>
                      </span>

                      <span>
                        Commission:{' '}
                        <strong className="text-gray-700">
                          {formatMoney(
                            payment.commissionAmount
                          )}
                        </strong>
                      </span>

                    </div>

                  </div>
                )
              }
            )
          )}

        </div>

        {/* PAGINATION */}

        {pagination.totalPages >
          1 && (
          <div className="border-t border-gray-100 px-4 py-4">

            <div className="flex items-center justify-between gap-3">

              <p className="text-xs text-gray-500">
                Page{' '}
                <span className="font-semibold text-gray-700">
                  {
                    pagination.page
                  }
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-700">
                  {
                    pagination.totalPages
                  }
                </span>
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage ||
                    loading
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page -
                        1
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft
                    size={
                      14
                    }
                  />

                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage ||
                    loading
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page +
                        1
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next

                  <ChevronRight
                    size={
                      14
                    }
                  />
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}
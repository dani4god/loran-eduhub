'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import AdminLayout from '@/components/admin/AdminLayout'

import {
  Wallet,
  CheckCircle2,
  Loader2,
  Percent,
  Sparkles,
  BookOpen,
  GraduationCap,
  Video,
  AlertCircle,
  User,
  Landmark,
} from 'lucide-react'

type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'

type SourceModel =
  | 'Payment'
  | 'CoachingBooking'
  | 'LessonNotePurchase'

interface PayoutRow {
  _id: string

  sourceModel: SourceModel

  sourceLabel: string

  tutorId: string

  tutorName: string

  bankName:
    | string
    | null

  accountNumber:
    | string
    | null

  accountName:
    | string
    | null

  hasBankDetails:
    boolean

  studentName:
    string

  studentEmail:
    | string
    | null

  courseName:
    string

  itemName:
    string

  grossAmount:
    number

  commissionRate:
    number

  commissionAmount:
    number

  netAmount:
    number

  status:
    PayoutStatus

  failureReason:
    | string
    | null

  paystackReference:
    | string
    | null

  paidAt:
    | string
    | null

  createdAt:
    string
}

interface StatusCounts {
  pending: number
  processing: number
  paid: number
  failed: number
}

const STATUS_STYLES: Record<
  PayoutStatus,
  string
> = {
  pending:
    'bg-yellow-100 text-yellow-700',

  processing:
    'bg-blue-100 text-blue-700',

  paid:
    'bg-green-100 text-green-700',

  failed:
    'bg-red-100 text-red-700',
}

function SourceIcon({
  sourceModel,
}: {
  sourceModel:
    SourceModel
}) {
  if (
    sourceModel ===
    'LessonNotePurchase'
  ) {
    return (
      <BookOpen
        size={14}
        className="text-purple-600"
      />
    )
  }

  if (
    sourceModel ===
    'CoachingBooking'
  ) {
    return (
      <Video
        size={14}
        className="text-blue-600"
      />
    )
  }

  return (
    <GraduationCap
      size={14}
      className="text-green-600"
    />
  )
}

// ============================================================
// COMMISSION RATE
// ============================================================

function CommissionRateControl() {
  const [
    percent,
    setPercent,
  ] =
    useState(
      15
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    )

  useEffect(
    () => {
      const load =
        async () => {
          try {
            const res =
              await fetch(
                '/api/admin/settings/commission',
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
                data.error ||
                  'Failed to load commission'
              )
            }

            setPercent(
              Math.round(
                Number(
                  data.commissionRate ??
                    0.15
                ) *
                  100
              )
            )
          } catch (
            error: any
          ) {
            toast.error(
              error.message ||
                'Failed to load commission rate'
            )
          } finally {
            setLoading(
              false
            )
          }
        }

      load()
    },
    []
  )

  const save =
    async () => {
      if (
        !Number.isFinite(
          percent
        ) ||
        percent < 0 ||
        percent > 100
      ) {
        toast.error(
          'Commission must be between 0% and 100%'
        )

        return
      }

      setSaving(
        true
      )

      try {
        const res =
          await fetch(
            '/api/admin/settings/commission',
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    percent,
                  }
                ),
            }
          )

        const data =
          await res.json()

        if (
          !res.ok
        ) {
          throw new Error(
            data.error ||
              'Failed to update rate'
          )
        }

        toast.success(
          `Commission rate set to ${percent}%`
        )
      } catch (
        error: any
      ) {
        toast.error(
          error.message ||
            'Failed to update commission rate'
        )
      } finally {
        setSaving(
          false
        )
      }
    }

  if (
    loading
  ) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-1">
        <Percent
          size={16}
          className="text-red-500 shrink-0"
        />

        <div>
          <p className="text-sm font-semibold text-gray-900">
            Platform Commission Rate
          </p>

          <p className="text-xs text-gray-400">
            This rate applies when a new payout record is created.
            Existing payout records retain their original commission.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={
            percent
          }
          onChange={(
            event
          ) =>
            setPercent(
              Number(
                event
                  .target
                  .value
              )
            )
          }
          className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-red-100"
        />

        <span className="text-sm text-gray-500">
          %
        </span>

        <button
          onClick={
            save
          }
          disabled={
            saving
          }
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function AdminPayoutsPage() {
  const [
    payouts,
    setPayouts,
  ] =
    useState<
      PayoutRow[]
    >([])

  const [
    counts,
    setCounts,
  ] =
    useState<StatusCounts>({
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
    status,
    setStatus,
  ] =
    useState<PayoutStatus>(
      'pending'
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    payingId,
    setPayingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    cleaning,
    setCleaning,
  ] =
    useState(
      false
    )

  // ==========================================================
  // LOAD
  // ==========================================================

  const load =
    useCallback(
      async () => {
        setLoading(
          true
        )

        try {
          const res =
            await fetch(
              `/api/admin/payouts?status=${encodeURIComponent(
                status
              )}`,
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
              data.error ||
                'Failed to load payouts'
            )
          }

          setPayouts(
            data.payouts ||
              []
          )

          setCounts(
            data.statusCounts || {
              pending:
                0,

              processing:
                0,

              paid:
                0,

              failed:
                0,
            }
          )
        } catch (
          error: any
        ) {
          toast.error(
            error.message ||
              'Failed to load payouts'
          )
        } finally {
          setLoading(
            false
          )
        }
      },
      [
        status,
      ]
    )

  useEffect(
    () => {
      load()
    },
    [
      load,
    ]
  )

  // ==========================================================
  // MARK PAID
  // ==========================================================

  const markPaid =
    async (
      payout:
        PayoutRow
    ) => {
      const confirmed =
        window.confirm(
          `Confirm that you have manually paid ${payout.tutorName} ₦${payout.netAmount.toLocaleString(
            'en-NG'
          )}?`
        )

      if (
        !confirmed
      ) {
        return
      }

      setPayingId(
        payout._id
      )

      try {
        const res =
          await fetch(
            `/api/admin/payouts/${payout._id}/pay`,
            {
              method:
                'POST',
            }
          )

        const data =
          await res.json()

        if (
          !res.ok
        ) {
          throw new Error(
            data.error ||
              'Failed to mark payout as paid'
          )
        }

        toast.success(
          'Payout marked as paid'
        )

        await load()
      } catch (
        error: any
      ) {
        toast.error(
          error.message ||
            'Failed'
        )
      } finally {
        setPayingId(
          null
        )
      }
    }

  // ==========================================================
  // CLEAN DUPLICATES
  // ==========================================================

  const runCleanup =
    async () => {
      const confirmed =
        window.confirm(
          'Clean genuine duplicate payout entries? Each lesson-note purchase and coaching booking will be treated as a separate transaction.'
        )

      if (
        !confirmed
      ) {
        return
      }

      setCleaning(
        true
      )

      try {
        const res =
          await fetch(
            '/api/admin/payouts/dedupe',
            {
              method:
                'POST',
            }
          )

        const data =
          await res.json()

        if (
          !res.ok
        ) {
          throw new Error(
            data.error ||
              'Cleanup failed'
          )
        }

        toast.success(
          `Removed ${data.removed} duplicate(s)`
        )

        await load()
      } catch (
        error: any
      ) {
        toast.error(
          error.message ||
            'Cleanup failed'
        )
      } finally {
        setCleaning(
          false
        )
      }
    }

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Tutor Payouts
            </h1>

            <p className="text-gray-500 text-sm mt-0.5">
              Tutor earnings after platform commission.
              Payments are currently confirmed manually.
            </p>
          </div>

          <button
            onClick={
              runCleanup
            }
            disabled={
              cleaning
            }
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {cleaning ? (
              <Loader2
                size={13}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                size={13}
              />
            )}

            Clean Up Duplicates
          </button>
        </div>

        <CommissionRateControl />

        {/* ===================================================
            STATUS TABS
        =================================================== */}

        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              'pending',
              'processing',
              'paid',
              'failed',
            ] as PayoutStatus[]
          ).map(
            (
              currentStatus
            ) => (
              <button
                key={
                  currentStatus
                }
                onClick={() =>
                  setStatus(
                    currentStatus
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  status ===
                  currentStatus
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {
                  currentStatus
                }

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    status ===
                    currentStatus
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }`}
                >
                  {
                    counts[
                      currentStatus
                    ]
                  }
                </span>
              </button>
            )
          )}
        </div>

        {/* ===================================================
            CONTENT
        =================================================== */}

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />

            <p className="text-xs text-gray-400 mt-3">
              Loading payouts...
            </p>
          </div>
        ) : payouts.length ===
          0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-5 text-center">
            <Wallet
              size={32}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-gray-500 text-sm font-medium">
              No {status} payouts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map(
              (
                payout
              ) => (
                <div
                  key={
                    payout._id
                  }
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"
                >
                  {/* TOP */}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {
                            payout.tutorName
                          }
                        </p>

                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                          <SourceIcon
                            sourceModel={
                              payout.sourceModel
                            }
                          />

                          {
                            payout.sourceLabel
                          }
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {
                          payout.itemName
                        }
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        STATUS_STYLES[
                          payout
                            .status
                        ]
                      }`}
                    >
                      {
                        payout.status
                      }
                    </span>
                  </div>

                  {/* BUYER */}

                  <div className="flex items-start gap-2 text-xs text-gray-500 mb-3">
                    <User
                      size={13}
                      className="mt-0.5 shrink-0"
                    />

                    <div>
                      <p>
                        {
                          payout.studentName
                        }
                      </p>

                      {payout.studentEmail && (
                        <p className="text-[11px] text-gray-400">
                          {
                            payout.studentEmail
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BANK */}

                  {payout.bankName &&
                  payout.accountNumber ? (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-start gap-2">
                      <Landmark
                        size={14}
                        className="text-gray-500 mt-0.5 shrink-0"
                      />

                      <div className="text-[11px] text-gray-600">
                        <p className="font-semibold text-gray-700">
                          {
                            payout.bankName
                          }
                        </p>

                        <p>
                          {
                            payout.accountNumber
                          }
                        </p>

                        {payout.accountName && (
                          <p className="text-gray-400">
                            {
                              payout.accountName
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-orange-600 font-semibold mb-3">
                      <AlertCircle
                        size={12}
                      />

                      No bank details on file for this tutor
                    </div>
                  )}

                  {/* MONEY */}

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Gross
                      </p>

                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-0.5">
                        ₦
                        {payout.grossAmount.toLocaleString(
                          'en-NG'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Commission
                      </p>

                      <p className="text-xs sm:text-sm font-semibold text-red-600 mt-0.5">
                        ₦
                        {payout.commissionAmount.toLocaleString(
                          'en-NG'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Tutor earns
                      </p>

                      <p className="text-xs sm:text-sm font-bold text-green-700 mt-0.5">
                        ₦
                        {payout.netAmount.toLocaleString(
                          'en-NG'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* REFERENCE */}

                  {payout.paystackReference && (
                    <p className="text-[10px] text-gray-400 mt-2 break-all">
                      Ref:{' '}
                      {
                        payout.paystackReference
                      }
                    </p>
                  )}

                  {/* FAILURE */}

                  {payout.status ===
                    'failed' &&
                    payout.failureReason && (
                      <div className="mt-3 bg-red-50 text-red-700 text-xs rounded-lg p-2.5">
                        {
                          payout.failureReason
                        }
                      </div>
                    )}

                  {/* PENDING BUTTON */}

                  {payout.status ===
                    'pending' && (
                    <button
                      onClick={() =>
                        markPaid(
                          payout
                        )
                      }
                      disabled={
                        payingId ===
                        payout._id
                      }
                      className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {payingId ===
                      payout._id ? (
                        <Loader2
                          size={13}
                          className="animate-spin"
                        />
                      ) : (
                        <Wallet
                          size={13}
                        />
                      )}

                      {payingId ===
                      payout._id
                        ? 'Saving...'
                        : 'Mark as Paid'}
                    </button>
                  )}

                  {/* PAID */}

                  {payout.status ===
                    'paid' &&
                    payout.paidAt && (
                      <p className="flex items-center gap-1 text-[11px] text-green-600 font-semibold mt-3">
                        <CheckCircle2
                          size={11}
                        />

                        Paid{' '}
                        {new Date(
                          payout.paidAt
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
                    )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
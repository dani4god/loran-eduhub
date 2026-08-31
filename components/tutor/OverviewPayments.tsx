// components/tutor/OverviewPayments.tsx

"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PaymentRecord {
  _id: string;

  sourceModel:
    | "Payment"
    | "SelfPacedEnrollment"
    | "CoachingBooking"
    | "LessonNotePurchase";

  studentName: string;

  studentEmail?: string | null;

  courseName: string;

  grossAmount: number;
  commissionAmount: number;
  netAmount: number;

  status:
    | "pending"
    | "processing"
    | "paid"
    | "failed";

  paidAt?: string | null;

  createdAt: string;

  paystackReference?: string | null;
}

interface PaymentResponse {
  payments: PaymentRecord[];

  totalEarned: number;
  totalPending: number;
  totalGross: number;
  totalCommission: number;

  counts?: {
    all: number;
    pending: number;
    processing: number;
    paid: number;
    failed: number;
  };
}

function formatMoney(amount: number) {
  return `₦${Number(
    amount || 0
  ).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getSource(
  sourceModel: PaymentRecord["sourceModel"]
) {
  switch (sourceModel) {
    case "Payment":
      return {
        label: "Course",
        Icon: GraduationCap,
      };

    case "SelfPacedEnrollment":
      return {
        label: "Self-paced",
        Icon: BookOpen,
      };

    case "CoachingBooking":
      return {
        label: "Coaching",
        Icon: BookOpen,
      };

    case "LessonNotePurchase":
      return {
        label: "Lesson note",
        Icon: FileText,
      };

    default:
      return {
        label: "Payment",
        Icon: Wallet,
      };
  }
}

function getStatus(
  status: PaymentRecord["status"]
) {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        className:
          "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Icon: CheckCircle2,
      };

    case "processing":
      return {
        label: "Processing",
        className:
          "bg-blue-50 text-blue-700 ring-blue-600/10",
        Icon: Clock3,
      };

    case "failed":
      return {
        label: "Failed",
        className:
          "bg-red-50 text-red-700 ring-red-600/10",
        Icon: XCircle,
      };

    default:
      return {
        label: "Pending",
        className:
          "bg-amber-50 text-amber-700 ring-amber-600/10",
        Icon: Clock3,
      };
  }
}

export default function OverviewPayments() {
  const [records, setRecords] =
    useState<PaymentRecord[]>([]);

  const [summary, setSummary] =
    useState({
      totalEarned: 0,
      totalPending: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const loadPayments =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            "/api/tutor/payments?page=1&limit=5",
            {
              cache: "no-store",
            }
          );

        const data: PaymentResponse & {
          error?: string;
        } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load payments"
          );
        }

        setRecords(
          data.payments || []
        );

        setSummary({
          totalEarned: Number(
            data.totalEarned || 0
          ),

          totalPending: Number(
            data.totalPending || 0
          ),
        });
      } catch (error: any) {
        console.error(
          "Overview payments error:",
          error
        );

        setError(
          error?.message ||
            "Unable to load payment activity"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}

      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Wallet className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Payment activity
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Your latest earnings and payout records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadPayments()
              }
              disabled={loading}
              aria-label="Refresh payments"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

            <Link
              href="/dashboard/tutor/payments"
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-900 px-3 text-[11px] font-semibold text-white transition hover:bg-slate-800"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mini payment summary */}

      <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/60">
        <div className="border-r border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Paid to you
          </p>

          <p className="mt-1 text-base font-bold text-slate-900">
            {formatMoney(
              summary.totalEarned
            )}
          </p>
        </div>

        <div className="px-4 py-3 sm:px-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Pending payout
          </p>

          <p className="mt-1 text-base font-bold text-amber-700">
            {formatMoney(
              summary.totalPending
            )}
          </p>
        </div>
      </div>

      {/* Loading */}

      {loading &&
      records.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

            <p className="text-xs text-slate-400">
              Loading payment activity...
            </p>
          </div>
        </div>
      ) : error &&
        records.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Payment activity could not be loaded.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadPayments()
            }
            className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Wallet className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No payment records yet
          </p>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Earnings from courses, self-paced courses,
            coaching and lesson notes will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {records.map((record) => {
            const source =
              getSource(
                record.sourceModel
              );

            const status =
              getStatus(
                record.status
              );

            const SourceIcon =
              source.Icon;

            const StatusIcon =
              status.Icon;

            return (
              <div
                key={record._id}
                className="px-4 py-3.5 transition hover:bg-slate-50/70 sm:px-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <SourceIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                        {record.courseName}
                      </p>

                      <span className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
                        {source.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="max-w-[180px] truncate text-[11px] text-slate-500">
                        {record.studentName}
                      </span>

                      <span className="text-[10px] text-slate-300">
                        •
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {formatDate(
                          record.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-900 sm:text-sm">
                      {formatMoney(
                        record.netAmount
                      )}
                    </p>

                    <span
                      className={`
                        mt-1 inline-flex items-center gap-1 rounded-full
                        px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset
                        ${status.className}
                      `}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />

                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {records.length > 0 && (
        <Link
          href="/dashboard/tutor/payments"
          className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50/60"
        >
          View full payment history
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </section>
  );
}
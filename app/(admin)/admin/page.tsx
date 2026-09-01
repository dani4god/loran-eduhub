// app/(admin)/admin/page.tsx

"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSession,
} from "next-auth/react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import toast from "react-hot-toast";

import {
  Users,
  GraduationCap,
  BookOpen,
  WalletCards,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ticket,
  ScrollText,
  Layers,
  FileText,
  ArrowRight,
  Activity,
  ShoppingBag,
  RefreshCw,
  CircleDollarSign,
  School,
  Sparkles,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";

// ============================================================
// TYPES
// ============================================================

interface RecentActivity {
  type: string;
  message: string;
  timeAgo: string;
}

interface DashboardStats {
  totalStudents: number;

  liveStudents: number;

  selfPacedStudents: number;

  totalTutors: number;

  pendingTutors: number;

  activeEnrollments: number;

  expiringEnrollments: number;

  selfPacedEnrollments: number;

  totalCourses: number;

  totalLiveCourses: number;

  totalSelfPacedCourses: number;

  pendingPayments: number;

  certificatesIssued: number;

  lessonNotePurchases: number;

  totalRevenue: number;

  liveRevenue: number;

  selfPacedRevenue: number;

  lessonNoteRevenue: number;

  recentRevenue: number;

  revenueChange: number;

  recentActivities:
    RecentActivity[];
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value: number
) {
  return `₦${Number(
    value || 0
  ).toLocaleString(
    "en-NG"
  )}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  href,
  tone,
}: {
  icon: any;
  label: string;
  value:
    | string
    | number;
  description?: string;
  href?: string;
  tone:
    | "blue"
    | "violet"
    | "emerald"
    | "amber"
    | "red"
    | "cyan"
    | "slate"
    | "indigo";
}) {
  const tones = {
    blue:
      "bg-blue-50 text-blue-600 border-blue-100",

    violet:
      "bg-violet-50 text-violet-600 border-violet-100",

    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100",

    red:
      "bg-red-50 text-red-600 border-red-100",

    cyan:
      "bg-cyan-50 text-cyan-600 border-cyan-100",

    slate:
      "bg-slate-100 text-slate-600 border-slate-200",

    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  const card = (
    <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            tones[tone]
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        {href && (
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
        )}
      </div>

      <p className="mt-4 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {label}
      </p>

      {description && (
        <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-[11px]">
          {
            description
          }
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full"
      >
        {card}
      </Link>
    );
  }

  return card;
}

// ============================================================
// PAGE
// ============================================================

export default function AdminDashboard() {
  const {
    data: session,
    status,
  } = useSession();

  const router =
    useRouter();

  const [
    stats,
    setStats,
  ] =
    useState<DashboardStats | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  useEffect(() => {
    if (
      status ===
      "unauthenticated"
    ) {
      router.push(
        "/auth/admin/login"
      );

      return;
    }

    if (
      status ===
        "authenticated" &&
      session?.user?.role !==
        "admin"
    ) {
      router.push(
        "/unauthorized"
      );

      return;
    }

    if (
      status ===
        "authenticated" &&
      session?.user?.role ===
        "admin"
    ) {
      fetchDashboardData();
    }
  }, [
    status,
    session,
    router,
  ]);

  const fetchDashboardData =
    async (
      manual = false
    ) => {
      try {
        if (manual) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        const res =
          await fetch(
            "/api/admin/overview",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          toast.error(
            data.error ||
              "Failed to load dashboard"
          );

          return;
        }

        setStats(data);

        if (manual) {
          toast.success(
            "Dashboard refreshed"
          );
        }
      } catch {
        toast.error(
          "Failed to load dashboard data"
        );
      } finally {
        setLoading(
          false
        );

        setRefreshing(
          false
        );
      }
    };

  if (
    status ===
      "loading" ||
    loading
  ) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading
              dashboard...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (
    session?.user
      ?.role !==
    "admin"
  ) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ==================================================
            HEADER
        =================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 shadow-xl sm:rounded-3xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-300" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-200">
                  Platform Overview
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
                Monitor learners,
                tutors,
                enrollments,
                course purchases
                and platform
                revenue from one
                workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchDashboardData(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </section>

        {/* ==================================================
            MAIN STATS
        =================================================== */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Platform
                Snapshot
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Live learning
                and self-paced
                learning combined.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Learners"
              value={
                stats?.totalStudents ??
                0
              }
              description="Live + self-paced students"
              href="/admin/students"
              tone="blue"
            />

            <StatCard
              icon={
                School
              }
              label="Live Students"
              value={
                stats?.liveStudents ??
                0
              }
              description="Students using tutor-led learning"
              href="/admin/students?type=regular"
              tone="indigo"
            />

            <StatCard
              icon={
                Layers
              }
              label="Self-Paced Students"
              value={
                stats?.selfPacedStudents ??
                0
              }
              description="Independent course learners"
              href="/admin/students?type=self_paced"
              tone="violet"
            />

            <StatCard
              icon={
                GraduationCap
              }
              label="Approved Tutors"
              value={
                stats?.totalTutors ??
                0
              }
              description={`${stats?.pendingTutors ?? 0} application(s) pending`}
              href="/admin/tutors"
              tone="emerald"
            />

            <StatCard
              icon={
                BookOpen
              }
              label="Active Live Enrollments"
              value={
                stats?.activeEnrollments ??
                0
              }
              description={`${stats?.expiringEnrollments ?? 0} expiring within 5 days`}
              href="/admin/enrollments"
              tone="emerald"
            />

            <StatCard
              icon={
                Layers
              }
              label="Self-Paced Enrollments"
              value={
                stats?.selfPacedEnrollments ??
                0
              }
              description="Completed course purchases"
              href="/admin/self-paced-courses"
              tone="violet"
            />

            <StatCard
              icon={
                FileText
              }
              label="Lesson Note Purchases"
              value={
                stats?.lessonNotePurchases ??
                0
              }
              description="Purchased learning materials"
              href="/admin/lesson-notes"
              tone="amber"
            />

            <StatCard
              icon={
                CircleDollarSign
              }
              label="Platform Revenue"
              value={formatCurrency(
                stats?.totalRevenue ??
                  0
              )}
              description="Live + self-paced + lesson notes"
              href="/admin/payments"
              tone="red"
            />
          </div>
        </section>

        {/* ==================================================
            REVENUE
        =================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Revenue
                    Overview
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                    {formatCurrency(
                      stats?.totalRevenue ??
                        0
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Total recorded
                    platform sales
                    across major
                    learning
                    products.
                  </p>
                </div>

                <div
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    (
                      stats?.revenueChange ??
                      0
                    ) > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : (
                            stats?.revenueChange ??
                            0
                          ) < 0
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {(stats?.revenueChange ??
                    0) >
                  0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    stats?.revenueChange ??
                      0
                  ) < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <Activity className="h-3.5 w-3.5" />
                  )}

                  {(stats?.revenueChange ??
                    0) >
                    0 &&
                    "+"}

                  {stats?.revenueChange ??
                    0}
                  %
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <RevenueBlock
                icon={
                  BookOpen
                }
                label="Live Tutoring"
                amount={
                  stats?.liveRevenue ??
                  0
                }
                tone="blue"
              />

              <RevenueBlock
                icon={
                  Layers
                }
                label="Self-Paced Courses"
                amount={
                  stats?.selfPacedRevenue ??
                  0
                }
                tone="violet"
              />

              <RevenueBlock
                icon={
                  FileText
                }
                label="Lesson Notes"
                amount={
                  stats?.lessonNoteRevenue ??
                  0
                }
                tone="amber"
              />
            </div>
          </div>

          {/* Additional metrics */}

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Learning
              Ecosystem
            </p>

            <div className="mt-5 space-y-4">
              <DarkMetric
                icon={
                  BookOpen
                }
                label="Live Courses"
                value={
                  stats?.totalLiveCourses ??
                  0
                }
              />

              <DarkMetric
                icon={
                  Layers
                }
                label="Self-Paced Courses"
                value={
                  stats?.totalSelfPacedCourses ??
                  0
                }
              />

              <DarkMetric
                icon={
                  ScrollText
                }
                label="Certificates Issued"
                value={
                  stats?.certificatesIssued ??
                  0
                }
              />

              <DarkMetric
                icon={
                  AlertCircle
                }
                label="Pending Payments"
                value={
                  stats?.pendingPayments ??
                  0
                }
              />
            </div>
          </div>
        </section>

        {/* ==================================================
            ATTENTION + ACTIVITY
        =================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Needs Attention
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Tasks that may
                require an admin
                response.
              </p>
            </div>

            <div className="space-y-2.5">
              <AttentionRow
                href="/admin/tutors"
                icon={
                  Clock
                }
                title="Tutor Applications"
                description={`${stats?.pendingTutors ?? 0} awaiting review`}
                tone="amber"
              />

              <AttentionRow
                href="/admin/payments"
                icon={
                  AlertCircle
                }
                title="Pending Payments"
                description={`${stats?.pendingPayments ?? 0} awaiting confirmation`}
                tone="red"
              />

              <AttentionRow
                href="/admin/enrollments"
                icon={
                  BookOpen
                }
                title="Expiring Enrollments"
                description={`${stats?.expiringEnrollments ?? 0} expire within 5 days`}
                tone="blue"
              />

              <AttentionRow
                href="/admin/tickets"
                icon={
                  Ticket
                }
                title="Support Centre"
                description="Review learner and tutor support requests"
                tone="slate"
              />
            </div>
          </div>

          {/* Recent activity */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent
                  Activity
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Latest
                  activity across
                  the platform.
                </p>
              </div>

              <Sparkles className="h-4 w-4 text-slate-300" />
            </div>

            {!stats
              ?.recentActivities
              ?.length ? (
              <div className="px-5 py-14 text-center">
                <Activity className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No recent
                  activity
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentActivities.map(
                  (
                    activity,
                    index
                  ) => (
                    <ActivityRow
                      key={`${activity.type}-${index}`}
                      activity={
                        activity
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

// ============================================================
// CHILD COMPONENTS
// ============================================================

function RevenueBlock({
  icon: Icon,
  label,
  amount,
  tone,
}: {
  icon: any;
  label: string;
  amount: number;
  tone:
    | "blue"
    | "violet"
    | "amber";
}) {
  const iconClass =
    tone ===
    "blue"
      ? "bg-blue-50 text-blue-600"
      : tone ===
          "violet"
        ? "bg-violet-50 text-violet-600"
        : "bg-amber-50 text-amber-600";

  return (
    <div className="p-4 sm:p-5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {formatCurrency(
          amount
        )}
      </p>
    </div>
  );
}

function DarkMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300">
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-xs font-medium text-slate-400">
          {label}
        </span>
      </div>

      <span className="text-lg font-bold text-white">
        {value}
      </span>
    </div>
  );
}

function AttentionRow({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  tone:
    | "amber"
    | "red"
    | "blue"
    | "slate";
}) {
  const styles = {
    amber:
      "bg-amber-50 text-amber-600",

    red:
      "bg-red-50 text-red-600",

    blue:
      "bg-blue-50 text-blue-600",

    slate:
      "bg-slate-100 text-slate-600",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}

function ActivityRow({
  activity,
}: {
  activity:
    RecentActivity;
}) {
  let icon =
    Activity;

  let style =
    "bg-slate-100 text-slate-600";

  if (
    activity.type ===
    "tutor_approved"
  ) {
    icon =
      CheckCircle2;

    style =
      "bg-emerald-50 text-emerald-600";
  }

  if (
    activity.type ===
    "tutor_rejected"
  ) {
    icon =
      XCircle;

    style =
      "bg-red-50 text-red-600";
  }

  if (
    activity.type ===
    "new_enrollment"
  ) {
    icon =
      BookOpen;

    style =
      "bg-blue-50 text-blue-600";
  }

  if (
    activity.type ===
    "self_paced_purchase"
  ) {
    icon =
      Layers;

    style =
      "bg-violet-50 text-violet-600";
  }

  if (
    activity.type ===
    "lesson_note_purchase"
  ) {
    icon =
      ShoppingBag;

    style =
      "bg-amber-50 text-amber-600";
  }

  const Icon =
    icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs leading-5 text-slate-700 sm:text-sm">
          {
            activity.message
          }
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {
            activity.timeAgo
          }
        </p>
      </div>
    </div>
  );
}
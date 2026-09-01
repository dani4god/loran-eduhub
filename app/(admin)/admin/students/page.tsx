// app/(admin)/admin/students/page.tsx

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
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import toast from "react-hot-toast";

import {
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  BookOpen,
  Calendar,
  AlertTriangle,
  Trash2,
  Clock,
  UserMinus,
  CheckCircle2,
  Users,
  GraduationCap,
  Video,
  Layers,
  Lock,
  CircleCheck,
  Filter,
  Award,
  ArrowRight,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";

// ============================================================
// TYPES
// ============================================================

type StudentType =
  | "regular"
  | "self_paced";

interface EnrollmentDetail {
  enrollmentId: string;

  enrollmentType:
    | "regular"
    | "self_paced";

  courseId: string;

  courseName: string;

  courseCategory: string;

  tutorName: string;

  plan: string;

  status: string;

  amount: number;

  startDate:
    | string
    | null;

  endDate:
    | string
    | null;

  daysLeft:
    | number
    | null;

  isExpired: boolean;

  averageScore:
    | number
    | null;

  completedWeeks:
    | number
    | null;

  totalWeeks:
    | number
    | null;

  progressPercent:
    | number
    | null;

  locked?: boolean;

  lockedAtWeek?:
    | number
    | null;

  completedAt?:
    | string
    | null;
}

interface StudentItem {
  _id: string;

  studentType:
    StudentType;

  userId: string;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  state: string;

  profileImage?:
    | string
    | null;

  discordUsername:
    | string
    | null;

  discordId:
    | string
    | null;

  hasUsedFreeTrial:
    boolean;

  createdAt:
    | string
    | null;

  enrollments:
    EnrollmentDetail[];
}

interface Counts {
  total: number;
  live: number;
  selfPaced: number;
}

// ============================================================
// CONFIG
// ============================================================

const PLAN_LABELS: Record<
  string,
  string
> = {
  trial:
    "Free Trial",

  monthly:
    "Monthly",

  "3months":
    "3 Months",

  "6months":
    "6 Months",

  "1year":
    "1 Year Diploma",

  self_paced:
    "Self-Paced",
};

const STATUS_STYLES: Record<
  string,
  string
> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  paused:
    "border-amber-200 bg-amber-50 text-amber-700",

  expired:
    "border-red-200 bg-red-50 text-red-700",

  withdrawn:
    "border-slate-200 bg-slate-100 text-slate-500",

  pending:
    "border-slate-200 bg-slate-50 text-slate-500",

  suspended:
    "border-red-200 bg-red-50 text-red-700",

  locked:
    "border-orange-200 bg-orange-50 text-orange-700",

  completed:
    "border-violet-200 bg-violet-50 text-violet-700",
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  date:
    | string
    | null
) {
  if (!date) {
    return "N/A";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-NG",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

function formatMoney(
  amount: number
) {
  return `₦${Number(
    amount || 0
  ).toLocaleString(
    "en-NG"
  )}`;
}

function getInitials(
  firstName: string,
  lastName: string
) {
  return `${firstName?.[0] || ""}${
    lastName?.[0] || ""
  }`.toUpperCase();
}

function StudentTypeBadge({
  type,
}: {
  type:
    StudentType;
}) {
  if (
    type ===
    "self_paced"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
        <Layers className="h-2.5 w-2.5" />

        Self-Paced
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
      <Video className="h-2.5 w-2.5" />

      Live Student
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
        STATUS_STYLES[
          status
        ] ||
        STATUS_STYLES.pending
      }`}
    >
      {status}
    </span>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AdminStudents() {
  const {
    data: session,
    status:
      sessionStatus,
  } = useSession();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const initialType =
    searchParams.get(
      "type"
    ) ===
    "regular"
      ? "regular"
      : searchParams.get(
            "type"
          ) ===
          "self_paced"
        ? "self_paced"
        : "all";

  const [
    students,
    setStudents,
  ] =
    useState<StudentItem[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      | "all"
      | StudentType
    >(initialType);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pages,
    setPages,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    counts,
    setCounts,
  ] = useState<Counts>({
    total: 0,
    live: 0,
    selfPaced: 0,
  });

  const [
    selected,
    setSelected,
  ] =
    useState<StudentItem | null>(
      null
    );

  const [
    deleting,
    setDeleting,
  ] = useState<
    string | null
  >(null);

  const [
    withdrawing,
    setWithdrawing,
  ] = useState<
    string | null
  >(null);

  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(() => {
    if (
      sessionStatus ===
      "unauthenticated"
    ) {
      router.push(
        "/auth/admin/login"
      );

      return;
    }

    if (
      sessionStatus ===
        "authenticated" &&
      session?.user?.role !==
        "admin"
    ) {
      router.push(
        "/unauthorized"
      );
    }
  }, [
    sessionStatus,
    session,
    router,
  ]);

  // ==========================================================
  // FETCH
  // ==========================================================

  useEffect(() => {
    if (
      sessionStatus !==
        "authenticated" ||
      session?.user?.role !==
        "admin"
    ) {
      return;
    }

    const timer =
      setTimeout(
        () => {
          fetchStudents();
        },
        search
          ? 300
          : 0
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [
    page,
    search,
    typeFilter,
    sessionStatus,
    session,
  ]);

  const fetchStudents =
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

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "limit",
          "12"
        );

        params.set(
          "type",
          typeFilter
        );

        if (
          search.trim()
        ) {
          params.set(
            "search",
            search.trim()
          );
        }

        const res =
          await fetch(
            `/api/admin/students?${params.toString()}`,
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
              "Failed to fetch students"
          );

          return;
        }

        setStudents(
          data.students ||
            []
        );

        setPages(
          data.pages ||
            1
        );

        setTotal(
          data.total ||
            0
        );

        setCounts(
          data.counts || {
            total: 0,
            live: 0,
            selfPaced: 0,
          }
        );

        if (manual) {
          toast.success(
            "Student list refreshed"
          );
        }
      } catch {
        toast.error(
          "Failed to fetch students"
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

  // ==========================================================
  // REGULAR-STUDENT ACTIONS
  // ==========================================================

  const handleDeleteStudent =
    async (
      studentId: string
    ) => {
      if (
        !confirm(
          "Are you sure you want to permanently remove this live-tutoring student?\n\nTheir active enrollments will be withdrawn and their account will be deactivated."
        )
      ) {
        return;
      }

      setDeleting(
        studentId
      );

      try {
        const res =
          await fetch(
            `/api/admin/students/${studentId}`,
            {
              method:
                "DELETE",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          toast.error(
            data.error ||
              "Failed to remove student"
          );

          return;
        }

        toast.success(
          "Student removed successfully"
        );

        setSelected(
          null
        );

        await fetchStudents();
      } catch {
        toast.error(
          "An error occurred"
        );
      } finally {
        setDeleting(
          null
        );
      }
    };

  const handleWithdrawEnrollment =
    async (
      enrollmentId: string
    ) => {
      if (
        !confirm(
          "Withdraw this live enrollment?\n\nThe student will lose access to this course."
        )
      ) {
        return;
      }

      setWithdrawing(
        enrollmentId
      );

      try {
        const res =
          await fetch(
            `/api/admin/enrollments/${enrollmentId}`,
            {
              method:
                "DELETE",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          toast.error(
            data.error ||
              "Failed to withdraw enrollment"
          );

          return;
        }

        toast.success(
          "Enrollment withdrawn successfully"
        );

        setSelected(
          null
        );

        await fetchStudents();
      } catch {
        toast.error(
          "An error occurred"
        );
      } finally {
        setWithdrawing(
          null
        );
      }
    };

  const handleSuspendStudent =
    async (
      studentId: string
    ) => {
      if (
        !confirm(
          "Are you sure you want to suspend this live-tutoring student?"
        )
      ) {
        return;
      }

      try {
        const res =
          await fetch(
            `/api/admin/students/${studentId}/suspend`,
            {
              method:
                "PATCH",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          toast.error(
            data.error ||
              "Failed to suspend student"
          );

          return;
        }

        toast.success(
          "Student suspended successfully"
        );

        setSelected(
          null
        );

        await fetchStudents();
      } catch {
        toast.error(
          "An error occurred"
        );
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    sessionStatus ===
    "loading"
  ) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ==================================================
            HEADER
        =================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 shadow-xl sm:rounded-3xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-600/15 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-300" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-200">
                  Learner Management
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Students
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
                View live
                tutoring students
                and self-paced
                learners,
                their courses,
                tutors,
                payments and
                learning
                progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchStudents(
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
            QUICK COUNTS
        =================================================== */}

        <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <CountCard
            label="All Learners"
            value={
              typeFilter ===
              "all"
                ? counts.total
                : total
            }
            icon={
              Users
            }
            tone="blue"
          />

          <CountCard
            label="Live"
            value={
              typeFilter ===
              "regular"
                ? total
                : counts.live
            }
            icon={
              Video
            }
            tone="indigo"
          />

          <CountCard
            label="Self-Paced"
            value={
              typeFilter ===
              "self_paced"
                ? total
                : counts.selfPaced
            }
            icon={
              Layers
            }
            tone="violet"
          />
        </section>

        {/* ==================================================
            FILTERS
        =================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                placeholder="Search by name, email or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value as
                      | "all"
                      | StudentType;

                  setTypeFilter(
                    value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 sm:min-w-[190px]"
              >
                <option value="all">
                  All Learners
                </option>

                <option value="regular">
                  Live Students
                </option>

                <option value="self_paced">
                  Self-Paced Students
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* ==================================================
            STUDENT CARDS
        =================================================== */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />

            <p className="mt-3 text-sm text-slate-500">
              Loading
              students...
            </p>
          </div>
        ) : students.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <Users className="mx-auto h-9 w-9 text-slate-300" />

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No learners
              found
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Try another
              search term or
              learning-type
              filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {students.map(
              (
                student
              ) => {
                const activeCount =
                  student.enrollments.filter(
                    (
                      enrollment
                    ) =>
                      enrollment.status ===
                      "active"
                  ).length;

                const completedCount =
                  student.enrollments.filter(
                    (
                      enrollment
                    ) =>
                      enrollment.status ===
                      "completed"
                  ).length;

                const expiringSoon =
                  student.studentType ===
                    "regular" &&
                  student.enrollments.some(
                    (
                      enrollment
                    ) =>
                      enrollment.status ===
                        "active" &&
                      enrollment.daysLeft !==
                        null &&
                      enrollment.daysLeft >
                        0 &&
                      enrollment.daysLeft <=
                        5
                  );

                return (
                  <article
                    key={`${student.studentType}:${student._id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div
                      className={`h-1 ${
                        student.studentType ===
                        "self_paced"
                          ? "bg-violet-500"
                          : "bg-blue-500"
                      }`}
                    />

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {student.profileImage ? (
                          <img
                            src={
                              student.profileImage
                            }
                            alt={`${student.firstName} ${student.lastName}`}
                            className="h-12 w-12 shrink-0 rounded-2xl border border-slate-200 object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold ${
                              student.studentType ===
                              "self_paced"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {getInitials(
                              student.firstName,
                              student.lastName
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="truncate text-sm font-bold text-slate-900">
                              {
                                student.firstName
                              }{" "}
                              {
                                student.lastName
                              }
                            </h3>

                            <StudentTypeBadge
                              type={
                                student.studentType
                              }
                            />
                          </div>

                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {student.email ||
                              "No email"}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {student.phone ||
                              "No phone number"}
                          </p>
                        </div>

                        {expiringSoon && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold uppercase text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" />

                            Renewal
                          </span>
                        )}
                      </div>

                      {/* Summary */}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Courses
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {
                              student.enrollments
                                .length
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            {student.studentType ===
                            "self_paced"
                              ? "Completed"
                              : "Active"}
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {student.studentType ===
                            "self_paced"
                              ? completedCount
                              : activeCount}
                          </p>
                        </div>
                      </div>

                      {/* Discord */}

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <MessageSquare
                          className={`h-3.5 w-3.5 ${
                            student.discordUsername
                              ? "text-indigo-500"
                              : "text-slate-300"
                          }`}
                        />

                        {student.discordUsername
                          ? `@${student.discordUsername}`
                          : "Discord not connected"}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelected(
                            student
                          )
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" />

                        View Full
                        Details
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        {/* ==================================================
            PAGINATION
        =================================================== */}

        {pages >
          1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
            <p className="text-[11px] text-slate-500">
              Page{" "}
              <strong className="text-slate-700">
                {page}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700">
                {pages}
              </strong>{" "}
              ·{" "}
              {total}{" "}
              learner
              {total !==
              1
                ? "s"
                : ""}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
                          1
                      )
                  )
                }
                disabled={
                  page ===
                  1
                }
                className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />

                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      Math.min(
                        pages,
                        current +
                          1
                      )
                  )
                }
                disabled={
                  page ===
                  pages
                }
                className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Next

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            STUDENT DETAILS MODAL
        =================================================== */}

        {selected && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
              {/* Modal header */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Student
                    Details
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Learner
                    account and
                    enrollment
                    history
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                {/* ==========================================
                    PROFILE
                =========================================== */}

                <div className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center">
                  {selected.profileImage ? (
                    <img
                      src={
                        selected.profileImage
                      }
                      alt={`${selected.firstName} ${selected.lastName}`}
                      className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${
                        selected.studentType ===
                        "self_paced"
                          ? "bg-violet-500/20 text-violet-200"
                          : "bg-blue-500/20 text-blue-200"
                      }`}
                    >
                      {getInitials(
                        selected.firstName,
                        selected.lastName
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <StudentTypeBadge
                      type={
                        selected.studentType
                      }
                    />

                    <h3 className="mt-2 text-xl font-bold">
                      {
                        selected.firstName
                      }{" "}
                      {
                        selected.lastName
                      }
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="h-3 w-3" />

                      {selected.email ||
                        "No email"}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="h-3 w-3" />

                      {selected.phone ||
                        "No phone"}
                    </p>
                  </div>
                </div>

                {/* ==========================================
                    INFO CARDS
                =========================================== */}

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <InfoBlock
                    icon={
                      MapPin
                    }
                    label="State"
                    value={
                      selected.state ||
                      (selected.studentType ===
                      "self_paced"
                        ? "Not collected"
                        : "—")
                    }
                  />

                  <InfoBlock
                    icon={
                      MessageSquare
                    }
                    label="Discord"
                    value={
                      selected.discordUsername
                        ? `@${selected.discordUsername}`
                        : "Not linked"
                    }
                  />

                  <InfoBlock
                    icon={
                      BookOpen
                    }
                    label="Enrollments"
                    value={String(
                      selected
                        .enrollments
                        .length
                    )}
                  />

                  <InfoBlock
                    icon={
                      Calendar
                    }
                    label="Joined"
                    value={formatDate(
                      selected.createdAt
                    )}
                  />
                </div>

                {/* ==========================================
                    ENROLLMENTS
                =========================================== */}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {selected.studentType ===
                        "self_paced"
                          ? "Self-Paced Courses"
                          : "Live Enrollments"}
                      </h4>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {
                          selected.enrollments
                            .length
                        }{" "}
                        total
                      </p>
                    </div>
                  </div>

                  {selected
                    .enrollments
                    .length ===
                  0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <BookOpen className="mx-auto h-6 w-6 text-slate-300" />

                      <p className="mt-2 text-xs font-medium text-slate-500">
                        No
                        enrollments
                        yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.enrollments.map(
                        (
                          enrollment
                        ) => (
                          <EnrollmentCard
                            key={`${enrollment.enrollmentType}:${enrollment.enrollmentId}`}
                            enrollment={
                              enrollment
                            }
                            withdrawing={
                              withdrawing
                            }
                            onWithdraw={
                              handleWithdrawEnrollment
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* ==========================================
                    ACCOUNT ACTIONS
                =========================================== */}

                {selected.studentType ===
                "regular" ? (
                  <div className="border-t border-slate-100 pt-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Account
                      Actions
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSuspendStudent(
                            selected._id
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-amber-600"
                      >
                        <Clock className="h-4 w-4" />

                        Suspend
                        Student
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteStudent(
                            selected._id
                          )
                        }
                        disabled={
                          deleting ===
                          selected._id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ===
                        selected._id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}

                        Remove
                        Student
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

                      <div>
                        <p className="text-xs font-bold text-violet-900">
                          Self-Paced
                          Learner
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-violet-700">
                          Regular
                          student
                          suspend,
                          delete and
                          enrollment
                          withdrawal
                          endpoints
                          are not
                          applied to
                          self-paced
                          records.
                          Manage the
                          relevant
                          course from
                          the
                          self-paced
                          course
                          area.
                        </p>

                        <Link
                          href="/admin/self-paced-courses"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700"
                        >
                          Manage
                          Self-Paced
                          Courses

                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ============================================================
// COUNT CARD
// ============================================================

function CountCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone:
    | "blue"
    | "indigo"
    | "violet";
}) {
  const tones = {
    blue:
      "bg-blue-50 text-blue-600",

    indigo:
      "bg-indigo-50 text-indigo-600",

    violet:
      "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-3 text-lg font-bold text-slate-950 sm:text-xl">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

// ============================================================
// INFO BLOCK
// ============================================================

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-slate-400" />

      <p
        className="mt-2 truncate text-xs font-bold text-slate-900"
        title={
          value
        }
      >
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

// ============================================================
// ENROLLMENT CARD
// ============================================================

function EnrollmentCard({
  enrollment,
  withdrawing,
  onWithdraw,
}: {
  enrollment:
    EnrollmentDetail;

  withdrawing:
    | string
    | null;

  onWithdraw: (
    id: string
  ) => void;
}) {
  const isSelfPaced =
    enrollment.enrollmentType ===
    "self_paced";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isSelfPaced
          ? "border-violet-100 bg-violet-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isSelfPaced
                  ? "bg-violet-100 text-violet-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {isSelfPaced ? (
                <Layers className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {
                  enrollment.courseName
                }
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                with{" "}
                {
                  enrollment.tutorName
                }
              </p>
            </div>
          </div>
        </div>

        <StatusBadge
          status={
            enrollment.status
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <EnrollmentMetric
          label={
            isSelfPaced
              ? "Type"
              : "Plan"
          }
          value={
            PLAN_LABELS[
              enrollment.plan
            ] ||
            enrollment.plan
          }
        />

        <EnrollmentMetric
          label={
            isSelfPaced
              ? "Purchased"
              : "Started"
          }
          value={formatDate(
            enrollment.startDate
          )}
        />

        <EnrollmentMetric
          label="Amount"
          value={formatMoney(
            enrollment.amount
          )}
        />

        <EnrollmentMetric
          label="Average"
          value={
            enrollment.averageScore !==
            null
              ? `${enrollment.averageScore.toFixed(
                  1
                )}%`
              : "No score"
          }
        />
      </div>

      {/* Self paced progress */}

      {isSelfPaced && (
        <div className="mt-4 rounded-xl border border-violet-100 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Course
                Progress
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-700">
                {enrollment.completedWeeks ||
                  0}{" "}
                of{" "}
                {enrollment.totalWeeks ||
                  0}{" "}
                weeks passed
              </p>
            </div>

            <span className="text-sm font-bold text-violet-700">
              {enrollment.progressPercent ||
                0}
              %
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{
                width:
                  `${Math.min(
                    100,
                    enrollment.progressPercent ||
                      0
                  )}%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {enrollment.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                <Lock className="h-3 w-3" />

                {enrollment.lockedAtWeek
                  ? `Locked at week ${enrollment.lockedAtWeek}`
                  : "Locked"}
              </span>
            )}

            {enrollment.completedAt && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">
                <CircleCheck className="h-3 w-3" />

                Completed{" "}
                {formatDate(
                  enrollment.completedAt
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live status detail */}

      {!isSelfPaced && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
          {enrollment.status ===
            "active" &&
            enrollment.daysLeft !==
              null && (
              <span
                className={`font-semibold ${
                  enrollment.daysLeft <=
                  5
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                {enrollment.daysLeft >
                0
                  ? `${enrollment.daysLeft} days remaining`
                  : "Expired"}
              </span>
            )}

          {enrollment.status ===
            "expired" && (
            <span className="font-semibold text-red-600">
              Enrollment
              expired
            </span>
          )}
        </div>
      )}

      {/* Only regular Enrollment uses normal withdraw API */}

      {!isSelfPaced &&
        enrollment.status !==
          "withdrawn" &&
        enrollment.status !==
          "expired" && (
          <button
            type="button"
            onClick={() =>
              onWithdraw(
                enrollment.enrollmentId
              )
            }
            disabled={
              withdrawing ===
              enrollment.enrollmentId
            }
            className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
          >
            {withdrawing ===
            enrollment.enrollmentId ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <UserMinus className="h-3 w-3" />
            )}

            Withdraw
            Enrollment
          </button>
        )}
    </div>
  );
}

// ============================================================
// ENROLLMENT METRIC
// ============================================================

function EnrollmentMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}
// components/tutor/StudentsList.tsx

"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PauseCircle,
  PlayCircle,
  Eye,
  Mail,
  Phone,
  BookOpen,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  GraduationCap,
  Video,
  Lock,
  CircleCheck,
  SlidersHorizontal,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface WeekProgress {
  weekNumber: number;

  examScore: number;

  examTotal: number;

  examPercentage: number;

  passed: boolean;

  attemptsUsed: number;

  attemptedAt:
    | string
    | null;
}

interface CourseEnrollment {
  enrollmentId: string;

  enrollmentType:
    | "regular"
    | "self_paced";

  course: {
    _id: string;
    name: string;
  };

  plan: string;

  status: string;

  startDate:
    | string
    | null;

  endDate:
    | string
    | null;

  amount: number;

  completedWeeks?: number;

  totalWeeks?: number;

  locked?: boolean;

  lockedAtWeek?:
    | number
    | null;

  completedAt?:
    | string
    | null;

  weekProgress?:
    WeekProgress[];
}

interface Student {
  _id: string;

  studentType:
    | "regular"
    | "self_paced";

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  profileImage?:
    | string
    | null;

  createdAt?:
    | string
    | null;

  courses:
    CourseEnrollment[];
}

// ============================================================
// LABELS
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

  trial:
    "border-blue-200 bg-blue-50 text-blue-700",

  expired:
    "border-red-200 bg-red-50 text-red-700",

  paused:
    "border-amber-200 bg-amber-50 text-amber-700",

  pending:
    "border-slate-200 bg-slate-50 text-slate-600",

  suspended:
    "border-red-200 bg-red-50 text-red-700",

  withdrawn:
    "border-slate-200 bg-slate-100 text-slate-500",

  completed:
    "border-violet-200 bg-violet-50 text-violet-700",

  locked:
    "border-orange-200 bg-orange-50 text-orange-700",
};

// ============================================================
// HELPERS
// ============================================================

function getRowKey(
  student: Student
) {
  return `${student.studentType}:${student._id}`;
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let icon =
    <Award size={11} />;

  if (
    status ===
    "active"
  ) {
    icon =
      <CheckCircle size={11} />;
  } else if (
    status ===
      "expired" ||
    status ===
      "suspended"
  ) {
    icon =
      <XCircle size={11} />;
  } else if (
    status ===
    "paused"
  ) {
    icon =
      <Clock size={11} />;
  } else if (
    status ===
    "locked"
  ) {
    icon =
      <Lock size={11} />;
  } else if (
    status ===
    "completed"
  ) {
    icon =
      <CircleCheck size={11} />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
        STATUS_STYLES[
          status
        ] ||
        STATUS_STYLES.pending
      }`}
    >
      {icon}

      {status}
    </span>
  );
}

function StudentTypeBadge({
  type,
}: {
  type:
    | "regular"
    | "self_paced";
}) {
  if (
    type ===
    "self_paced"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
        <GraduationCap className="h-2.5 w-2.5" />

        Self-Paced
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
      <Video className="h-2.5 w-2.5" />

      Live Tutoring
    </span>
  );
}

function getDaysRemaining(
  endDate:
    | string
    | null
) {
  if (!endDate) {
    return null;
  }

  return Math.ceil(
    (
      new Date(
        endDate
      ).getTime() -
      Date.now()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
}

function formatDate(
  date:
    | string
    | null
    | undefined
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

// ============================================================
// COMPONENT
// ============================================================

export default function StudentsList({
  initialStudents,
}: {
  initialStudents:
    Student[];
}) {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "all"
  );

  const [
    typeFilter,
    setTypeFilter,
  ] = useState(
    "all"
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    loadingEnrollmentId,
    setLoadingEnrollmentId,
  ] = useState<
    string | null
  >(null);

  const [
    selectedStudents,
    setSelectedStudents,
  ] = useState<
    Set<string>
  >(new Set());

  const [
    expandedStudents,
    setExpandedStudents,
  ] = useState<
    Set<string>
  >(new Set());

  const itemsPerPage =
    10;

  // ==========================================================
  // FILTERING
  // ==========================================================

  const filteredStudents =
    useMemo(
      () => {
        const q =
          searchTerm
            .trim()
            .toLowerCase();

        return initialStudents.filter(
          (
            student
          ) => {
            const matchesSearch =
              !q ||
              student.firstName
                .toLowerCase()
                .includes(q) ||
              student.lastName
                .toLowerCase()
                .includes(q) ||
              student.email
                .toLowerCase()
                .includes(q) ||
              student.phone
                ?.toLowerCase()
                .includes(q) ||
              student.courses.some(
                (
                  course
                ) =>
                  course.course.name
                    .toLowerCase()
                    .includes(
                      q
                    )
              );

            const matchesStatus =
              statusFilter ===
                "all" ||
              student.courses.some(
                (
                  course
                ) =>
                  course.status ===
                  statusFilter
              );

            const matchesType =
              typeFilter ===
                "all" ||
              student.studentType ===
                typeFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            );
          }
        );
      },
      [
        initialStudents,
        searchTerm,
        statusFilter,
        typeFilter,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredStudents.length /
          itemsPerPage
      )
    );

  const paginatedStudents =
    filteredStudents.slice(
      (
        currentPage -
        1
      ) *
        itemsPerPage,

      currentPage *
        itemsPerPage
    );

  // ==========================================================
  // SELECTION
  // ==========================================================

  const toggleExpanded =
    (
      student: Student
    ) => {
      const key =
        getRowKey(
          student
        );

      const next =
        new Set(
          expandedStudents
        );

      if (
        next.has(
          key
        )
      ) {
        next.delete(
          key
        );
      } else {
        next.add(
          key
        );
      }

      setExpandedStudents(
        next
      );
    };

  const toggleSelectStudent =
    (
      student: Student
    ) => {
      const key =
        getRowKey(
          student
        );

      const next =
        new Set(
          selectedStudents
        );

      if (
        next.has(
          key
        )
      ) {
        next.delete(
          key
        );
      } else {
        next.add(
          key
        );
      }

      setSelectedStudents(
        next
      );
    };

  const currentPageKeys =
    paginatedStudents.map(
      (
        student
      ) =>
        getRowKey(
          student
        )
    );

  const allCurrentSelected =
    currentPageKeys.length >
      0 &&
    currentPageKeys.every(
      (
        key
      ) =>
        selectedStudents.has(
          key
        )
    );

  const toggleSelectAll =
    () => {
      const next =
        new Set(
          selectedStudents
        );

      if (
        allCurrentSelected
      ) {
        currentPageKeys.forEach(
          (
            key
          ) =>
            next.delete(
              key
            )
        );
      } else {
        currentPageKeys.forEach(
          (
            key
          ) =>
            next.add(
              key
            )
        );
      }

      setSelectedStudents(
        next
      );
    };

  // ==========================================================
  // REGULAR ENROLLMENT ACTIONS
  // ==========================================================

  const handlePause =
    async (
      enrollmentId: string
    ) => {
      if (
        !confirm(
          "Pause this enrollment?"
        )
      ) {
        return;
      }

      setLoadingEnrollmentId(
        enrollmentId
      );

      try {
        const res =
          await fetch(
            `/api/enrollments/${enrollmentId}/pause`,
            {
              method:
                "PATCH",
            }
          );

        if (
          res.ok
        ) {
          window.location.reload();

          return;
        }

        alert(
          "Failed to pause enrollment"
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "An error occurred while pausing the enrollment"
        );
      } finally {
        setLoadingEnrollmentId(
          null
        );
      }
    };

  const handleUnpause =
    async (
      enrollmentId: string
    ) => {
      setLoadingEnrollmentId(
        enrollmentId
      );

      try {
        const res =
          await fetch(
            `/api/enrollments/${enrollmentId}/unpause`,
            {
              method:
                "PATCH",
            }
          );

        if (
          res.ok
        ) {
          window.location.reload();

          return;
        }

        alert(
          "Failed to resume enrollment"
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        alert(
          "An error occurred while resuming the enrollment"
        );
      } finally {
        setLoadingEnrollmentId(
          null
        );
      }
    };

  // ==========================================================
  // COURSE CARD
  // ==========================================================

  const CourseRow = ({
    course,
  }: {
    course:
      CourseEnrollment;
  }) => {
    const daysRemaining =
      getDaysRemaining(
        course.endDate
      );

    const isExpiringSoon =
      course.enrollmentType ===
        "regular" &&
      course.status ===
        "active" &&
      daysRemaining !==
        null &&
      daysRemaining >
        0 &&
      daysRemaining <=
        7;

    const progressPercentage =
      course.enrollmentType ===
        "self_paced" &&
      course.totalWeeks &&
      course.totalWeeks >
        0
        ? Math.min(
            100,
            Math.round(
              (
                (
                  course.completedWeeks ||
                  0
                ) /
                course.totalWeeks
              ) *
                100
            )
          )
        : 0;

    return (
      <div
        className={`rounded-xl border p-3 ${
          course.enrollmentType ===
          "self_paced"
            ? "border-violet-100 bg-violet-50/40"
            : "border-slate-100 bg-slate-50/80"
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Course title */}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  course.enrollmentType ===
                  "self_paced"
                    ? "bg-violet-100 text-violet-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {course.enrollmentType ===
                "self_paced" ? (
                  <GraduationCap className="h-3.5 w-3.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                  {
                    course
                      .course
                      .name
                  }
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium text-slate-500">
                    {PLAN_LABELS[
                      course.plan
                    ] ||
                      course.plan}
                  </span>

                  <StatusBadge
                    status={
                      course.status
                    }
                  />

                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600">
                      <AlertTriangle className="h-3 w-3" />

                      {
                        daysRemaining
                      }
                      d left
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Self-paced progress */}

          {course.enrollmentType ===
            "self_paced" && (
            <div className="w-full lg:w-44">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-medium text-slate-500">
                  Course
                  progress
                </span>

                <span className="font-bold text-violet-700">
                  {
                    progressPercentage
                  }
                  %
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all"
                  style={{
                    width:
                      `${progressPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-[10px] text-slate-400">
                {course.completedWeeks ||
                  0}
                /
                {course.totalWeeks ||
                  0}{" "}
                weeks passed
              </p>
            </div>
          )}

          {/* Dates */}

          <div className="shrink-0 text-[10px] text-slate-400">
            {course.enrollmentType ===
            "self_paced" ? (
              <>
                Purchased{" "}
                {formatDate(
                  course.startDate
                )}
              </>
            ) : (
              <>
                {formatDate(
                  course.startDate
                )}{" "}
                →{" "}
                {formatDate(
                  course.endDate
                )}
              </>
            )}
          </div>

          {/* Amount */}

          <div className="shrink-0 text-xs font-bold text-slate-700">
            ₦
            {course.amount.toLocaleString(
              "en-NG"
            )}
          </div>

          {/* Actions – ONLY normal Enrollment */}

          {course.enrollmentType ===
            "regular" && (
            <div className="flex shrink-0 items-center">
              {course.status ===
                "active" && (
                <button
                  type="button"
                  onClick={() =>
                    handlePause(
                      course.enrollmentId
                    )
                  }
                  disabled={
                    loadingEnrollmentId ===
                    course.enrollmentId
                  }
                  className="rounded-lg p-1.5 text-orange-500 transition hover:bg-orange-100 disabled:opacity-50"
                  title="Pause enrollment"
                >
                  {loadingEnrollmentId ===
                  course.enrollmentId ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  ) : (
                    <PauseCircle className="h-4 w-4" />
                  )}
                </button>
              )}

              {course.status ===
                "paused" && (
                <button
                  type="button"
                  onClick={() =>
                    handleUnpause(
                      course.enrollmentId
                    )
                  }
                  disabled={
                    loadingEnrollmentId ===
                    course.enrollmentId
                  }
                  className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                  title="Resume enrollment"
                >
                  {loadingEnrollmentId ===
                  course.enrollmentId ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search student, email, phone or course..."
              value={
                searchTerm
              }
              onChange={(
                e
              ) => {
                setSearchTerm(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />

              Filters
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                e
              ) => {
                setTypeFilter(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">
                All Learning
                Types
              </option>

              <option value="regular">
                Live Tutoring
              </option>

              <option value="self_paced">
                Self-Paced
              </option>
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                e
              ) => {
                setStatusFilter(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="trial">
                Trial
              </option>

              <option value="paused">
                Paused
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="locked">
                Locked
              </option>

              <option value="expired">
                Expired
              </option>

              <option value="withdrawn">
                Withdrawn
              </option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {
              filteredStudents.length
            }{" "}
            student
            {filteredStudents.length !==
            1
              ? "s"
              : ""}{" "}
            found
          </p>

          {(searchTerm ||
            statusFilter !==
              "all" ||
            typeFilter !==
              "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm(
                  ""
                );

                setStatusFilter(
                  "all"
                );

                setTypeFilter(
                  "all"
                );

                setCurrentPage(
                  1
                );
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {paginatedStudents.length ===
      0 ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Users className="h-7 w-7 text-slate-300" />
          </div>

          <p className="text-sm font-semibold text-slate-700">
            No students found
          </p>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
            No students
            currently match
            your search and
            filter options.
          </p>
        </div>
      ) : (
        <>
          {/* =================================================
              DESKTOP
          ================================================== */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={
                        allCurrentSelected
                      }
                      onChange={
                        toggleSelectAll
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </th>

                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Student
                  </th>

                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Enrollments
                  </th>

                  <th className="w-24 px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(
                  (
                    student
                  ) => {
                    const rowKey =
                      getRowKey(
                        student
                      );

                    const isExpanded =
                      expandedStudents.has(
                        rowKey
                      );

                    const summaryCourses =
                      isExpanded
                        ? student.courses
                        : student.courses.slice(
                            0,
                            1
                          );

                    return (
                      <tr
                        key={
                          rowKey
                        }
                        className="group align-top transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(
                              rowKey
                            )}
                            onChange={() =>
                              toggleSelectStudent(
                                student
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                        </td>

                        <td className="w-64 px-4 py-4">
                          <div className="flex items-start gap-3">
                            {student.profileImage ? (
                              <img
                                src={
                                  student.profileImage
                                }
                                alt={`${student.firstName} ${student.lastName}`}
                                className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                                  student.studentType ===
                                  "self_paced"
                                    ? "bg-violet-100 text-violet-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {student.firstName?.[
                                  0
                                ] ||
                                  ""}
                                {student.lastName?.[
                                  0
                                ] ||
                                  ""}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                                  {
                                    student.firstName
                                  }{" "}
                                  {
                                    student.lastName
                                  }
                                </p>

                                <StudentTypeBadge
                                  type={
                                    student.studentType
                                  }
                                />
                              </div>

                              <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                                <Mail className="h-3 w-3 shrink-0" />

                                {student.email ||
                                  "No email"}
                              </p>

                              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <Phone className="h-3 w-3 shrink-0" />

                                {student.phone ||
                                  "No phone"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-3xl space-y-2">
                            {summaryCourses.map(
                              (
                                course
                              ) => (
                                <CourseRow
                                  key={
                                    course.enrollmentId
                                  }
                                  course={
                                    course
                                  }
                                />
                              )
                            )}

                            {student.courses
                              .length >
                              1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleExpanded(
                                    student
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
                              >
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    isExpanded
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />

                                {isExpanded
                                  ? "Show less"
                                  : `View ${
                                      student
                                        .courses
                                        .length -
                                      1
                                    } more`}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/dashboard/tutor/students/${student._id}?type=${student.studentType}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="View student"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE
          ================================================== */}

          <div className="divide-y divide-slate-100 md:hidden">
            {paginatedStudents.map(
              (
                student
              ) => {
                const rowKey =
                  getRowKey(
                    student
                  );

                const isExpanded =
                  expandedStudents.has(
                    rowKey
                  );

                const summaryCourses =
                  isExpanded
                    ? student.courses
                    : student.courses.slice(
                        0,
                        1
                      );

                return (
                  <article
                    key={
                      rowKey
                    }
                    className="p-4"
                  >
                    <div className="mb-4 flex items-start gap-3">
                      {student.profileImage ? (
                        <img
                          src={
                            student.profileImage
                          }
                          alt={`${student.firstName} ${student.lastName}`}
                          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                            student.studentType ===
                            "self_paced"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {student.firstName?.[
                            0
                          ] ||
                            ""}
                          {student.lastName?.[
                            0
                          ] ||
                            ""}
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
                            "No phone"}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/tutor/students/${student._id}?type=${student.studentType}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
                        aria-label="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="space-y-2">
                      {summaryCourses.map(
                        (
                          course
                        ) => (
                          <CourseRow
                            key={
                              course.enrollmentId
                            }
                            course={
                              course
                            }
                          />
                        )
                      )}
                    </div>

                    {student.courses
                      .length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            student
                          )
                        }
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isExpanded
                              ? "rotate-180"
                              : ""
                          }`}
                        />

                        {isExpanded
                          ? "Show fewer courses"
                          : `View ${
                              student
                                .courses
                                .length -
                              1
                            } more course${
                              student
                                .courses
                                .length -
                                1 ===
                              1
                                ? ""
                                : "s"
                            }`}
                      </button>
                    )}
                  </article>
                );
              }
            )}
          </div>
        </>
      )}

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      {filteredStudents.length >
        0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-center text-[11px] text-slate-500 sm:text-left sm:text-xs">
            Showing{" "}
            {Math.min(
              (
                currentPage -
                1
              ) *
                itemsPerPage +
                1,
              filteredStudents.length
            )}
            –
            {Math.min(
              currentPage *
                itemsPerPage,
              filteredStudents.length
            )}{" "}
            of{" "}
            {
              filteredStudents.length
            }
          </p>

          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (
                    page
                  ) =>
                    Math.max(
                      page -
                        1,
                      1
                    )
                )
              }
              disabled={
                currentPage ===
                1
              }
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />

              <span className="hidden sm:inline">
                Previous
              </span>
            </button>

            {[
              ...Array(
                Math.min(
                  5,
                  totalPages
                )
              ),
            ].map(
              (
                _,
                i
              ) => {
                let pageNum =
                  i + 1;

                if (
                  totalPages >
                    5 &&
                  currentPage >
                    3
                ) {
                  pageNum =
                    currentPage >=
                    totalPages -
                      2
                      ? totalPages -
                        4 +
                        i
                      : currentPage -
                        2 +
                        i;
                }

                return (
                  <button
                    type="button"
                    key={
                      pageNum
                    }
                    onClick={() =>
                      setCurrentPage(
                        pageNum
                      )
                    }
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      currentPage ===
                      pageNum
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {
                      pageNum
                    }
                  </button>
                );
              }
            )}

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (
                    page
                  ) =>
                    Math.min(
                      page +
                        1,
                      totalPages
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">
                Next
              </span>

              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
// components/tutor/StudentDetails.tsx

"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Download,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Video,
  Lock,
  CircleCheck,
  TrendingUp,
  Target,
  Layers,
  UserRound,
  Clock3,
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

interface StudentEnrollment {
  _id: string;

  enrollmentType:
    | "regular"
    | "self_paced";

  courseId: {
    _id: string;

    name: string;

    description?: string;
  };

  tutorId: {
    _id: string;

    firstName: string;

    lastName: string;
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

  locked?: boolean;

  lockedAtWeek?:
    | number
    | null;

  completedAt?:
    | string
    | null;

  completedWeeks?: number;

  totalWeeks?: number;

  averageScore?:
    | number
    | null;

  weekProgress?:
    WeekProgress[];
}

interface Grade {
  _id: string;

  examId: {
    _id: string;
    title: string;
  };

  courseId: {
    _id: string;
    name: string;
  };

  score: number;

  total: number;

  percentage: number;

  feedback?: string;

  gradedAt:
    | string
    | null;
}

interface StudentDetailsProps {
  student: {
    studentType:
      | "regular"
      | "self_paced";

    student: {
      _id: string;

      firstName: string;

      lastName: string;

      email: string;

      phone: string;

      state?: string;

      subscriptionStatus:
        string;

      hasUsedFreeTrial:
        boolean;

      profileImage?:
        | string
        | null;

      discordUsername?:
        | string
        | null;

      discordRoles?:
        string[];

      createdAt:
        | string
        | null;
    };

    enrollments:
      StudentEnrollment[];

    grades:
      Grade[];
  };
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

function getScoreStyle(
  percentage: number
) {
  if (
    percentage >=
    70
  ) {
    return {
      bar:
        "bg-emerald-500",

      text:
        "text-emerald-700",

      background:
        "bg-emerald-50",
    };
  }

  if (
    percentage >=
    50
  ) {
    return {
      bar:
        "bg-amber-500",

      text:
        "text-amber-700",

      background:
        "bg-amber-50",
    };
  }

  return {
    bar:
      "bg-red-500",

    text:
      "text-red-700",

    background:
      "bg-red-50",
  };
}

function EnrollmentStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${
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
// COMPONENT
// ============================================================

export default function StudentDetails({
  student,
}: StudentDetailsProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<
    | "profile"
    | "enrollments"
    | "performance"
  >("profile");

  const [
    loading,
    setLoading,
  ] = useState<
    string | null
  >(null);

  const studentData =
    student.student;

  const isSelfPaced =
    student.studentType ===
    "self_paced";

  // ==========================================================
  // REGULAR ENROLLMENT ACTIONS
  // ==========================================================

  const handlePauseEnrollment =
    async (
      enrollmentId: string
    ) => {
      if (
        !confirm(
          "Are you sure you want to pause this student's enrollment?"
        )
      ) {
        return;
      }

      setLoading(
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
          "An error occurred"
        );
      } finally {
        setLoading(
          null
        );
      }
    };

  const handleUnpauseEnrollment =
    async (
      enrollmentId: string
    ) => {
      if (
        !confirm(
          "Are you sure you want to resume this student's enrollment?"
        )
      ) {
        return;
      }

      setLoading(
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
          "An error occurred"
        );
      } finally {
        setLoading(
          null
        );
      }
    };

  // ==========================================================
  // STATS
  // ==========================================================

  const activeCourseCount =
    student.enrollments.filter(
      (
        enrollment
      ) =>
        enrollment.status ===
          "active" ||
        enrollment.status ===
          "trial"
    ).length;

  const regularAverage =
    student.grades.length >
    0
      ? Math.round(
          student.grades.reduce(
            (
              sum,
              grade
            ) =>
              sum +
              grade.percentage,
            0
          ) /
            student.grades
              .length
        )
      : null;

  const selfPacedScores =
    student.enrollments
      .filter(
        (
          enrollment
        ) =>
          enrollment.enrollmentType ===
          "self_paced"
      )
      .flatMap(
        (
          enrollment
        ) =>
          enrollment.weekProgress ||
          []
      );

  const selfPacedAverage =
    selfPacedScores.length >
    0
      ? Math.round(
          selfPacedScores.reduce(
            (
              sum,
              week
            ) =>
              sum +
              week.examPercentage,
            0
          ) /
            selfPacedScores.length
        )
      : null;

  const averageScore =
    isSelfPaced
      ? selfPacedAverage
      : regularAverage;

  const completedCourses =
    student.enrollments.filter(
      (
        enrollment
      ) =>
        enrollment.status ===
        "completed"
    ).length;

  // ==========================================================
  // EXPORTS
  // ==========================================================

  const exportGrades =
    () => {
      const headers = [
        "Exam",
        "Course",
        "Score",
        "Total",
        "Percentage",
        "Feedback",
        "Graded Date",
      ];

      const rows =
        student.grades.map(
          (
            grade
          ) => [
            grade.examId
              .title,

            grade.courseId
              .name,

            grade.score,

            grade.total,

            `${grade.percentage}%`,

            grade.feedback ||
              "-",

            grade.gradedAt
              ? formatDate(
                  grade.gradedAt
                )
              : "-",
          ]
        );

      downloadCsv(
        [
          headers,
          ...rows,
        ],

        `${studentData.firstName}_${studentData.lastName}_grades.csv`
      );
    };

  const exportSelfPacedProgress =
    () => {
      const headers = [
        "Course",
        "Week",
        "Score",
        "Total",
        "Percentage",
        "Passed",
        "Attempts",
        "Attempted Date",
      ];

      const rows =
        student.enrollments.flatMap(
          (
            enrollment
          ) =>
            (
              enrollment.weekProgress ||
              []
            ).map(
              (
                week
              ) => [
                enrollment
                  .courseId
                  .name,

                week.weekNumber,

                week.examScore,

                week.examTotal,

                `${week.examPercentage}%`,

                week.passed
                  ? "Yes"
                  : "No",

                week.attemptsUsed,

                formatDate(
                  week.attemptedAt
                ),
              ]
            )
        );

      downloadCsv(
        [
          headers,
          ...rows,
        ],

        `${studentData.firstName}_${studentData.lastName}_self_paced_progress.csv`
      );
    };

  function downloadCsv(
    rows:
      (string | number)[][],
    filename: string
  ) {
    const csvContent =
      rows
        .map(
          (
            row
          ) =>
            row
              .map(
                (
                  cell
                ) =>
                  `"${String(
                    cell
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [
          csvContent,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      filename;

    anchor.click();

    URL.revokeObjectURL(
      url
    );
  }

  // ==========================================================
  // TABS
  // ==========================================================

  const tabs = [
    {
      id:
        "profile" as const,

      label:
        "Profile",
    },

    {
      id:
        "enrollments" as const,

      label:
        `Courses (${student.enrollments.length})`,
    },

    {
      id:
        "performance" as const,

      label:
        isSelfPaced
          ? `Weekly Progress (${selfPacedScores.length})`
          : `Grades (${student.grades.length})`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        href="/dashboard/tutor/students"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900 sm:text-sm"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to students
      </Link>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-xl sm:rounded-3xl">
        <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-blue-600/20 blur-3xl" />

        {isSelfPaced && (
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
        )}

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {studentData.profileImage ? (
                <img
                  src={
                    studentData.profileImage
                  }
                  alt={`${studentData.firstName} ${studentData.lastName}`}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg sm:h-20 sm:w-20"
                />
              ) : (
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl font-bold text-white shadow-lg sm:h-20 sm:w-20 ${
                    isSelfPaced
                      ? "bg-violet-500/20"
                      : "bg-blue-500/20"
                  }`}
                >
                  {studentData.firstName?.[
                    0
                  ]}
                  {studentData.lastName?.[
                    0
                  ]}
                </div>
              )}

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isSelfPaced
                        ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
                        : "border-blue-400/20 bg-blue-500/10 text-blue-200"
                    }`}
                  >
                    {isSelfPaced ? (
                      <GraduationCap className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}

                    {isSelfPaced
                      ? "Self-Paced Student"
                      : "Live Tutoring Student"}
                  </span>
                </div>

                <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-3xl">
                  {
                    studentData.firstName
                  }{" "}
                  {
                    studentData.lastName
                  }
                </h1>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Joined{" "}
                  {formatDate(
                    studentData.createdAt
                  )}
                </p>
              </div>
            </div>

            {!isSelfPaced && (
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
                  STATUS_STYLES[
                    studentData.subscriptionStatus
                  ] ||
                  STATUS_STYLES.pending
                }`}
              >
                {
                  studentData.subscriptionStatus
                }
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          OVERVIEW CARDS
      ====================================================== */}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoCard
          icon={
            Mail
          }
          title="Email"
          value={
            studentData.email ||
            "Not available"
          }
          iconClass="bg-blue-50 text-blue-600"
        />

        <InfoCard
          icon={
            Phone
          }
          title="Phone"
          value={
            studentData.phone ||
            "Not available"
          }
          iconClass="bg-slate-100 text-slate-600"
        />

        <InfoCard
          icon={
            BookOpen
          }
          title={
            isSelfPaced
              ? "Active Courses"
              : "Active Enrollments"
          }
          value={String(
            activeCourseCount
          )}
          iconClass="bg-violet-50 text-violet-600"
        />

        <InfoCard
          icon={
            Award
          }
          title={
            isSelfPaced
              ? "Average Assessment"
              : "Average Grade"
          }
          value={
            averageScore !==
            null
              ? `${averageScore}%`
              : "—"
          }
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABS */}

        <div className="overflow-x-auto border-b border-slate-100 px-2 sm:px-5">
          <div className="flex min-w-max">
            {tabs.map(
              (
                tab
              ) => (
                <button
                  type="button"
                  key={
                    tab.id
                  }
                  onClick={() =>
                    setActiveTab(
                      tab.id
                    )
                  }
                  className={`relative px-3 py-4 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                    activeTab ===
                    tab.id
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {
                    tab.label
                  }

                  {activeTab ===
                    tab.id && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600 sm:left-5 sm:right-5" />
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* =================================================
              PROFILE
          ================================================== */}

          {activeTab ===
            "profile" && (
            <div className="space-y-7">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Student
                  Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Contact and
                  account details
                  for this
                  learner.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileItem
                  icon={
                    Mail
                  }
                  label="Email Address"
                  value={
                    studentData.email ||
                    "Not available"
                  }
                />

                <ProfileItem
                  icon={
                    Phone
                  }
                  label="Phone Number"
                  value={
                    studentData.phone ||
                    "Not available"
                  }
                />

                <ProfileItem
                  icon={
                    Calendar
                  }
                  label="Joined"
                  value={formatDate(
                    studentData.createdAt
                  )}
                />

                {studentData.state && (
                  <ProfileItem
                    icon={
                      MapPin
                    }
                    label="State"
                    value={
                      studentData.state
                    }
                  />
                )}

                <ProfileItem
                  icon={
                    UserRound
                  }
                  label="Learning Type"
                  value={
                    isSelfPaced
                      ? "Self-Paced Learning"
                      : "Live Tutoring"
                  }
                />

                {!isSelfPaced && (
                  <ProfileItem
                    icon={
                      Clock3
                    }
                    label="Subscription"
                    value={
                      studentData.subscriptionStatus
                    }
                  />
                )}
              </div>

              {!isSelfPaced && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Award className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Free Trial
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {studentData.hasUsedFreeTrial
                          ? "Free trial has been used"
                          : "Free trial has not been used"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* DISCORD */}

              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Discord
                    </h3>

                    <p className="text-xs text-slate-500">
                      Community
                      account and
                      roles.
                    </p>
                  </div>
                </div>

                {studentData.discordUsername ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#5865F2]/10 px-3 py-2 text-sm font-semibold text-[#5865F2]">
                      <ShieldCheck className="h-4 w-4" />

                      @
                      {
                        studentData.discordUsername
                      }
                    </span>

                    {studentData.discordRoles &&
                      studentData.discordRoles
                        .length >
                        0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {studentData.discordRoles.map(
                            (
                              role
                            ) => (
                              <span
                                key={
                                  role
                                }
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                              >
                                {
                                  role
                                }
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    This student
                    has not
                    connected a
                    Discord account.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              ENROLLMENTS
          ================================================== */}

          {activeTab ===
            "enrollments" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isSelfPaced
                    ? "Self-Paced Courses"
                    : "Course Enrollments"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {isSelfPaced
                    ? "Courses this learner purchased from you and their current progress."
                    : "Subscription and enrollment information for courses taught by you."}
                </p>
              </div>

              {student.enrollments.length ===
              0 ? (
                <EmptyState
                  title="No courses found"
                  description="This student has no course relationship with you."
                />
              ) : (
                student.enrollments.map(
                  (
                    enrollment
                  ) => {
                    const progressPercentage =
                      enrollment.enrollmentType ===
                        "self_paced" &&
                      enrollment.totalWeeks &&
                      enrollment.totalWeeks >
                        0
                        ? Math.min(
                            100,

                            Math.round(
                              (
                                (
                                  enrollment.completedWeeks ||
                                  0
                                ) /
                                enrollment.totalWeeks
                              ) *
                                100
                            )
                          )
                        : 0;

                    return (
                      <article
                        key={
                          enrollment._id
                        }
                        className={`rounded-2xl border p-4 transition hover:shadow-sm sm:p-5 ${
                          enrollment.enrollmentType ===
                          "self_paced"
                            ? "border-violet-100 bg-violet-50/30"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  enrollment.enrollmentType ===
                                  "self_paced"
                                    ? "bg-violet-100 text-violet-600"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {enrollment.enrollmentType ===
                                "self_paced" ? (
                                  <GraduationCap className="h-5 w-5" />
                                ) : (
                                  <BookOpen className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                                    {
                                      enrollment.courseId.name
                                    }
                                  </h3>

                                  <EnrollmentStatusBadge
                                    status={
                                      enrollment.status
                                    }
                                  />
                                </div>

                                {enrollment.courseId.description && (
                                  <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-slate-500">
                                    {
                                      enrollment.courseId.description
                                    }
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <MiniDetail
                                label={
                                  enrollment.enrollmentType ===
                                  "self_paced"
                                    ? "Learning Type"
                                    : "Plan"
                                }
                                value={
                                  PLAN_LABELS[
                                    enrollment.plan
                                  ] ||
                                  enrollment.plan
                                }
                              />

                              <MiniDetail
                                label={
                                  enrollment.enrollmentType ===
                                  "self_paced"
                                    ? "Purchased"
                                    : "Start Date"
                                }
                                value={formatDate(
                                  enrollment.startDate
                                )}
                              />

                              <MiniDetail
                                label={
                                  enrollment.enrollmentType ===
                                  "self_paced"
                                    ? "Completed"
                                    : "End Date"
                                }
                                value={
                                  enrollment.enrollmentType ===
                                    "self_paced" &&
                                  !enrollment.completedAt
                                    ? "Not yet"
                                    : formatDate(
                                        enrollment.endDate
                                      )
                                }
                              />

                              <MiniDetail
                                label="Amount Paid"
                                value={`₦${(
                                  enrollment.amount ||
                                  0
                                ).toLocaleString(
                                  "en-NG"
                                )}`}
                              />
                            </div>

                            {/* Self-paced course progress */}

                            {enrollment.enrollmentType ===
                              "self_paced" && (
                              <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                      Course
                                      Progress
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                      {
                                        enrollment.completedWeeks ||
                                        0
                                      }{" "}
                                      of{" "}
                                      {
                                        enrollment.totalWeeks ||
                                        0
                                      }{" "}
                                      weeks
                                      passed
                                    </p>
                                  </div>

                                  <span className="text-lg font-bold text-violet-700">
                                    {
                                      progressPercentage
                                    }
                                    %
                                  </span>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                                  <div
                                    className="h-full rounded-full bg-violet-600"
                                    style={{
                                      width:
                                        `${progressPercentage}%`,
                                    }}
                                  />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <MiniDetail
                                    label="Assessment Average"
                                    value={
                                      enrollment.averageScore !==
                                        null &&
                                      enrollment.averageScore !==
                                        undefined
                                        ? `${enrollment.averageScore}%`
                                        : "—"
                                    }
                                  />

                                  <MiniDetail
                                    label="Access"
                                    value={
                                      enrollment.locked
                                        ? enrollment.lockedAtWeek
                                          ? `Locked at Week ${enrollment.lockedAtWeek}`
                                          : "Locked"
                                        : "Available"
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Regular enrollment controls */}

                          {enrollment.enrollmentType ===
                            "regular" && (
                            <div className="flex shrink-0 items-center gap-2">
                              {enrollment.status ===
                                "active" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePauseEnrollment(
                                      enrollment._id
                                    )
                                  }
                                  disabled={
                                    loading ===
                                    enrollment._id
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                                >
                                  {loading ===
                                  enrollment._id ? (
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                                  ) : (
                                    <PauseCircle className="h-4 w-4" />
                                  )}

                                  Pause
                                </button>
                              )}

                              {enrollment.status ===
                                "paused" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUnpauseEnrollment(
                                      enrollment._id
                                    )
                                  }
                                  disabled={
                                    loading ===
                                    enrollment._id
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  {loading ===
                                  enrollment._id ? (
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}

                                  Resume
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }
                )
              )}
            </div>
          )}

          {/* =================================================
              SELF-PACED PERFORMANCE
          ================================================== */}

          {activeTab ===
            "performance" &&
            isSelfPaced && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Weekly
                      Assessments
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      View the
                      learner's
                      assessment
                      performance
                      across your
                      self-paced
                      courses.
                    </p>
                  </div>

                  {selfPacedScores.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        exportSelfPacedProgress
                      }
                      className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />

                      Export CSV
                    </button>
                  )}
                </div>

                {selfPacedScores.length ===
                0 ? (
                  <EmptyState
                    title="No assessment attempts yet"
                    description="The student has not completed a weekly assessment in your self-paced courses."
                  />
                ) : (
                  student.enrollments.map(
                    (
                      enrollment
                    ) => {
                      if (
                        enrollment.enrollmentType !==
                          "self_paced" ||
                        !enrollment.weekProgress
                          ?.length
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={
                            enrollment._id
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200"
                        >
                          <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {
                                  enrollment.courseId.name
                                }
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Weekly
                                assessment
                                history
                              </p>
                            </div>

                            {enrollment.averageScore !==
                              null &&
                              enrollment.averageScore !==
                                undefined && (
                                <span className="w-fit rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                                  Avg.{" "}
                                  {
                                    enrollment.averageScore
                                  }
                                  %
                                </span>
                              )}
                          </div>

                          {/* Desktop */}

                          <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-100">
                                  {[
                                    "Week",
                                    "Score",
                                    "Performance",
                                    "Result",
                                    "Attempts",
                                    "Date",
                                  ].map(
                                    (
                                      heading
                                    ) => (
                                      <th
                                        key={
                                          heading
                                        }
                                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
                                      >
                                        {
                                          heading
                                        }
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {enrollment.weekProgress.map(
                                  (
                                    week
                                  ) => {
                                    const style =
                                      getScoreStyle(
                                        week.examPercentage
                                      );

                                    return (
                                      <tr
                                        key={
                                          week.weekNumber
                                        }
                                        className="hover:bg-slate-50"
                                      >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                          Week{" "}
                                          {
                                            week.weekNumber
                                          }
                                        </td>

                                        <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                          {
                                            week.examScore
                                          }{" "}
                                          /{" "}
                                          {
                                            week.examTotal
                                          }
                                        </td>

                                        <td className="px-4 py-3">
                                          <div className="flex min-w-[150px] items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                              <div
                                                className={`h-full rounded-full ${style.bar}`}
                                                style={{
                                                  width:
                                                    `${Math.min(
                                                      100,
                                                      week.examPercentage
                                                    )}%`,
                                                }}
                                              />
                                            </div>

                                            <span
                                              className={`w-10 text-right text-xs font-bold ${style.text}`}
                                            >
                                              {
                                                week.examPercentage
                                              }
                                              %
                                            </span>
                                          </div>
                                        </td>

                                        <td className="px-4 py-3">
                                          <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                              week.passed
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                          >
                                            {week.passed ? (
                                              <CheckCircle className="h-3 w-3" />
                                            ) : (
                                              <Target className="h-3 w-3" />
                                            )}

                                            {week.passed
                                              ? "Passed"
                                              : "Not Passed"}
                                          </span>
                                        </td>

                                        <td className="px-4 py-3 text-xs text-slate-600">
                                          {
                                            week.attemptsUsed
                                          }
                                        </td>

                                        <td className="px-4 py-3 text-xs text-slate-500">
                                          {formatDate(
                                            week.attemptedAt
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile */}

                          <div className="divide-y divide-slate-100 md:hidden">
                            {enrollment.weekProgress.map(
                              (
                                week
                              ) => {
                                const style =
                                  getScoreStyle(
                                    week.examPercentage
                                  );

                                return (
                                  <div
                                    key={
                                      week.weekNumber
                                    }
                                    className="p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">
                                          Week{" "}
                                          {
                                            week.weekNumber
                                          }
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                          {
                                            week.examScore
                                          }
                                          /
                                          {
                                            week.examTotal
                                          }{" "}
                                          marks
                                        </p>
                                      </div>

                                      <span
                                        className={`text-lg font-bold ${style.text}`}
                                      >
                                        {
                                          week.examPercentage
                                        }
                                        %
                                      </span>
                                    </div>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className={`h-full rounded-full ${style.bar}`}
                                        style={{
                                          width:
                                            `${Math.min(
                                              100,
                                              week.examPercentage
                                            )}%`,
                                        }}
                                      />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                          week.passed
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-red-50 text-red-700"
                                        }`}
                                      >
                                        {week.passed
                                          ? "Passed"
                                          : "Not Passed"}
                                      </span>

                                      <span className="text-[10px] text-slate-400">
                                        {
                                          week.attemptsUsed
                                        }{" "}
                                        attempt
                                        {week.attemptsUsed !==
                                        1
                                          ? "s"
                                          : ""}{" "}
                                        ·{" "}
                                        {formatDate(
                                          week.attemptedAt
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            )}

          {/* =================================================
              REGULAR GRADES
          ================================================== */}

          {activeTab ===
            "performance" &&
            !isSelfPaced && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Grades &
                      Performance
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Exam scores
                      from this
                      student's
                      enrollments
                      with you.
                    </p>
                  </div>

                  {student.grades.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        exportGrades
                      }
                      className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />

                      Export CSV
                    </button>
                  )}
                </div>

                {student.grades.length ===
                0 ? (
                  <EmptyState
                    title="No grades yet"
                    description="This student has not received an exam grade in your courses."
                  />
                ) : (
                  <>
                    {/* Desktop */}

                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                      <table className="w-full">
                        <thead className="border-b border-slate-100 bg-slate-50">
                          <tr>
                            {[
                              "Exam",
                              "Course",
                              "Score",
                              "Performance",
                              "Feedback",
                              "Date",
                            ].map(
                              (
                                heading
                              ) => (
                                <th
                                  key={
                                    heading
                                  }
                                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
                                >
                                  {
                                    heading
                                  }
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {student.grades.map(
                            (
                              grade
                            ) => {
                              const style =
                                getScoreStyle(
                                  grade.percentage
                                );

                              return (
                                <tr
                                  key={
                                    grade._id
                                  }
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    {
                                      grade.examId.title
                                    }
                                  </td>

                                  <td className="px-4 py-3 text-xs text-slate-600">
                                    {
                                      grade.courseId.name
                                    }
                                  </td>

                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    {
                                      grade.score
                                    }{" "}
                                    /{" "}
                                    {
                                      grade.total
                                    }
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="flex min-w-[150px] items-center gap-3">
                                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                          className={`h-full rounded-full ${style.bar}`}
                                          style={{
                                            width:
                                              `${Math.min(
                                                100,
                                                grade.percentage
                                              )}%`,
                                          }}
                                        />
                                      </div>

                                      <span
                                        className={`w-10 text-right text-xs font-bold ${style.text}`}
                                      >
                                        {
                                          grade.percentage
                                        }
                                        %
                                      </span>
                                    </div>
                                  </td>

                                  <td className="max-w-[220px] px-4 py-3 text-xs text-slate-500">
                                    <span className="line-clamp-2">
                                      {grade.feedback ||
                                        "—"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-xs text-slate-500">
                                    {formatDate(
                                      grade.gradedAt
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}

                    <div className="space-y-3 md:hidden">
                      {student.grades.map(
                        (
                          grade
                        ) => {
                          const style =
                            getScoreStyle(
                              grade.percentage
                            );

                          return (
                            <article
                              key={
                                grade._id
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-900">
                                    {
                                      grade.examId.title
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {
                                      grade.courseId.name
                                    }
                                  </p>
                                </div>

                                <span
                                  className={`text-lg font-bold ${style.text}`}
                                >
                                  {
                                    grade.percentage
                                  }
                                  %
                                </span>
                              </div>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${style.bar}`}
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        grade.percentage
                                      )}%`,
                                  }}
                                />
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-700">
                                  {
                                    grade.score
                                  }
                                  /
                                  {
                                    grade.total
                                  }{" "}
                                  marks
                                </span>

                                <span className="text-[10px] text-slate-400">
                                  {formatDate(
                                    grade.gradedAt
                                  )}
                                </span>
                              </div>

                              {grade.feedback && (
                                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                                  {
                                    grade.feedback
                                  }
                                </p>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function InfoCard({
  icon: Icon,
  title,
  value,
  iconClass,
}: {
  icon: any;
  title: string;
  value: string;
  iconClass: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p
        className="mt-1 truncate text-sm font-bold text-slate-900"
        title={
          value
        }
      >
        {value}
      </p>
    </div>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold capitalize text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold capitalize text-slate-800 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <Layers className="h-5 w-5" />
      </div>

      <p className="text-sm font-semibold text-slate-700">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}
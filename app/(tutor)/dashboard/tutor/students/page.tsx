// app/(tutor)/dashboard/tutor/students/page.tsx

import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import {
  Users,
  Activity,
  Video,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";

import StudentsList from "@/components/tutor/StudentsList";

import {
  getAllTutorStudents,
} from "@/lib/actions/tutor";

import {
  authOptions,
} from "@/lib/auth";

export default async function StudentsPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !session?.user
      ?.email
  ) {
    redirect(
      "/auth/tutor/login"
    );
  }

  const students =
    await getAllTutorStudents(
      session.user.email
    );

  const totalStudents =
    students.length;

  const regularStudents =
    students.filter(
      (
        student: any
      ) =>
        student.studentType ===
        "regular"
    ).length;

  const selfPacedStudents =
    students.filter(
      (
        student: any
      ) =>
        student.studentType ===
        "self_paced"
    ).length;

  const activeStudents =
    students.filter(
      (
        student: any
      ) =>
        student.courses.some(
          (
            course: any
          ) =>
            course.status ===
              "active" ||
            course.status ===
              "trial"
        )
    ).length;

  const needsAttention =
    students.filter(
      (
        student: any
      ) =>
        student.courses.some(
          (
            course: any
          ) =>
            course.status ===
              "expired" ||
            course.status ===
              "locked" ||
            course.status ===
              "suspended"
        )
    ).length;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-0">
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-xl sm:rounded-3xl">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative px-4 py-6 sm:px-7 sm:py-8 lg:px-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-blue-300" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">
                Student Management
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              My Students
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage students enrolled in your live tutoring
              programmes and students learning through your
              self-paced courses.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                Live tutoring
              </span>

              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                Self-paced learning
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================
            STATS
        =================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Total Students"
            value={
              totalStudents
            }
            icon={
              Users
            }
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active"
            value={
              activeStudents
            }
            icon={
              Activity
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Live Tutoring"
            value={
              regularStudents
            }
            icon={
              Video
            }
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Self-Paced"
            value={
              selfPacedStudents
            }
            icon={
              GraduationCap
            }
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            title="Needs Attention"
            value={
              needsAttention
            }
            icon={
              AlertTriangle
            }
            iconClass="bg-amber-50 text-amber-600"
            className="col-span-2 sm:col-span-1"
          />
        </section>

        {/* ==================================================
            STUDENTS
        =================================================== */}

        <StudentsList
          initialStudents={
            students
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  className = "",
}: {
  title: string;
  value: number;
  icon: any;
  iconClass: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${className}`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
        {title}
      </p>
    </div>
  );
}
// app/(tutor)/dashboard/tutor/page.tsx

import {
  getServerSession,
} from "next-auth";

import { redirect } from "next/navigation";

import Link from "next/link";

import TutorStats from "@/components/tutor/TutorStats";
import RecentStudents from "@/components/tutor/RecentStudents";
import UpcomingExams from "@/components/tutor/UpcomingExams";
import OverviewPayments from "@/components/tutor/OverviewPayments";
import ContractPopup from "@/components/tutor/ContractPopup";

import {
  getTutorDashboardData,
} from "@/lib/actions/tutor";

import {
  CalendarDays,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Plus,
  Wallet,
  BookOpen,
} from "lucide-react";

export default async function TutorDashboard() {
  const session =
    await getServerSession();

  if (
    !session?.user?.email
  ) {
    redirect(
      "/auth/tutor/login"
    );
  }

  const dashboardData =
    await getTutorDashboardData(
      session.user.email
    );

  return (
    <>
      <main className="min-h-screen bg-[#F7F8FA] pt-16 lg:pt-0">
        <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7 xl:px-8">

          {/* ===================================================
              HERO
          =================================================== */}

          <section className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
            {/* subtle decoration */}

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-medium text-blue-100 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    Tutor dashboard
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Welcome back,{" "}
                    {dashboardData.tutor.firstName}
                  </h1>

                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                    Manage your students, teaching resources,
                    assessments and earnings from one workspace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/tutor/payments"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition hover:bg-white/[0.14]"
                  >
                    <Wallet className="h-4 w-4" />
                    Payments
                  </Link>

                  <Link
                    href="/dashboard/tutor/exams/create"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    Create exam
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              STATS
          =================================================== */}

          <div className="mt-5">
            <TutorStats
              data={
                dashboardData.stats
              }
            />
          </div>

          {/* ===================================================
              MAIN DASHBOARD AREA
          =================================================== */}

          <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">

            {/* LEFT */}

            <div className="min-w-0 space-y-4">

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RecentStudents
                  students={
                    dashboardData.recentStudents
                  }
                />

                <UpcomingExams
                  exams={
                    dashboardData.upcomingExams
                  }
                />
              </div>

              {/* QUICK ACTIONS */}

              <section>
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Quick actions
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Common tasks you may want to complete.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <QuickActionCard
                    icon={Award}
                    title="Grade submissions"
                    description="Review work awaiting grading."
                    link="/dashboard/tutor/grades"
                  />

                  <QuickActionCard
                    icon={TrendingUp}
                    title="Student progress"
                    description="Review learner activity and performance."
                    link="/dashboard/tutor/students"
                  />

                  <QuickActionCard
                    icon={CalendarDays}
                    title="Create assessment"
                    description="Schedule a new exam for your learners."
                    link="/dashboard/tutor/exams/create"
                  />

                  <QuickActionCard
                    icon={BookOpen}
                    title="Course library"
                    description="Manage teaching resources and materials."
                    link="/dashboard/tutor/library"
                  />

                  <QuickActionCard
                    icon={Wallet}
                    title="Payment history"
                    description="Review earnings and payout status."
                    link="/dashboard/tutor/payments"
                  />
                </div>
              </section>
            </div>

            {/* RIGHT */}

            <aside className="min-w-0">
              <div className="xl:sticky xl:top-5">
                <OverviewPayments />
              </div>
            </aside>
          </section>

        </div>
      </main>

      <ContractPopup />
    </>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  link,
}: {
  icon: any;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="
        group rounded-2xl border border-slate-200/80 bg-white
        p-4 shadow-sm transition-all duration-200
        hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md
      "
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}
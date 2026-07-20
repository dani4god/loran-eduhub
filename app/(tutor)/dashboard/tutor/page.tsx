// app/(tutor)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import TutorStats from "@/components/tutor/TutorStats";
import RecentStudents from "@/components/tutor/RecentStudents";
import UpcomingExams from "@/components/tutor/UpcomingExams";
import { getTutorDashboardData } from "@/lib/actions/tutor";
import { Calendar, TrendingUp, Award, Sparkles, ChevronRight } from "lucide-react";

export default async function TutorDashboard() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const dashboardData = await getTutorDashboardData(session.user.email);

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Welcome banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative px-4 sm:px-6 py-5 sm:py-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-blue-100 text-xs mb-3">
                  <Sparkles className="w-3 h-3" />
                  <span>Welcome back</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {dashboardData.tutor.firstName}
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
                  Here's what's happening with your students today.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="px-3.5 sm:px-4 py-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white rounded-lg transition-all text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Schedule</span>
                </button>
                <Link
                  href="/dashboard/tutor/exams/create"
                  className="px-3.5 sm:px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-all text-xs sm:text-sm font-semibold shadow-lg text-center"
                >
                  + Create Exam
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <Suspense fallback={<StatsSkeleton />}>
          <TutorStats data={dashboardData.stats} />
        </Suspense>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <Suspense fallback={<StudentsSkeleton />}>
            <RecentStudents students={dashboardData.recentStudents} />
          </Suspense>

          <Suspense fallback={<ExamsSkeleton />}>
            <UpcomingExams exams={dashboardData.upcomingExams} />
          </Suspense>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickActionCard
            icon={Award}
            title="Grade Pending"
            description="Submissions awaiting grading"
            color="bg-blue-50 text-blue-600"
            link="/dashboard/tutor/grades"
          />
          <QuickActionCard
            icon={TrendingUp}
            title="Student Progress"
            description="View overall performance"
            color="bg-indigo-50 text-indigo-600"
            link="/dashboard/tutor/students"
          />
          <QuickActionCard
            icon={Calendar}
            title="Schedule Exam"
            description="Set up new assessment"
            color="bg-purple-50 text-purple-600"
            link="/dashboard/tutor/exams/create"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
  link,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all block"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
        <Icon size={16} />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h3>
      <p className="text-gray-400 text-xs">{description}</p>
      <div className="mt-2.5 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
        <span>Get started</span>
        <ChevronRight size={13} className="ml-1" />
      </div>
    </Link>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 animate-pulse">
          <div className="h-2.5 bg-gray-200 rounded w-16 mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-10"></div>
        </div>
      ))}
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-28 mb-5"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-7 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-28 mb-5"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="h-3.5 bg-gray-200 rounded w-36 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-7 bg-gray-200 rounded w-14"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
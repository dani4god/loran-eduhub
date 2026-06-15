// app/(tutor)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TutorStats from "@/components/tutor/TutorStats";
import RecentStudents from "@/components/tutor/RecentStudents";
import UpcomingExams from "@/components/tutor/UpcomingExams";
import { getTutorDashboardData } from "@/lib/actions/tutor";
import { Calendar, TrendingUp, Award, Clock } from "lucide-react";

export default async function TutorDashboard() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const dashboardData = await getTutorDashboardData(session.user.email);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-4">
                <Clock className="w-4 h-4" />
                <span>Welcome Back</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading">
                {dashboardData.tutor.firstName}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Here's what's happening with your students today
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all duration-200 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>View Schedule</span>
              </button>
              <button className="px-5 py-2.5 bg-white text-tutor hover:bg-gray-50 rounded-xl transition-all duration-200 font-semibold shadow-lg">
                + Create Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        <TutorStats data={dashboardData.stats} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<StudentsSkeleton />}>
          <div className="transform transition-all duration-300 hover:translate-y-[-4px]">
            <RecentStudents students={dashboardData.recentStudents} />
          </div>
        </Suspense>

        <Suspense fallback={<ExamsSkeleton />}>
          <div className="transform transition-all duration-300 hover:translate-y-[-4px]">
            <UpcomingExams exams={dashboardData.upcomingExams} />
          </div>
        </Suspense>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <QuickActionCard
          icon={Award}
          title="Grade Pending"
          description="12 submissions need grading"
          color="tutor"
          link="/dashboard/tutor/grades"
        />
        <QuickActionCard
          icon={TrendingUp}
          title="Student Progress"
          description="View overall performance"
          color="brand-primary"
          link="/dashboard/tutor/students"
        />
        <QuickActionCard
          icon={Calendar}
          title="Schedule Exam"
          description="Set up new assessment"
          color="brand-accent"
          link="/dashboard/tutor/exams/create"
        />
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ icon: Icon, title, description, color, link }: any) {
  return (
    <a
      href={link}
      className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 block"
    >
      <div className="p-6">
        <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
        <div className="mt-4 flex items-center text-sm font-medium text-tutor group-hover:translate-x-1 transition-transform duration-200">
          <span>Get started</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-tutor/20 rounded-2xl transition-all duration-300 pointer-events-none" />
    </a>
  );
}

// Loading Skeletons
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
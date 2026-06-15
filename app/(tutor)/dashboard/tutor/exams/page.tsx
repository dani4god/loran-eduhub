// app/(tutor)/dashboard/tutor/exams/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExamsList from "@/components/tutor/ExamsList";
import { authOptions } from "@/lib/auth";
import { getAllTutorExams } from "@/lib/actions/tutor/exams";
import { FileQuestion, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const exams = await getAllTutorExams(session.user.email);

  // Calculate stats
  const totalExams = exams?.length || 0;
  const publishedExams = exams?.filter(e => e.isPublished).length || 0;
  const draftExams = exams?.filter(e => !e.isPublished).length || 0;
  const upcomingExams = exams?.filter(e => e.scheduledDate && new Date(e.scheduledDate) > new Date()).length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-4">
                <FileQuestion className="w-4 h-4" />
                <span>Exam Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading">
                Manage Exams
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Create, edit, and manage your exams. Track student performance and assessments.
              </p>
            </div>
            <Link
              href="/dashboard/tutor/exams/create"
              className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white text-tutor rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
              <span>Create New Exam</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Exams"
          value={totalExams}
          icon={FileQuestion}
          color="tutor"
          gradient="from-tutor/10 to-tutor/5"
        />
        <StatCard
          title="Published"
          value={publishedExams}
          icon={CheckCircle}
          color="green"
          gradient="from-green-500/10 to-green-500/5"
        />
        <StatCard
          title="Drafts"
          value={draftExams}
          icon={Clock}
          color="yellow"
          gradient="from-yellow-500/10 to-yellow-500/5"
        />
        <StatCard
          title="Upcoming"
          value={upcomingExams}
          icon={TrendingUp}
          color="blue"
          gradient="from-blue-500/10 to-blue-500/5"
        />
      </div>

      {/* Exams List */}
      <div className="transform transition-all duration-300">
        <ExamsList initialExams={exams ?? []} />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, gradient }: any) {
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 text-${color}-500`} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-heading">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color}-500 rounded-full transition-all duration-500 group-hover:opacity-80`}
            style={{ width: `${Math.min(100, (value / Math.max(1, value + 10)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
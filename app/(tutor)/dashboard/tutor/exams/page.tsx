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

  const totalExams = exams?.length || 0;
  const publishedExams = exams?.filter((e) => e.isPublished).length || 0;
  const draftExams = exams?.filter((e) => !e.isPublished).length || 0;
  const upcomingExams =
    exams?.filter((e) => e.scheduledDate && new Date(e.scheduledDate) > new Date()).length || 0;

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative px-4 sm:px-6 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileQuestion className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100 text-xs font-medium">Exam Management</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Manage Exams</h1>
                <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                  Create, edit, and track your exams and assessments.
                </p>
              </div>
              <Link
                href="/dashboard/tutor/exams/create"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-sm shadow-lg hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create New Exam
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard title="Total Exams" value={totalExams} icon={FileQuestion} color="bg-blue-50 text-blue-600" />
          <StatCard title="Published" value={publishedExams} icon={CheckCircle} color="bg-green-50 text-green-600" />
          <StatCard title="Drafts" value={draftExams} icon={Clock} color="bg-yellow-50 text-yellow-600" />
          <StatCard title="Upcoming" value={upcomingExams} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
        </div>

        {/* Exams List */}
        <ExamsList initialExams={exams ?? []} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 hover:shadow-sm transition-all">
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <p className="text-base sm:text-lg font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{title}</p>
    </div>
  );
}
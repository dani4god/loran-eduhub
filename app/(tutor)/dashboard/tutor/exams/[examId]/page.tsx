// app/(tutor)/dashboard/tutor/exams/[examId]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileQuestion, 
  Award, 
  Users,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  BarChart3,
  BookOpen,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Star
} from "lucide-react";
import { getExamDetails } from "@/lib/actions/tutor/exams";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const { examId } = await params;

  if (!examId) {
    redirect("/dashboard/tutor/exams");
  }

  const examData = await getExamDetails(examId);

  if (!examData) {
    redirect("/dashboard/tutor/exams");
  }

  const { exam, questions, statistics, submissions } = examData;

  const getStatusBadge = () => {
    if (exam.isPublished) {
      if (exam.scheduledDate && new Date(exam.scheduledDate) < new Date()) {
        return { text: "Completed", color: "gray", icon: CheckCircle };
      }
      return { text: "Published", color: "green", icon: CheckCircle };
    }
    return { text: "Draft", color: "yellow", icon: AlertCircle };
  };

  const status = getStatusBadge();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Link
                  href="/dashboard/tutor/exams"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white/90 hover:bg-white/30 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Exams</span>
                </Link>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(status.color)}`}>
                  <status.icon className="w-4 h-4" />
                  {status.text}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-heading">
                {exam.title}
              </h1>
              <p className="text-white/80 text-lg max-w-3xl">
                {exam.instructions}
              </p>
            </div>
            <div className="flex gap-3">
              {!exam.isPublished && (
                <button className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Publish Exam
                </button>
              )}
              <Link
                href={`/dashboard/tutor/exams/edit/${exam._id}`}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Exam
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Questions"
          value={statistics.totalQuestions}
          icon={FileQuestion}
          color="tutor"
        />
        <StatCard
          title="Total Marks"
          value={statistics.totalMarks}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Duration"
          value={`${exam.duration} min`}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Submissions"
          value={statistics.submissions}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Avg. Score"
          value={`${statistics.averageScore}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Grade Distribution */}
      {statistics.submissions > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          <div className="grid grid-cols-5 gap-4">
            <GradeBar label="Excellent" value={statistics.gradeDistribution.excellent} total={statistics.submissions} color="bg-green-500" />
            <GradeBar label="Good" value={statistics.gradeDistribution.good} total={statistics.submissions} color="bg-blue-500" />
            <GradeBar label="Average" value={statistics.gradeDistribution.average} total={statistics.submissions} color="bg-yellow-500" />
            <GradeBar label="Poor" value={statistics.gradeDistribution.poor} total={statistics.submissions} color="bg-red-500" />
            <GradeBar label="Not Graded" value={statistics.gradeDistribution.notGraded} total={statistics.submissions} color="bg-gray-400" />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Questions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {questions.length} question{questions.length !== 1 ? "s" : ""} • Total {statistics.totalMarks} marks
                </p>
              </div>
              <button className="text-tutor hover:text-tutor/80 text-sm font-medium flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {questions.length === 0 ? (
                <div className="p-12 text-center">
                  <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No questions added yet</p>
                </div>
              ) : (
                questions.map((question: any, index: number) => (
                  <div key={question._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tutor/10 text-tutor flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {question.type.replace("-", " ")}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-tutor">{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-gray-700 mb-3 pl-11">{question.questionText}</p>
                    {question.type === "mcq" && question.options && (
                      <div className="pl-11 space-y-1 mt-2">
                        {question.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${opt === question.correctAnswer ? "bg-green-500" : "bg-gray-300"}`} />
                            <span className={opt === question.correctAnswer ? "text-green-700 font-medium" : "text-gray-600"}>
                              {opt}
                              {opt === question.correctAnswer && " ✓"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type === "true-or-false" && (
                      <div className="pl-11 mt-2 flex gap-4">
                        <span className={`text-sm ${question.correctAnswer === "true" ? "text-green-600 font-medium" : "text-gray-500"}`}>
                          True {question.correctAnswer === "true" && "✓"}
                        </span>
                        <span className={`text-sm ${question.correctAnswer === "false" ? "text-green-600 font-medium" : "text-gray-500"}`}>
                          False {question.correctAnswer === "false" && "✓"}
                        </span>
                      </div>
                    )}
                    {question.type === "fill-in-the-gap" && (
                      <div className="pl-11 mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          Answer: {question.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {statistics.submissions > 0 && (
                <Link
                  href={`/dashboard/tutor/exams/${exam._id}/results`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-tutor/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-tutor" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">View Results</p>
                    <p className="text-xs text-gray-500">{statistics.submissions} student submission{statistics.submissions !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              )}
              
              <Link
                href={`/dashboard/tutor/exams/edit/${exam._id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Edit Exam</p>
                  <p className="text-xs text-gray-500">Modify questions or settings</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Exam Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Exam Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Course</label>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="w-4 h-4 text-tutor" />
                  <span className="text-gray-900 font-medium">{exam.courseId?.name || "N/A"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-tutor" />
                  <span className="text-gray-900">
                    {exam.scheduledDate 
                      ? new Date(exam.scheduledDate).toLocaleString()
                      : "Not scheduled"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-tutor" />
                  <span className="text-gray-900">
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-tutor" />
                  <span className="text-gray-900">
                    {new Date(exam.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions Preview */}
          {submissions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {submissions.slice(0, 3).map((submission: any) => (
                  <div key={submission._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{submission.studentName}</p>
                      <span className={`text-sm font-medium ${submission.percentage >= 70 ? "text-green-600" : submission.percentage >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {submission.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {submissions.length > 3 && (
                  <Link
                    href={`/dashboard/tutor/exams/${exam._id}/results`}
                    className="block p-3 text-center text-tutor hover:bg-gray-50 text-sm font-medium"
                  >
                    View all {submissions.length} submissions →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon: Icon, color }: any) {
  const getColorClasses = () => {
    switch (color) {
      case "tutor": return "bg-tutor/10 text-tutor";
      case "green": return "bg-green-100 text-green-600";
      case "blue": return "bg-blue-100 text-blue-600";
      case "purple": return "bg-purple-100 text-purple-600";
      case "orange": return "bg-orange-100 text-orange-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]">
      <div className="relative p-5">
        <div className={`w-10 h-10 rounded-xl ${getColorClasses()} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 font-heading">
          {value}
        </p>
      </div>
    </div>
  );
}

function GradeBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function getStatusColor(color: string) {
  switch (color) {
    case "green": return "bg-green-500/20 text-green-200 border-green-500/30";
    case "yellow": return "bg-yellow-500/20 text-yellow-200 border-yellow-500/30";
    case "gray": return "bg-gray-500/20 text-gray-200 border-gray-500/30";
    default: return "bg-gray-500/20 text-gray-200 border-gray-500/30";
  }
}
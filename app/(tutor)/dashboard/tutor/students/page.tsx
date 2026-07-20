// app/(tutor)/dashboard/tutor/students/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentsList from "@/components/tutor/StudentsList";
import { getAllTutorStudents } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";
import { Users, TrendingUp, Clock, XCircle } from "lucide-react";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const students = await getAllTutorStudents(session.user.email);

  // Stats computed from each student's courses[] — status now lives per
  // enrollment, not on the student directly. A student counts toward
  // "Active" if ANY of their courses with this tutor is active, etc.
  const totalStudents = students.length;
  const activeStudents = students.filter((s) =>
    s.courses.some((c: any) => c.status === "active")
  ).length;
  const trialStudents = students.filter((s) =>
    s.courses.some((c: any) => c.plan === "trial" && c.status === "active")
  ).length;
  const expiredStudents = students.filter((s) =>
    s.courses.every((c: any) => c.status === "expired" || c.status === "withdrawn")
  ).length;

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative px-4 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-200" />
              <span className="text-blue-100 text-xs font-medium">Student Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">My Students</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Manage your enrolled students and monitor subscription status.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard title="Total Students" value={totalStudents} icon={Users} color="bg-blue-50 text-blue-600" />
          <StatCard title="Active" value={activeStudents} icon={TrendingUp} color="bg-green-50 text-green-600" />
          <StatCard title="On Trial" value={trialStudents} icon={Clock} color="bg-indigo-50 text-indigo-600" />
          <StatCard title="Expired" value={expiredStudents} icon={XCircle} color="bg-red-50 text-red-600" />
        </div>

        {/* Students List */}
        <StudentsList initialStudents={students} />
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
      <p className="text-base sm:text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{title}</p>
    </div>
  );
}
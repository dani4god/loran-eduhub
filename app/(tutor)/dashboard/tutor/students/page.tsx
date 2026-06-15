// app/(tutor)/dashboard/tutor/students/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import StudentsList from "@/components/tutor/StudentsList";
import { getAllTutorStudents } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";
import { Users, UserPlus, Download, Filter, TrendingUp } from "lucide-react";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const students = await getAllTutorStudents(session.user.email);

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "active").length;
  const trialStudents = students.filter(s => s.status === "trial").length;
  const expiredStudents = students.filter(s => s.status === "expired").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-4">
                <Users className="w-4 h-4" />
                <span>Student Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading">
                My Students
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Manage your enrolled students, track their progress, and monitor subscription status.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export List
              </button>
              <button className="px-5 py-2.5 bg-white text-tutor rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold">
                <UserPlus className="w-4 h-4" />
                Invite Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="tutor"
          trend="+12%"
        />
        <StatCard
          title="Active"
          value={activeStudents}
          icon={TrendingUp}
          color="green"
          trend="+5%"
        />
        <StatCard
          title="Trial"
          value={trialStudents}
          icon={Filter}
          color="blue"
        />
        <StatCard
          title="Expired"
          value={expiredStudents}
          icon={UserPlus}
          color="red"
        />
      </div>

      {/* Students List Component */}
      <div className="transform transition-all duration-300">
        <StudentsList initialStudents={students} />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const getColorClasses = () => {
    switch (color) {
      case "tutor": return "bg-tutor/10 text-tutor";
      case "green": return "bg-green-100 text-green-600";
      case "blue": return "bg-blue-100 text-blue-600";
      case "red": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${getColorClasses()} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-heading">
            {value}
          </p>
        </div>
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColorClasses().split(' ')[0]} rounded-full transition-all duration-500 group-hover:opacity-80`}
            style={{ width: `${Math.min(100, (value / Math.max(1, value + 50)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
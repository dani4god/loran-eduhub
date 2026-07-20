// components/tutor/TutorStats.tsx
"use client";

import { Users, BookOpen, Clock, Award, Wallet } from "lucide-react";

interface TutorStatsProps {
  data: {
    totalStudents: number;
    activeEnrollments: number;
    totalExams: number;
    pendingGrading: number;
    totalEarnings: number;
  };
}

export default function TutorStats({ data }: TutorStatsProps) {
  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Enrollments",
      value: data.activeEnrollments,
      icon: BookOpen,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Exams",
      value: data.totalExams,
      icon: Clock,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Pending Grading",
      value: data.pendingGrading,
      icon: Award,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Total Earnings",
      value: `₦${data.totalEarnings.toLocaleString("en-NG")}`,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 hover:shadow-sm transition-all"
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{stat.value}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{stat.title}</p>
          </div>
        );
      })}
    </div>
  );
}
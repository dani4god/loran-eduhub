// components/tutor/TutorStats.tsx
"use client";

import { Users, BookOpen, Clock, Award } from "lucide-react";

interface TutorStatsProps {
  data: {
    totalStudents: number;
    activeEnrollments: number;
    totalExams: number;
    pendingGrading: number;
  };
}

export default function TutorStats({ data }: TutorStatsProps) {
  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Enrollments",
      value: data.activeEnrollments,
      icon: BookOpen,
      color: "bg-green-500",
    },
    {
      title: "Total Exams",
      value: data.totalExams,
      icon: Clock,
      color: "bg-purple-500",
    },
    {
      title: "Pending Grading",
      value: data.pendingGrading,
      icon: Award,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
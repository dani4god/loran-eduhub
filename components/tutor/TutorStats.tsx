// components/tutor/TutorStats.tsx

"use client";

import {
  Users,
  BookOpen,
  ClipboardCheck,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

interface TutorStatsProps {
  data: {
    totalStudents: number;
    activeEnrollments: number;
    totalExams: number;
    pendingGrading: number;
    totalEarnings: number;
  };
}

function formatMoney(amount: number) {
  return `₦${Number(
    amount || 0
  ).toLocaleString("en-NG")}`;
}

export default function TutorStats({
  data,
}: TutorStatsProps) {
  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents.toLocaleString(),
      description: "Students connected to you",
      icon: Users,
      iconClass:
        "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Enrollments",
      value:
        data.activeEnrollments.toLocaleString(),
      description: "Currently active learners",
      icon: BookOpen,
      iconClass:
        "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Exams",
      value: data.totalExams.toLocaleString(),
      description: "Assessments created",
      icon: ClipboardCheck,
      iconClass:
        "bg-violet-50 text-violet-600",
    },
    {
      title: "Pending Grading",
      value:
        data.pendingGrading.toLocaleString(),
      description: "Need your attention",
      icon: ClipboardCheck,
      iconClass:
        "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Earnings",
      value: formatMoney(
        data.totalEarnings
      ),
      description: "Recorded tutor earnings",
      icon: Wallet,
      iconClass:
        "bg-cyan-50 text-cyan-700",
      emphasized: true,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            Performance overview
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            A quick summary of your teaching activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.title}
              className={`
                group relative overflow-hidden rounded-2xl
                border bg-white p-4 transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-md
                ${
                  stat.emphasized
                    ? "border-blue-100"
                    : "border-slate-100"
                }
              `}
            >
              {stat.emphasized && (
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-500" />
              )}

              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-xl
                    ${stat.iconClass}
                  `}
                >
                  <Icon className="h-[17px] w-[17px]" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
              </div>

              <p className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {stat.value}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-700">
                {stat.title}
              </p>

              <p className="mt-1 hidden text-[11px] leading-4 text-slate-400 sm:block">
                {stat.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
// components/tutor/UpcomingExams.tsx
"use client";

import Link from "next/link";
import { Calendar, Clock, ChevronRight, FileQuestion } from "lucide-react";

interface Exam {
  _id: string;
  title: string;
  course: string;
  scheduledDate: string | null;
}

export default function UpcomingExams({ exams }: { exams: Exam[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="p-5 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Exams</h2>
          <Link
            href="/dashboard/tutor/exams"
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold flex items-center gap-1 shrink-0"
          >
            <span className="hidden sm:inline">Manage Exams</span>
            <span className="sm:hidden">Manage</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {exams.length === 0 ? (
          <div className="p-8 sm:p-10 text-center">
            <FileQuestion className="w-9 h-9 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming exams scheduled</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam._id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{exam.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{exam.course}</p>
                </div>
                <Link
                  href={`/dashboard/tutor/exams/${exam._id}`}
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold shrink-0"
                >
                  View →
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {exam.scheduledDate
                    ? new Date(exam.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : "No date"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {exam.scheduledDate
                    ? new Date(exam.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "No time"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// components/tutor/UpcomingExams.tsx
"use client";

import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";

interface Exam {
  _id: string;
  title: string;
  course: string;
  scheduledDate: string | null;
}

export default function UpcomingExams({ exams }: { exams: Exam[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Exams</h2>
          <Link
            href="/dashboard/tutor/exams"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            Manage Exams <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {exams.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">
            No upcoming exams scheduled
          </p>
        ) : (
          exams.map((exam) => (
            <div key={exam._id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{exam.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Course: {exam.course}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {exam.scheduledDate
                      ? new Date(exam.scheduledDate).toLocaleDateString()
                      : "No date"}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {exam.scheduledDate
                      ? new Date(exam.scheduledDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "No time"}
                  </div>

                  <Link
                    href={`/dashboard/tutor/exams/${exam._id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
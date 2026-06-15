// components/tutor/GradesList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle, Clock } from "lucide-react";

interface ExamToGrade {
  _id: string;
  title: string;
  course: {
    name: string;
  };
  submissions: Array<{
    studentId: string;
    studentName: string;
    submittedAt: string | null;
    isGraded: boolean;
  }>;
}

export default function GradesList({
  exams,
}: {
  exams: ExamToGrade[];
}) {
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const getStats = (exam: ExamToGrade) => {
    const total = exam.submissions.length;
    const graded = exam.submissions.filter((s) => s.isGraded).length;
    const pending = total - graded;
    return { total, graded, pending };
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not submitted";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No exams with submissions to grade
          </p>
          <Link
            href="/dashboard/tutor/exams/create"
            className="inline-block mt-4 text-blue-600 hover:text-blue-700"
          >
            Create an exam →
          </Link>
        </div>
      ) : (
        exams.map((exam) => {
          const stats = getStats(exam);

          return (
            <div
              key={exam._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* HEADER */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedExam(
                    expandedExam === exam._id ? null : exam._id
                  )
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Course: {exam.course.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.graded}
                      </p>
                      <p className="text-xs text-gray-600">Graded</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.pending}
                      </p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedExam === exam._id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SUBMISSIONS */}
              {expandedExam === exam._id && (
                <div className="border-t border-gray-200">
                  <div className="divide-y divide-gray-200">
                    {exam.submissions.map((submission) => (
                      <div
                        key={submission.studentId}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {submission.studentName}
                            </p>

                            <p className="text-sm text-gray-600">
                              Submitted: {formatDate(submission.submittedAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {submission.isGraded ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Graded
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Clock className="w-4 h-4" />
                                Pending
                              </span>
                            )}

                            <Link
                              href={`/dashboard/tutor/exams/${exam._id}/results?student=${submission.studentId}`}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              {submission.isGraded
                                ? "View Grade"
                                : "Grade Now"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
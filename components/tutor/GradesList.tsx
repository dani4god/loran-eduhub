// components/tutor/GradesList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronDown, CheckCircle, Clock, TrendingUp,
  FileQuestion, ClipboardList, User,
} from "lucide-react";
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from "@/lib/certificate";

interface ExamToGrade {
  _id: string;
  title: string;
  course: { name: string };
  submissions: Array<{
    studentId: string;
    studentName: string;
    submittedAt: string | null;
    isGraded: boolean;
  }>;
}

interface StudentAverage {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  averageScore: number;
  itemCount: number;
  hasAnyGrades: boolean;
  classification: "distinction" | "credit" | "pass" | "fail" | null;
  status: string;
}

interface PendingAssignment {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  totalScore: number;
  studentId: string;
  studentName: string;
  courseName: string;
  submittedAt: string;
}

type Tab = "averages" | "assignments" | "exams";

function formatDate(date: string | null) {
  if (!date) return "Not submitted";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function GradesList({ exams }: { exams: ExamToGrade[] }) {
  const [tab, setTab] = useState<Tab>("averages");
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const [studentAverages, setStudentAverages] = useState<StudentAverage[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    fetch("/api/tutor/grades/overview")
      .then((r) => r.json())
      .then((d) => {
        setStudentAverages(d.studentAverages || []);
        setPendingAssignments(d.pendingAssignments || []);
      })
      .finally(() => setLoadingOverview(false));
  }, []);

  const examPendingCount = exams.reduce(
    (sum, ex) => sum + ex.submissions.filter((s) => !s.isGraded).length,
    0
  );

  const TABS: { id: Tab; label: string; count?: number; icon: any }[] = [
    { id: "averages", label: "Student Averages", icon: TrendingUp },
    { id: "assignments", label: "Assignments", count: pendingAssignments.length, icon: ClipboardList },
    { id: "exams", label: "Exam Submissions", count: examPendingCount, icon: FileQuestion },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1.5 border-b border-gray-100 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              }`}
            >
              <Icon size={14} />
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Student Averages ── */}
      {tab === "averages" && (
        <div>
          {loadingOverview ? (
            <div className="py-10 text-center">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : studentAverages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No enrolled students yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studentAverages.map((s) => (
                <div key={s.enrollmentId} className="bg-white rounded-xl border border-gray-100 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <User size={13} className="text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.studentName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{s.courseName}</p>
                    </div>
                  </div>

                  {s.hasAnyGrades ? (
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: CLASSIFICATION_COLORS[s.classification!] }}
                      >
                        {s.averageScore.toFixed(1)}% · {CLASSIFICATION_LABELS[s.classification!]}
                      </span>
                      <span className="text-[10px] text-gray-400">{s.itemCount} graded</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-gray-400">No grades yet</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pending Assignments ── */}
      {tab === "assignments" && (
        <div>
          {loadingOverview ? (
            <div className="py-10 text-center">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No assignments awaiting grading.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {pendingAssignments.map((s) => (
                <div key={s.submissionId} className="flex items-center gap-3 p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.assignmentTitle}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {s.studentName} · {s.courseName} · Submitted {formatDate(s.submittedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/tutor/assignments`}
                    className="shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Grade
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Exam Submissions ── */}
      {tab === "exams" && (
        <div className="space-y-3">
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <FileQuestion className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No exams with submissions yet.</p>
              <Link
                href="/dashboard/tutor/exams/create"
                className="inline-block mt-3 text-blue-600 text-xs font-semibold hover:underline"
              >
                Create an exam →
              </Link>
            </div>
          ) : (
            exams.map((exam) => {
              const total = exam.submissions.length;
              const graded = exam.submissions.filter((s) => s.isGraded).length;
              const pending = total - graded;
              const isExpanded = expandedExam === exam._id;

              return (
                <div key={exam._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedExam(isExpanded ? null : exam._id)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{exam.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">{exam.course.name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500">{total} total</span>
                      {pending > 0 && (
                        <span className="text-xs font-semibold text-orange-600">{pending} pending</span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {exam.submissions.map((submission) => (
                        <div key={submission.studentId} className="flex items-center gap-3 p-3 sm:p-3.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{submission.studentName}</p>
                            <p className="text-[11px] text-gray-400">{formatDate(submission.submittedAt)}</p>
                          </div>
                          {submission.isGraded ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 shrink-0">
                              <CheckCircle size={13} /> Graded
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 shrink-0">
                              <Clock size={13} /> Pending
                            </span>
                          )}
                          <Link
                            href={`/dashboard/tutor/exams/${exam._id}/results?student=${submission.studentId}`}
                            className="shrink-0 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
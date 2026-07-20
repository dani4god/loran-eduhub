// components/tutor/StudentDetails.tsx
"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Download,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

interface StudentDetailsProps {
  student: {
    student: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      state?: string;
      subscriptionStatus: string;
      hasUsedFreeTrial: boolean;
      discordUsername?: string | null;
      discordRoles?: string[];
      createdAt: string | null;
    };
    enrollments: Array<{
      _id: string;
      courseId: { _id: string; name: string; description?: string };
      tutorId: { _id: string; firstName: string; lastName: string };
      plan: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
      amount: number;
    }>;
    grades: Array<{
      _id: string;
      examId: { _id: string; title: string };
      courseId: { _id: string; name: string };
      score: number;
      total: number;
      percentage: number;
      feedback?: string;
      gradedAt: string | null;
    }>;
  };
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Free Trial",
  monthly: "Monthly",
  "3months": "3 Months",
  "6months": "6 Months",
  "1year": "1 Year Diploma",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trial: "bg-blue-100 text-blue-800",
  expired: "bg-red-100 text-red-800",
  paused: "bg-yellow-100 text-yellow-800",
  pending: "bg-gray-100 text-gray-700",
  suspended: "bg-red-100 text-red-800",
};

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentDetails({ student }: StudentDetailsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "enrollments" | "grades">("profile");
  const [loading, setLoading] = useState<string | null>(null);

  const studentData = student.student;

  const handlePauseEnrollment = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to pause this student's enrollment?")) return;
    setLoading(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/pause`, { method: "PATCH" });
      if (res.ok) window.location.reload();
      else alert("Failed to pause enrollment");
    } finally {
      setLoading(null);
    }
  };

  const handleUnpauseEnrollment = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to resume this student's enrollment?")) return;
    setLoading(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/unpause`, { method: "PATCH" });
      if (res.ok) window.location.reload();
      else alert("Failed to resume enrollment");
    } finally {
      setLoading(null);
    }
  };

  const exportGrades = () => {
    const headers = ["Exam", "Course", "Score", "Total", "Percentage", "Feedback", "Graded Date"];
    const rows = student.grades.map((g) => [
      g.examId.title, g.courseId.name, g.score, g.total, `${g.percentage}%`,
      g.feedback || "-", g.gradedAt ? formatDate(g.gradedAt) : "-",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentData.firstName}_${studentData.lastName}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCourseCount = student.enrollments.filter(e => e.status === "active" || e.status === "trial").length;
  const avgScore = student.grades.length > 0
    ? Math.round(student.grades.reduce((sum, g) => sum + g.percentage, 0) / student.grades.length)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-tutor to-brand-primary px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {studentData.firstName?.[0]}{studentData.lastName?.[0]}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-white truncate">
                  {studentData.firstName} {studentData.lastName}
                </h1>
                <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                  Joined {formatDate(studentData.createdAt)}
                </p>
              </div>
            </div>
            <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${STATUS_STYLES[studentData.subscriptionStatus] || STATUS_STYLES.pending}`}>
              {studentData.subscriptionStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">{studentData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <Phone className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900 truncate">{studentData.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Active Courses</p>
              <p className="text-sm font-medium text-gray-900">{activeCourseCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <Award className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Average Score</p>
              <p className="text-sm font-medium text-gray-900">{avgScore !== null ? `${avgScore}%` : "—"}</p>
            </div>
          </div>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-4 sm:px-6 no-scrollbar">
          {[
            { id: "profile" as const, label: "Profile" },
            { id: "enrollments" as const, label: `Enrollments (${student.enrollments.length})` },
            { id: "grades" as const, label: `Grades (${student.grades.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-tutor border-tutor"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {studentData.state && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-gray-900 text-sm">{studentData.state}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Status</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      studentData.subscriptionStatus === "active" ? "bg-green-500"
                      : studentData.subscriptionStatus === "trial" ? "bg-blue-500"
                      : "bg-red-500"
                    }`} />
                    <span className="text-gray-900 text-sm capitalize">{studentData.subscriptionStatus}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Free Trial Used</h3>
                  <p className="text-gray-900 text-sm">{studentData.hasUsedFreeTrial ? "Yes" : "No"}</p>
                </div>
              </div>

              {/* Discord info */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Discord
                </h3>
                {studentData.discordUsername ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/10 text-[#5865F2] rounded-lg text-sm font-medium w-fit">
                      <ShieldCheck className="w-3.5 h-3.5" /> @{studentData.discordUsername}
                    </span>
                    {studentData.discordRoles && studentData.discordRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {studentData.discordRoles.map(role => (
                          <span key={role} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not connected</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "enrollments" && (
            <div className="space-y-4">
              {student.enrollments.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No enrollments found</p>
              ) : (
                student.enrollments.map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-tutor shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">{enrollment.courseId.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          <p className="text-gray-600">
                            Plan: <span className="font-medium text-gray-900">{PLAN_LABELS[enrollment.plan] || enrollment.plan}</span>
                          </p>
                          <p className="text-gray-600">
                            Status:{" "}
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[enrollment.status] || STATUS_STYLES.pending}`}>
                              {enrollment.status}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Amount: <span className="font-medium text-gray-900">₦{enrollment.amount?.toLocaleString() || 0}</span>
                          </p>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(enrollment.startDate)}
                          </p>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(enrollment.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {enrollment.status === "active" && (
                          <button
                            onClick={() => handlePauseEnrollment(enrollment._id)}
                            disabled={loading === enrollment._id}
                            className="px-3 py-1.5 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 text-sm flex items-center gap-1 disabled:opacity-50"
                          >
                            <PauseCircle className="w-4 h-4" /> Pause
                          </button>
                        )}
                        {enrollment.status === "paused" && (
                          <button
                            onClick={() => handleUnpauseEnrollment(enrollment._id)}
                            disabled={loading === enrollment._id}
                            className="px-3 py-1.5 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 text-sm flex items-center gap-1 disabled:opacity-50"
                          >
                            <PlayCircle className="w-4 h-4" /> Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "grades" && (
            <div>
              {student.grades.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={exportGrades}
                    className="px-3 py-1.5 text-sm text-tutor border border-tutor rounded-lg hover:bg-tutor/5 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              )}

              {student.grades.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No grades available</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {["Exam", "Course", "Score", "Percentage", "Feedback", "Date"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {student.grades.map((grade) => (
                          <tr key={grade._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{grade.examId.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{grade.courseId.name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{grade.score} / {grade.total}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      grade.percentage >= 70 ? "bg-green-500" : grade.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${grade.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{grade.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{grade.feedback || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{grade.gradedAt ? formatDate(grade.gradedAt) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {student.grades.map((grade) => (
                      <div key={grade._id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{grade.examId.title}</p>
                            <p className="text-xs text-gray-500">{grade.courseId.name}</p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 shrink-0">{grade.score}/{grade.total}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                grade.percentage >= 70 ? "bg-green-500" : grade.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${grade.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{grade.percentage}%</span>
                        </div>
                        {grade.feedback && <p className="text-xs text-gray-500 mb-1">{grade.feedback}</p>}
                        <p className="text-xs text-gray-400">{grade.gradedAt ? formatDate(grade.gradedAt) : "-"}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
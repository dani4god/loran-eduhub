// components/tutor/StudentDetails.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
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
  User,
  CreditCard,
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
      createdAt: string | null; // Allow null
    };
    enrollments: Array<{
      _id: string;
      courseId: {
        _id: string;
        name: string;
        description?: string;
      };
      tutorId: {
        _id: string;
        firstName: string;
        lastName: string;
      };
      plan: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
      amount: number;
    }>;
    grades: Array<{
      _id: string;
      examId: {
        _id: string;
        title: string;
      };
      courseId: {
        _id: string;
        name: string;
      };
      score: number;
      total: number;
      percentage: number;
      feedback?: string;
      gradedAt: string | null;
    }>;
  };
}

export default function StudentDetails({ student }: StudentDetailsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "enrollments" | "grades">("profile");
  const [loading, setLoading] = useState(false);

  const handlePauseEnrollment = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to pause this student's enrollment?")) {
      setLoading(true);
      const response = await fetch(`/api/enrollments/${enrollmentId}/pause`, {
        method: "PATCH",
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to pause enrollment");
      }
      setLoading(false);
    }
  };

  const handleUnpauseEnrollment = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to resume this student's enrollment?")) {
      setLoading(true);
      const response = await fetch(`/api/enrollments/${enrollmentId}/unpause`, {
        method: "PATCH",
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to resume enrollment");
      }
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trial":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "trial":
        return "Free Trial";
      case "3months":
        return "3 Months";
      case "6months":
        return "6 Months";
      case "1year":
        return "1 Year Diploma";
      default:
        return plan;
    }
  };

  const exportGrades = () => {
    const headers = ["Exam", "Course", "Score", "Total", "Percentage", "Feedback", "Graded Date"];
    const rows = student.grades.map((grade) => [
      grade.examId.title,
      grade.courseId.name,
      grade.score,
      grade.total,
      `${grade.percentage}%`,
      grade.feedback || "-",
      grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : "-",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.student.firstName}_${student.student.lastName}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studentData = student.student;

  // Safe date formatting function
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-tutor to-brand-primary px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {studentData.firstName} {studentData.lastName}
              </h1>
              <p className="text-white/80 mt-1">Student ID: {studentData._id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  studentData.subscriptionStatus
                )}`}
              >
                {studentData.subscriptionStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{studentData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{studentData.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(studentData.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Free Trial Used</p>
              <p className="text-sm font-medium text-gray-900">
                {studentData.hasUsedFreeTrial ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "profile"
                ? "text-tutor border-b-2 border-tutor"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "enrollments"
                ? "text-tutor border-b-2 border-tutor"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Enrollments ({student.enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "grades"
                ? "text-tutor border-b-2 border-tutor"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Grades ({student.grades.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {studentData.state && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-900">{studentData.state}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Account Status</h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      studentData.subscriptionStatus === "active"
                        ? "bg-green-500"
                        : studentData.subscriptionStatus === "trial"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-gray-900 capitalize">{studentData.subscriptionStatus}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "enrollments" && (
            <div className="space-y-4">
              {student.enrollments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No enrollments found</p>
              ) : (
                student.enrollments.map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-tutor" />
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.courseId.name}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            Tutor: {enrollment.tutorId.firstName} {enrollment.tutorId.lastName}
                          </p>
                          <p className="text-gray-600">
                            Plan: <span className="font-medium">{getPlanLabel(enrollment.plan)}</span>
                          </p>
                          <p className="text-gray-600">
                            Status:{" "}
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                enrollment.status
                              )}`}
                            >
                              {enrollment.status}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Amount: ₦{enrollment.amount?.toLocaleString() || 0}
                          </p>
                          <p className="text-gray-600">
                            Start: {formatDate(enrollment.startDate)}
                          </p>
                          <p className="text-gray-600">
                            End: {formatDate(enrollment.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {enrollment.status === "active" && (
                          <button
                            onClick={() => handlePauseEnrollment(enrollment._id)}
                            disabled={loading}
                            className="px-3 py-1 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 text-sm flex items-center gap-1"
                          >
                            <PauseCircle className="w-4 h-4" />
                            Pause
                          </button>
                        )}
                        {enrollment.status === "paused" && (
                          <button
                            onClick={() => handleUnpauseEnrollment(enrollment._id)}
                            disabled={loading}
                            className="px-3 py-1 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 text-sm flex items-center gap-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Resume
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
                    className="px-3 py-1 text-sm text-tutor border border-tutor rounded-lg hover:bg-tutor/5 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Exam
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Course
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Score
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Percentage
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Feedback
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {student.grades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No grades available
                        </td>
                      </tr>
                    ) : (
                      student.grades.map((grade) => (
                        <tr key={grade._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {grade.examId.title}
                           </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {grade.courseId.name}
                           </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {grade.score} / {grade.total}
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    grade.percentage >= 70
                                      ? "bg-green-500"
                                      : grade.percentage >= 50
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${grade.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {grade.percentage}%
                              </span>
                            </div>
                           </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {grade.feedback || "-"}
                           </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : "-"}
                           </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
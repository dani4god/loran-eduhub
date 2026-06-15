// components/tutor/ExamsList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  ChevronRight,
  Clock,
  FileQuestion,
  Award,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
} from "lucide-react";

import type { ExamDTO } from "@/types/exam";

export default function ExamsList({
  initialExams,
}: {
  initialExams: ExamDTO[];
}) {
  const [exams, setExams] = useState<ExamDTO[]>(initialExams);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && exam.isPublished) ||
                         (statusFilter === "draft" && !exam.isPublished);
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    setIsDeleting(examId);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete exam");
        return;
      }

      setExams((prev) => prev.filter((exam) => exam._id !== examId));
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/publish`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to publish exam");
        return;
      }

      setExams((prev) =>
        prev.map((exam) =>
          exam._id === examId
            ? { ...exam, isPublished: true }
            : exam
        )
      );

      alert("Exam published successfully");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  const getStatusBadge = (isPublished: boolean, scheduledDate?: string) => {
    if (isPublished) {
      if (scheduledDate && new Date(scheduledDate) < new Date()) {
        return { text: "Completed", color: "gray", icon: CheckCircle };
      }
      return { text: "Published", color: "green", icon: CheckCircle };
    }
    return { text: "Draft", color: "yellow", icon: AlertCircle };
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case "green": return "bg-green-100 text-green-700 border-green-200";
      case "yellow": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "gray": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search exams by title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-tutor text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("published")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "published"
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setStatusFilter("draft")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "draft"
                    ? "bg-yellow-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Drafts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-tutor/10 to-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-10 h-10 text-tutor" />
            </div>
            <p className="text-gray-500 font-medium text-lg">No exams found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Create your first exam to get started"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link
                href="/dashboard/tutor/exams/create"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-tutor text-white rounded-xl hover:bg-tutor/90 transition-all"
              >
                Create your first exam →
              </Link>
            )}
          </div>
        ) : (
          filteredExams.map((exam) => {
            const status = getStatusBadge(exam.isPublished, exam.scheduledDate?.toString());
            const StatusIcon = status.icon;
            
            return (
              <div
                key={exam._id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-tutor transition-colors">
                          {exam.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status.color)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {exam.instructions}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-tutor"></div>
                          {exam.course.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {exam.duration} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileQuestion className="w-4 h-4" />
                          {exam.totalQuestions} questions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          {exam.totalMarks} marks
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {exam.scheduledDate
                            ? new Date(exam.scheduledDate).toLocaleDateString()
                            : "No schedule"}
                        </span>
                        {exam.submissions !== undefined && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {exam.submissions} submissions
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/tutor/exams/${exam._id}`}
                        className="p-2 text-gray-500 hover:text-tutor hover:bg-tutor/5 rounded-lg transition-all"
                        title="View Exam"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>

                      <Link
                        href={`/dashboard/tutor/exams/edit/${exam._id}`}
                        className="p-2 text-gray-500 hover:text-tutor hover:bg-tutor/5 rounded-lg transition-all"
                        title="Edit Exam"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(exam._id)}
                        disabled={isDeleting === exam._id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Delete Exam"
                      >
                        {isDeleting === exam._id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>

                      {!exam.isPublished && (
                        <button
                          onClick={() => handlePublish(exam._id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-all"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {exam.isPublished && exam.submissions && exam.submissions > 0 && (
                  <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <Link
                      href={`/dashboard/tutor/exams/${exam._id}/results`}
                      className="flex items-center justify-between p-4 hover:bg-gray-100/50 transition-all group/link"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tutor/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-tutor" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            {exam.submissions} student submission
                            {exam.submissions !== 1 ? "s" : ""}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ready for grading
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-tutor">
                        <span className="text-sm font-medium">Grade Now</span>
                        <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {filteredExams.length > 0 && filteredExams.length !== exams.length && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {filteredExams.length} of {exams.length} exams
            </span>
            <button 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="text-tutor hover:text-tutor/80 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
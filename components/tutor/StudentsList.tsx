// components/tutor/StudentsList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, Filter, ChevronLeft, ChevronRight, MoreVertical, 
  PauseCircle, PlayCircle, Eye, Mail, Phone, Calendar, 
  BookOpen, AlertCircle, Award, Clock, CheckCircle, XCircle,
  Send, Users 
} from "lucide-react";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  course: {
    name: string;
    _id: string;
  };
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export default function StudentsList({ initialStudents }: { initialStudents: Student[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  const filteredStudents = initialStudents.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePauseStudent = async (studentId: string) => {
    if (confirm("Are you sure you want to pause this student's enrollment?")) {
      setIsLoading(studentId);
      try {
        const response = await fetch(`/api/enrollments/${studentId}/pause`, {
          method: "PATCH",
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to pause enrollment");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred");
      } finally {
        setIsLoading(null);
      }
    }
  };

  const handleUnpauseStudent = async (studentId: string) => {
    setIsLoading(studentId);
    try {
      const response = await fetch(`/api/enrollments/${studentId}/unpause`, {
        method: "PATCH",
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to resume enrollment");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === paginatedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(paginatedStudents.map(s => s._id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "trial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-3 h-3" />;
      case "expired": return <XCircle className="w-3 h-3" />;
      case "paused": return <Clock className="w-3 h-3" />;
      default: return <Award className="w-3 h-3" />;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "trial": return "Free Trial";
      case "3months": return "3 Months";
      case "6months": return "6 Months";
      case "1year": return "1 Year Diploma";
      default: return plan;
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Safe date formatting function
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            {selectedStudents.size > 0 && (
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 text-sm bg-tutor/10 text-tutor rounded-lg hover:bg-tutor/20 transition">
                  Bulk Message
                </button>
                <button className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                  Bulk Action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedStudents.size === paginatedStudents.length && paginatedStudents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-tutor focus:ring-tutor"
                />
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Student Information
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Enrollment Period
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No students found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => {
                const daysRemaining = getDaysRemaining(student.endDate);
                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                
                return (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student._id)}
                        onChange={() => toggleSelectStudent(student._id)}
                        className="w-4 h-4 rounded border-gray-300 text-tutor focus:ring-tutor"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-tutor/10 to-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-tutor font-semibold text-sm">
                            {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-tutor" />
                        <span className="text-gray-900 font-medium">{student.course?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {getPlanLabel(student.plan)}
                        </span>
                        {isExpiringSoon && student.status === "active" && (
                          <span className="text-xs text-orange-600 mt-0.5">
                            Expires in {daysRemaining} days
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(student.status)}`}>
                        {getStatusIcon(student.status)}
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>Start: {formatDate(student.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>End: {formatDate(student.endDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/tutor/students/${student._id}`}
                          className="p-2 text-gray-500 hover:text-tutor hover:bg-tutor/5 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Send Message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {student.status === "active" && (
                          <button
                            onClick={() => handlePauseStudent(student._id)}
                            disabled={isLoading === student._id}
                            className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                            title="Pause Subscription"
                          >
                            {isLoading === student._id ? (
                              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PauseCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {student.status === "paused" && (
                          <button
                            onClick={() => handleUnpauseStudent(student._id)}
                            disabled={isLoading === student._id}
                            className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                            title="Resume Subscription"
                          >
                            {isLoading === student._id ? (
                              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      currentPage === pageNum
                        ? "bg-tutor text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
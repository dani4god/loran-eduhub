// components/tutor/StudentsList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Filter, ChevronLeft, ChevronRight, ChevronDown, MoreVertical,
  PauseCircle, PlayCircle, Eye, Mail, Phone, Calendar,
  BookOpen, AlertTriangle, Send, Users, CheckCircle, XCircle, Clock, Award,
} from "lucide-react";

interface CourseEnrollment {
  enrollmentId: string;
  course: { _id: string; name: string };
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  amount: number;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courses: CourseEnrollment[];
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Free Trial",
  monthly: "Monthly",
  "3months": "3 Months",
  "6months": "6 Months",
  "1year": "1 Year Diploma",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
  withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "active" ? <CheckCircle size={11} /> :
    status === "expired" || status === "suspended" ? <XCircle size={11} /> :
    status === "paused" ? <Clock size={11} /> :
    <Award size={11} />;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {icon}
      {status}
    </span>
  );
}

function getDaysRemaining(endDate: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentsList({ initialStudents }: { initialStudents: Student[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingEnrollmentId, setLoadingEnrollmentId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  const filteredStudents = initialStudents.filter((student) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(q) ||
      student.lastName.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      student.courses.some((c) => c.course.name.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || student.courses.some((c) => c.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleExpanded = (studentId: string) => {
    const next = new Set(expandedStudents);
    next.has(studentId) ? next.delete(studentId) : next.add(studentId);
    setExpandedStudents(next);
  };

  const toggleSelectStudent = (studentId: string) => {
    const next = new Set(selectedStudents);
    next.has(studentId) ? next.delete(studentId) : next.add(studentId);
    setSelectedStudents(next);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === paginatedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(paginatedStudents.map((s) => s._id)));
    }
  };

  const handlePause = async (enrollmentId: string) => {
    if (!confirm("Pause this enrollment?")) return;
    setLoadingEnrollmentId(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/pause`, { method: "PATCH" });
      if (res.ok) window.location.reload();
      else alert("Failed to pause enrollment");
    } finally {
      setLoadingEnrollmentId(null);
    }
  };

  const handleUnpause = async (enrollmentId: string) => {
    setLoadingEnrollmentId(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/unpause`, { method: "PATCH" });
      if (res.ok) window.location.reload();
      else alert("Failed to resume enrollment");
    } finally {
      setLoadingEnrollmentId(null);
    }
  };

  const CourseRow = ({ c }: { c: CourseEnrollment }) => {
    const daysRemaining = getDaysRemaining(c.endDate);
    const isExpiringSoon = c.status === "active" && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 py-2 px-2.5 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <BookOpen size={13} className="text-blue-500 shrink-0" />
          <span className="font-medium text-gray-900 text-xs truncate">{c.course.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-gray-500">{PLAN_LABELS[c.plan] || c.plan}</span>
          <StatusBadge status={c.status} />
          {isExpiringSoon && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-600 font-semibold">
              <AlertTriangle size={10} /> {daysRemaining}d
            </span>
          )}
        </div>

        <div className="text-[10px] text-gray-400 shrink-0">
          {formatDate(c.startDate)} → {formatDate(c.endDate)}
        </div>

        <div className="text-[10px] font-semibold text-gray-600 shrink-0">
          ₦{c.amount.toLocaleString("en-NG")}
        </div>

        <div className="shrink-0">
          {c.status === "active" && (
            <button
              onClick={() => handlePause(c.enrollmentId)}
              disabled={loadingEnrollmentId === c.enrollmentId}
              className="p-1 text-orange-500 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
              title="Pause"
            >
              {loadingEnrollmentId === c.enrollmentId ? (
                <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PauseCircle size={14} />
              )}
            </button>
          )}
          {c.status === "paused" && (
            <button
              onClick={() => handleUnpause(c.enrollmentId)}
              disabled={loadingEnrollmentId === c.enrollmentId}
              className="p-1 text-green-500 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
              title="Resume"
            >
              {loadingEnrollmentId === c.enrollmentId ? (
                <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlayCircle size={14} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-3.5 sm:p-5 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or course..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="text-gray-400 w-4 h-4 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            {selectedStudents.size > 0 && (
              <button className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                Bulk Message ({selectedStudents.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {paginatedStudents.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm">No students found</p>
          <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-9">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === paginatedStudents.length && paginatedStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Courses</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedStudents.map((student) => {
                  const isExpanded = expandedStudents.has(student._id);
                  const summaryCourses = isExpanded ? student.courses : student.courses.slice(0, 1);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group align-top">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student._id)}
                          onChange={() => toggleSelectStudent(student._id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 w-56">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <span className="text-blue-600 font-semibold text-xs">
                              {student.firstName?.[0] || ""}{student.lastName?.[0] || ""}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                              <Mail size={10} className="shrink-0" /> {student.email}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                              <Phone size={10} className="shrink-0" /> {student.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5 max-w-xl">
                          {summaryCourses.map((c) => <CourseRow key={c.enrollmentId} c={c} />)}
                          {student.courses.length > 1 && (
                            <button
                              onClick={() => toggleExpanded(student._id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              {isExpanded ? "Show less" : `+${student.courses.length - 1} more course${student.courses.length - 1 > 1 ? "s" : ""}`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/tutor/students/${student._id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Send Message"
                          >
                            <Send size={15} />
                          </button>
                          <button
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="More"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {paginatedStudents.map((student) => {
              const isExpanded = expandedStudents.has(student._id);
              const summaryCourses = isExpanded ? student.courses : student.courses.slice(0, 1);

              return (
                <div key={student._id} className="p-3.5">
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student._id)}
                      onChange={() => toggleSelectStudent(student._id)}
                      className="w-3.5 h-3.5 mt-1 rounded border-gray-300 text-blue-600 shrink-0"
                    />
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-semibold text-xs">
                        {student.firstName?.[0] || ""}{student.lastName?.[0] || ""}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                        <Mail size={10} className="shrink-0" /> {student.email}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/tutor/students/${student._id}`}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0"
                    >
                      <Eye size={15} />
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {summaryCourses.map((c) => <CourseRow key={c.enrollmentId} c={c} />)}
                    {student.courses.length > 1 && (
                      <button
                        onClick={() => toggleExpanded(student._id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600"
                      >
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        {isExpanded ? "Show less" : `+${student.courses.length - 1} more course${student.courses.length - 1 > 1 ? "s" : ""}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3.5 sm:px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="text-[11px] sm:text-xs text-gray-500 text-center sm:text-left">
            Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-50"
            >
              <ChevronLeft size={13} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 text-xs rounded-lg transition-all ${
                      currentPage === pageNum ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-50"
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
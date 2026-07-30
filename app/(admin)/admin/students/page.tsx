// app/(admin)/admin/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, RefreshCw, Mail, Phone,
  MapPin, MessageSquare, BookOpen, Calendar, AlertTriangle, User,
  Trash2, Clock, UserMinus, CheckCircle,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EnrollmentDetail {
  enrollmentId: string;
  courseName: string;
  courseCategory: string;
  tutorName: string;
  plan: string;
  status: string;
  amount: number;
  startDate: string;
  endDate: string | null;
  daysLeft: number | null;
  isExpired: boolean;
  averageScore: number | null;
}

interface StudentItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  discordUsername: string | null;
  discordId: string | null;
  hasUsedFreeTrial: boolean;
  createdAt: string;
  enrollments: EnrollmentDetail[];
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Free Trial', monthly: 'Monthly', '3months': '3 Months', '6months': '6 Months', '1year': '1 Year Diploma',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-200 text-gray-600',
  pending: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-50 text-red-600',
};

export default function AdminStudents() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<StudentItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push('/auth/admin/login');
    if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') router.push('/unauthorized');
  }, [sessionStatus, session, router]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') fetchStudents();
  }, [page, search, sessionStatus, session]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/students?page=${page}&search=${search}`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setPages(data.pages || 1);
      } else {
        toast.error(data.error || 'Failed to fetch students');
      }
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm(`⚠️ Are you sure you want to permanently remove this student?\n\nThis action cannot be undone.`)) return;

    setDeleting(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Student removed successfully');
        setSelected(null);
        fetchStudents();
      } else {
        toast.error(data.error || 'Failed to remove student');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const handleWithdrawEnrollment = async (enrollmentId: string) => {
    if (!confirm(`⚠️ Are you sure you want to withdraw this enrollment?\n\nThe student will lose access to this course.`)) return;

    setWithdrawing(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Enrollment withdrawn successfully');
        // Refresh both the list and the modal
        fetchStudents();
        setSelected(null);
        // Re-fetch the selected student details if needed
        setTimeout(() => fetchStudents(), 300);
      } else {
        toast.error(data.error || 'Failed to withdraw enrollment');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setWithdrawing(null);
    }
  };

  const handleSuspendStudent = async (studentId: string) => {
    if (!confirm(`⚠️ Are you sure you want to suspend this student?`)) return;

    try {
      const res = await fetch(`/api/admin/students/${studentId}/suspend`, { method: 'PATCH' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Student suspended successfully');
        fetchStudents();
        setSelected(null);
      } else {
        toast.error(data.error || 'Failed to suspend student');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-80">
          <div className="w-12 h-12 border-4 border-tutor border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  if (session?.user?.role !== 'admin') return null;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm mt-0.5">All enrolled students, courses, tutors, and progress</p>
          </div>
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tutor/20 focus:border-tutor"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-tutor border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No students found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => {
              const activeCount = s.enrollments.filter((e) => e.status === 'active').length;
              const expiringSoon = s.enrollments.some((e) => e.status === 'active' && e.daysLeft !== null && e.daysLeft <= 5);
              return (
                <div key={s._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-tutor/20 to-brand-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-tutor font-semibold text-sm">{s.firstName?.[0]}{s.lastName?.[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{s.email}</p>
                    </div>
                    {expiringSoon && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> Renewal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {activeCount} active course{activeCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} className={s.discordUsername ? 'text-indigo-500' : 'text-gray-300'} />
                      {s.discordUsername ? `@${s.discordUsername}` : 'Not connected'}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelected(s)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={13} /> View Full Details
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <h2 className="text-base font-bold text-gray-900">Student Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Student Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tutor/20 to-brand-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xl text-tutor font-semibold">{selected.firstName?.[0]}{selected.lastName?.[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selected.firstName} {selected.lastName}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5"><Mail size={12} /> {selected.email}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5"><Phone size={12} /> {selected.phone}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <MapPin size={14} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900 truncate">{selected.state || '—'}</p>
                  <p className="text-[10px] text-gray-500">State</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <MessageSquare size={14} className={`mx-auto mb-1 ${selected.discordUsername ? 'text-indigo-500' : 'text-gray-300'}`} />
                  <p className="text-xs font-bold text-gray-900 truncate">{selected.discordUsername ? `@${selected.discordUsername}` : 'Not linked'}</p>
                  <p className="text-[10px] text-gray-500">Discord</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <BookOpen size={14} className="text-tutor mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{selected.enrollments.length}</p>
                  <p className="text-[10px] text-gray-500">Total Enrollments</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Calendar size={14} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{new Date(selected.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-gray-500">Joined</p>
                </div>
              </div>

              {/* Enrollments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Enrollments</h4>
                  <span className="text-xs text-gray-400">{selected.enrollments.length} total</span>
                </div>
                <div className="space-y-2">
                  {selected.enrollments.length === 0 ? (
                    <p className="text-sm text-gray-400">No enrollments yet.</p>
                  ) : (
                    selected.enrollments.map((e) => (
                      <div key={e.enrollmentId} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">{e.courseName}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[e.status] || STATUS_STYLES.pending}`}>
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">with {e.tutorName} · {PLAN_LABELS[e.plan] || e.plan}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                          <span>₦{e.amount.toLocaleString('en-NG')} paid</span>
                          {e.status === 'active' && e.daysLeft !== null && (
                            <span className={`font-semibold ${e.daysLeft <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                              {e.daysLeft > 0 ? `${e.daysLeft}d remaining` : 'Expired'}
                            </span>
                          )}
                          {e.status === 'expired' && <span className="font-semibold text-red-600">Expired</span>}
                          {e.averageScore !== null ? (
                            <span className="font-semibold text-tutor">{e.averageScore.toFixed(1)}% average</span>
                          ) : (
                            <span className="text-gray-400">No grades yet</span>
                          )}
                        </div>
                        {/* Withdraw button for each enrollment */}
                        {e.status !== 'withdrawn' && e.status !== 'expired' && (
                          <button
                            onClick={() => handleWithdrawEnrollment(e.enrollmentId)}
                            disabled={withdrawing === e.enrollmentId}
                            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                          >
                            {withdrawing === e.enrollmentId ? (
                              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <UserMinus size={12} /> Withdraw Enrollment
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleSuspendStudent(selected._id)}
                  className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={16} /> Suspend Student
                </button>
                <button
                  onClick={() => handleDeleteStudent(selected._id)}
                  disabled={deleting === selected._id}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting === selected._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={16} /> Remove Student Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
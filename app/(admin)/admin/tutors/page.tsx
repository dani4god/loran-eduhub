// app/(admin)/admin/tutors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search, Eye, CheckCircle, XCircle, Ban, Mail, Clock, ExternalLink,
  ChevronLeft, ChevronRight, RefreshCw, X, Users, MessageSquare, DollarSign,
  PlayCircle, CalendarClock,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ScheduleInterviewModal from '@/components/admin/ScheduleInterviewModal';
import AdminTutorApprovalModal from '@/components/admin/AdminTutorApprovalModal';
import TutorCourseEditor from '@/components/admin/TutorCourseEditor';

interface Tutor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  status: 'pending' | 'approved' | 'disapproved' | 'suspended';
  qualifications: { degree: string; institution: string; year: string }[];
  courses: { _id: string; name: string; category: string }[];
  profileImage?: string;
  videoLink?: string;
  resume?: string;
  discordUsername?: string;
  discordId?: string;
  pricing?: { monthly: number; threeMonths: number; sixMonths: number; oneYear: number };
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

const TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'disapproved', label: 'Disapproved' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  disapproved: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-200 text-gray-600',
};

export default function AdminTutors() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [interviewTutor, setInterviewTutor] = useState<Tutor | null>(null);
  const [approvingTutor, setApprovingTutor] = useState<Tutor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push('/auth/admin/login');
    if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') router.push('/unauthorized');
  }, [sessionStatus, session, router]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') fetchTutors();
  }, [currentPage, tab, searchTerm, sessionStatus, session]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tutors?page=${currentPage}&status=${tab}&search=${searchTerm}`);
      const data = await res.json();
      if (res.ok) {
        setTutors(data.tutors || []);
        setTotalPages(data.pages || 1);
        setStatusCounts(data.statusCounts || {});
      } else {
        toast.error(data.error || 'Failed to fetch tutors');
        setTutors([]);
      }
    } catch {
      toast.error('Failed to fetch tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (tutorId: string, action: 'approve' | 'disapprove' | 'suspend') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchTutors();
        setSelectedTutor(null);
      } else {
        toast.error(data.error || `Failed to ${action} tutor`);
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-80">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tutors</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review applications and manage tutor accounts</p>
          </div>
          <button
            onClick={fetchTutors}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.value ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                {statusCounts[t.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        {/* Tutor cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : tutors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
            No tutors found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutors.map((tutor) => (
              <div key={tutor._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {tutor.profileImage ? (
                      <img src={tutor.profileImage} alt={tutor.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-semibold text-sm">{tutor.firstName?.[0]}{tutor.lastName?.[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{tutor.firstName} {tutor.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{tutor.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[tutor.status]}`}>
                    {tutor.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {tutor.courses?.slice(0, 2).map((c) => (
                    <span key={c._id} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{c.name}</span>
                  ))}
                  {tutor.courses?.length > 2 && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">+{tutor.courses.length - 2}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Users size={11} /> {tutor.studentCount} students</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} className={tutor.discordUsername ? 'text-indigo-500' : 'text-gray-300'} />
                    {tutor.discordUsername ? `@${tutor.discordUsername}` : 'Not connected'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedTutor(tutor)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={13} /> Details
                  </button>
                  {tutor.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setInterviewTutor(tutor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Schedule Interview"
                      >
                        <CalendarClock size={16} />
                      </button>
                      <button
                        onClick={() => setApprovingTutor(tutor)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => handleAction(tutor._id, 'disapprove')} disabled={actionLoading} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {tutor.status === 'approved' && (
                    <button onClick={() => handleAction(tutor._id, 'suspend')} disabled={actionLoading} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50">
                      <Ban size={16} />
                    </button>
                  )}
                  {tutor.status === 'suspended' && (
                    <button onClick={() => handleAction(tutor._id, 'approve')} disabled={actionLoading} className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50">
                      <PlayCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTutor && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <h2 className="text-base font-bold text-gray-900">Tutor Details</h2>
              <button onClick={() => setSelectedTutor(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedTutor.profileImage ? (
                    <img src={selectedTutor.profileImage} alt={selectedTutor.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-gray-500 font-semibold">{selectedTutor.firstName?.[0]}{selectedTutor.lastName?.[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">{selectedTutor.firstName} {selectedTutor.lastName}</h3>
                  <p className="text-gray-500 text-sm">{selectedTutor.email}</p>
                  <p className="text-gray-500 text-sm">{selectedTutor.phone || 'No phone provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Users size={14} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">{selectedTutor.studentCount}</p>
                  <p className="text-[10px] text-gray-500">Students</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <MessageSquare size={14} className={`mx-auto mb-1 ${selectedTutor.discordUsername ? 'text-indigo-500' : 'text-gray-300'}`} />
                  <p className="text-xs font-bold text-gray-900 truncate">{selectedTutor.discordUsername ? `@${selectedTutor.discordUsername}` : 'Not linked'}</p>
                  <p className="text-[10px] text-gray-500">Discord</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <DollarSign size={14} className="text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">₦{(selectedTutor.pricing?.monthly ?? 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Monthly rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock size={14} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{new Date(selectedTutor.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-gray-500">Joined</p>
                </div>
              </div>

              {selectedTutor.pricing && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Pricing</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">₦{selectedTutor.pricing.monthly.toLocaleString()}</p><p className="text-gray-400">Monthly</p></div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">₦{selectedTutor.pricing.threeMonths.toLocaleString()}</p><p className="text-gray-400">3 Months</p></div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">₦{selectedTutor.pricing.sixMonths.toLocaleString()}</p><p className="text-gray-400">6 Months</p></div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">₦{selectedTutor.pricing.oneYear.toLocaleString()}</p><p className="text-gray-400">1 Year</p></div>
                  </div>
                </div>
              )}

              {selectedTutor.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Professional Bio</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedTutor.bio}</p>
                </div>
              )}

              {selectedTutor.qualifications?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Qualifications</h4>
                  <div className="space-y-1.5">
                    {selectedTutor.qualifications.map((q, i) => (
                      <div key={i} className="p-2.5 bg-gray-50 rounded-lg text-sm">
                        <p className="font-medium text-gray-800">{q.degree}</p>
                        <p className="text-xs text-gray-500">{q.institution} ({q.year})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTutor.courses?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Courses Taught</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTutor.courses.map((c) => (
                      <span key={c._id} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tutor Course Editor */}
              <TutorCourseEditor
                tutorId={selectedTutor._id}
                currentCourseIds={selectedTutor.courses.map((c: any) => c._id)}
                onSaved={fetchTutors}
              />

              <div className="flex flex-wrap gap-4">
                {selectedTutor.videoLink && (
                  <a href={selectedTutor.videoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 text-sm hover:underline">
                    <ExternalLink size={14} /> Video Introduction
                  </a>
                )}
                {selectedTutor.resume && (
                  <a href={selectedTutor.resume} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 text-sm hover:underline">
                    <ExternalLink size={14} /> Resume
                  </a>
                )}
                <a href={`mailto:${selectedTutor.email}`} className="inline-flex items-center gap-1.5 text-gray-600 text-sm hover:underline">
                  <Mail size={14} /> Email Tutor
                </a>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                {selectedTutor.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setInterviewTutor(selectedTutor)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
                    >
                      Schedule Interview
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setApprovingTutor(selectedTutor)}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button onClick={() => handleAction(selectedTutor._id, 'disapprove')} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </>
                )}
                {selectedTutor.status === 'approved' && (
                  <button onClick={() => handleAction(selectedTutor._id, 'suspend')} disabled={actionLoading} className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
                    {actionLoading ? 'Processing...' : 'Suspend Account'}
                  </button>
                )}
                {selectedTutor.status === 'suspended' && (
                  <button onClick={() => handleAction(selectedTutor._id, 'approve')} disabled={actionLoading} className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                    {actionLoading ? 'Processing...' : 'Reactivate Account'}
                  </button>
                )}

                <button
                  onClick={async () => {
                    if (!confirm(`Permanently remove ${selectedTutor.firstName}? This withdraws all their students.`)) return;
                    const res = await fetch(`/api/admin/tutors/${selectedTutor._id}`, { method: 'DELETE' });
                    if (res.ok) { toast.success('Tutor removed'); setSelectedTutor(null); fetchTutors(); }
                  }}
                  className="w-full px-4 py-2.5 bg-red-700 text-white rounded-xl text-sm font-semibold hover:bg-red-800"
                >
                  Remove Tutor Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {interviewTutor && (
        <ScheduleInterviewModal tutor={interviewTutor} onClose={() => setInterviewTutor(null)} />
      )}

      {/* Approval Modal */}
      {approvingTutor && (
        <AdminTutorApprovalModal
          tutor={approvingTutor as any}
          onClose={() => setApprovingTutor(null)}
          onApproved={fetchTutors}
        />
      )}
    </AdminLayout>
  );
}
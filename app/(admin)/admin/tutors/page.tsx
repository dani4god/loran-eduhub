// app/(admin)/admin/tutors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Ban,
  Mail,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

interface Tutor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  status: 'pending' | 'approved' | 'disapproved' | 'suspended';
  qualifications: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  courses: Array<{
    _id: string;
    name: string;
    category: string;
  }>;
  profileImage?: string;
  videoLink?: string;
  resume?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTutors() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/admin/login');
    }
    if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [sessionStatus, session, router]);

  // Fetch tutors when filters change
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
      fetchTutors();
    }
  }, [currentPage, statusFilter, searchTerm, sessionStatus, session]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tutors?page=${currentPage}&status=${statusFilter}&search=${searchTerm}`);
      const data = await res.json();
      
      if (res.ok) {
        setTutors(data.tutors || []);
        setTotalPages(data.pages || 1);
      } else {
        toast.error(data.error || 'Failed to fetch tutors');
        setTutors([]);
      }
    } catch (error) {
      console.error('Fetch tutors error:', error);
      toast.error('Failed to fetch tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (tutorId: string, action: 'approve' | 'disapprove' | 'suspend') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}/${action}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        fetchTutors(); // Refresh the list
        setShowModal(false); // Close modal if open
      } else {
        toast.error(data.error || `Failed to ${action} tutor`);
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      disapproved: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show loading while checking session
  if (sessionStatus === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Don't render if not admin
  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutors Management</h1>
            <p className="text-gray-600 mt-1">Manage tutor applications and accounts</p>
          </div>
          <button
            onClick={fetchTutors}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tutors Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Tutor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Courses</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Submitted</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : tutors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      {statusFilter !== 'all' && statusFilter === 'pending' 
                        ? 'No pending tutor applications found'
                        : 'No tutors found'}
                    </td>
                  </tr>
                ) : (
                  tutors.map((tutor) => (
                    <tr key={tutor._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {tutor.profileImage ? (
                              <img 
                                src={tutor.profileImage} 
                                alt={tutor.firstName} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 font-medium text-sm">
                                {tutor.firstName?.[0]}{tutor.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tutor.firstName} {tutor.lastName}</p>
                            <p className="text-sm text-gray-500">{tutor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{tutor.phone || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tutor.courses && tutor.courses.length > 0 ? (
                            <>
                              {tutor.courses.slice(0, 2).map((course) => (
                                <span key={course._id} className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {course.name}
                                </span>
                              ))}
                              {tutor.courses.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  +{tutor.courses.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                              No courses
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tutor.status)}`}>
                          {getStatusText(tutor.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(tutor.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTutor(tutor);
                              setShowModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {tutor.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(tutor._id, 'approve')}
                                disabled={actionLoading}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleAction(tutor._id, 'disapprove')}
                                disabled={actionLoading}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {tutor.status === 'approved' && (
                            <button
                              onClick={() => handleAction(tutor._id, 'suspend')}
                              disabled={actionLoading}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition disabled:opacity-50"
                              title="Suspend"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          )}
                          <a
                            href={`mailto:${tutor.email}`}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition"
                            title="Send Email"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tutor Details Modal */}
      {showModal && selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Tutor Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedTutor.profileImage ? (
                    <img 
                      src={selectedTutor.profileImage} 
                      alt={selectedTutor.firstName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-500">
                      {selectedTutor.firstName?.[0]}{selectedTutor.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTutor.firstName} {selectedTutor.lastName}</h3>
                  <p className="text-gray-600">{selectedTutor.email}</p>
                  <p className="text-gray-600">{selectedTutor.phone || 'No phone provided'}</p>
                </div>
              </div>

              {/* Bio */}
              {selectedTutor.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Professional Bio</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedTutor.bio}</p>
                </div>
              )}

              {/* Qualifications */}
              {selectedTutor.qualifications && selectedTutor.qualifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Qualifications</h4>
                  <div className="space-y-2">
                    {selectedTutor.qualifications.map((q, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{q.degree}</p>
                        <p className="text-sm text-gray-600">{q.institution} ({q.year})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {selectedTutor.courses && selectedTutor.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Courses</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutor.courses.map((course) => (
                      <span key={course._id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {course.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Link */}
              {selectedTutor.videoLink && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Video Introduction</h4>
                  <a
                    href={selectedTutor.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch Video
                  </a>
                </div>
              )}

              {/* Resume */}
              {selectedTutor.resume && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Resume</h4>
                  <a
                    href={selectedTutor.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Resume
                  </a>
                </div>
              )}

              {/* Application Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Applied on {new Date(selectedTutor.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedTutor.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedTutor._id, 'approve')}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Approve Application'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedTutor._id, 'disapprove')}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Reject Application'}
                    </button>
                  </>
                )}
                {selectedTutor.status === 'approved' && (
                  <button
                    onClick={() => handleAction(selectedTutor._id, 'suspend')}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Suspend Account'}
                  </button>
                )}
                {selectedTutor.status === 'suspended' && (
                  <button
                    onClick={() => handleAction(selectedTutor._id, 'approve')}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reactivate Account'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
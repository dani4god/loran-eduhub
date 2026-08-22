// components/admin/AdminTutorApprovalModal.tsx
'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Tutor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  courses: { _id: string; name: string; category: string }[];
}

interface AdminTutorApprovalModalProps {
  tutor: Tutor;
  onClose: () => void;
  onApproved: () => void;
}

export default function AdminTutorApprovalModal({
  tutor,
  onClose,
  onApproved,
}: AdminTutorApprovalModalProps) {
  const [selected, setSelected] = useState<string[]>(
    tutor.courses.map((c) => c._id)
  );
  const [loading, setLoading] = useState(false);

  const toggleCourse = (courseId: string) => {
    setSelected((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleApprove = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one course to approve');
      return;
    }

    setLoading(true);
    try {
      // ✅ FIX: Use PATCH method instead of POST
      const res = await fetch(`/api/admin/tutors/${tutor._id}/approve`, {
        method: 'PATCH',  // Changed from 'POST' to 'PATCH'
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: selected }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success('Tutor approved successfully');
        onApproved();
        onClose();
      } else {
        toast.error(data.error || 'Failed to approve tutor');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('An error occurred during approval');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === tutor.courses.length) {
      setSelected([]);
    } else {
      setSelected(tutor.courses.map((c) => c._id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Approve Tutor</h2>
            <p className="text-sm text-gray-500">
              {tutor.firstName} {tutor.lastName} · {tutor.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Select the courses this tutor should be approved to teach:
            </p>
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {selected.length === tutor.courses.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <div className="space-y-2">
            {tutor.courses.map((course) => {
              const isSelected = selected.includes(course._id);
              return (
                <button
                  key={course._id}
                  onClick={() => toggleCourse(course._id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {course.name}
                    </p>
                    <p className="text-xs text-gray-500">{course.category}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selected.length === 0 && (
            <p className="text-xs text-red-500 mt-3">
              ⚠️ You must select at least one course to approve this tutor.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || selected.length === 0}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Approve Tutor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
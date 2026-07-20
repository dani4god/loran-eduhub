// components/tutor/FeedbackList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, User, Calendar, MessageSquare, ChevronRight } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_satisfied_with_tutor: 'Not satisfied with tutor',
  course_too_difficult: 'Course too difficult',
  course_too_easy: 'Course too easy / not challenging',
  no_longer_needed: 'No longer needed',
  found_alternative: 'Found a better alternative',
  technical_issues: 'Technical issues',
  schedule_conflict: 'Schedule conflict',
  other: 'Other',
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly', '3months': '3 Months', '6months': '6 Months', '1year': '1 Year Diploma',
};

interface FeedbackItem {
  _id: string;
  studentId: string;
  student: { firstName: string; lastName: string; phone: string; email: string };
  course: { courseName: string; plan: string; amountPaid: number };
  reason: string;
  feedback: string;
  withdrawnAt: string;
}

export default function FeedbackList() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutor/feedback")
      .then((r) => r.json())
      .then((d) => setItems(d.feedback || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No withdrawal feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <User size={16} className="text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {item.student.firstName} {item.student.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{item.student.email} · {item.student.phone}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/tutor/students/${item.studentId}`}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              View student <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <p className="text-sm font-medium text-gray-900">{item.course.courseName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {PLAN_LABELS[item.course.plan] || item.course.plan} · ₦{item.course.amountPaid.toLocaleString('en-NG')} paid
            </p>
          </div>

          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full shrink-0">
              {REASON_LABELS[item.reason] || item.reason}
            </span>
          </div>

          {item.feedback && (
            <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
              <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <p>{item.feedback}</p>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            {new Date(item.withdrawnAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  );
}
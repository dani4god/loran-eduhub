// components/tutor/RecentStudents.tsx
"use client";

import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
}

export default function RecentStudents({ students }: { students: Student[] }) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Students</h2>
          <Link
            href="/dashboard/tutor/students"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {students.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No students yet</p>
        ) : (
          students.map((student) => (
            <div key={student.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{student.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {student.phone}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Course: {student.course}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      student.status
                    )}`}
                  >
                    {student.status}
                  </span>
                  <Link
                    href={`/dashboard/tutor/students/${student.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
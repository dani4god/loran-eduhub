// app/(admin)/admin/self-paced-courses/[id]/page.tsx
'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import AdminSelfPacedCourseReview from '@/components/admin/AdminSelfPacedCourseReview'

export default function AdminReviewSelfPacedCoursePage() {
  return (
    <AdminLayout>
      <AdminSelfPacedCourseReview />
    </AdminLayout>
  )
}
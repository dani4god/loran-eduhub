// app/(admin)/admin/lesson-notes/page.tsx
import AdminLayout from '@/components/admin/AdminLayout'
import LessonNotesReview from '@/components/admin/LessonNotesReview'

export default function AdminLessonNotesPage() {
  return (
    <AdminLayout>
      <LessonNotesReview />
    </AdminLayout>
  )
}
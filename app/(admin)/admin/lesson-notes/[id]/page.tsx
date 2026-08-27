// app/(admin)/admin/lesson-notes/[id]/page.tsx
import AdminLayout from '@/components/admin/AdminLayout'
import AdminLessonNoteDetail from '@/components/admin/AdminLessonNoteDetail'

export default function AdminLessonNoteDetailPage() {
  return (
    <AdminLayout>
      <AdminLessonNoteDetail />
    </AdminLayout>
  )
}
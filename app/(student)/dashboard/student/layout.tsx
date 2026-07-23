import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import StudentSidebar from '@/components/student/StudentSidebar'
import CertificateNotificationModal from '@/components/student/CertificateNotificationModal'
import AnnouncementPopup from '@/components/student/AnnouncementPopup'

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar user={session.user} />
      <main className="flex-1 min-w-0 lg:ml-64">
        {children}
        <CertificateNotificationModal />
        <AnnouncementPopup />
      </main>
    </div>
  )
}
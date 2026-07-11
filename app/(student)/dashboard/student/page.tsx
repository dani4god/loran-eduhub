import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import StudentOverview from '@/components/student/StudentOverview'

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }

  return <StudentOverview />
}
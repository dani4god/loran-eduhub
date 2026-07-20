import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import StudentLibraryList from '@/components/library/StudentLibraryList'

export default async function StudentLibraryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }
  return <StudentLibraryList />
}
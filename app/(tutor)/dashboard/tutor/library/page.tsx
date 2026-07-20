import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TutorLibraryList from '@/components/library/TutorLibraryList'

export default async function TutorLibraryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    redirect('/auth/tutor/login')
  }
  return <TutorLibraryList />
}
// app/dashboard/guide/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserGuideContent from '@/components/shared/UserGuideContent'

export default async function UserGuidePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/student/login')

  const role = session.user.role as 'student' | 'tutor'
  if (!['student', 'tutor'].includes(role)) redirect('/')

  return <UserGuideContent role={role} />
}
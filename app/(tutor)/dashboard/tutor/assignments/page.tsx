import TutorAssignments from '@/components/tutor/TutorAssignments'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') redirect('/auth/tutor/login')
  return <TutorAssignments />
}
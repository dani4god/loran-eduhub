import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MaterialReader from '@/components/library/MaterialReader'

export default async function StudentMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>
}) {
  const { materialId } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }
  return <MaterialReader materialId={materialId} />
}
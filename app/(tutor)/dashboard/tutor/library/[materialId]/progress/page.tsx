import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MaterialProgressView from '@/components/library/MaterialProgressView'

export default async function MaterialProgressPage({
  params,
}: {
  params: Promise<{ materialId: string }>
}) {
  const { materialId } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    redirect('/auth/tutor/login')
  }
  return <MaterialProgressView materialId={materialId} />
}
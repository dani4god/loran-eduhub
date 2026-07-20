import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialTreeEditor from '@/components/library/MaterialTreeEditor'

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>
}) {
  const { materialId } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    redirect('/auth/tutor/login')
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  const material = await CourseMaterial.findById(materialId)

  if (!material || !tutor || material.tutorId.toString() !== tutor._id.toString()) {
    notFound()
  }

  return <MaterialTreeEditor material={JSON.parse(JSON.stringify(material))} />
}
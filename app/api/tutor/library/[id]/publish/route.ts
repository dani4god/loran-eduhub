// app/api/tutor/library/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CourseMaterial from '@/models/CourseMaterial'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const material = await CourseMaterial.findById(id)
  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }
  if (material.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const desiredStatus = body.status === 'draft' ? 'draft' : 'published'

  if (desiredStatus === 'published' && material.chapters.length === 0) {
    return NextResponse.json(
      { error: 'Add at least one chapter before publishing' },
      { status: 400 }
    )
  }

  material.status = desiredStatus
  await material.save()

  return NextResponse.json({ success: true, status: material.status })
}
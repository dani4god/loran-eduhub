// app/api/tutor/library/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'

async function getOwnedMaterial(materialId: string, userId: string) {
  const tutor = await Tutor.findOne({ userId })
  if (!tutor) return { error: 'Tutor not found', status: 404 }

  const material = await CourseMaterial.findById(materialId)
  if (!material) return { error: 'Material not found', status: 404 }

  if (material.tutorId.toString() !== tutor._id.toString()) {
    return { error: 'Forbidden', status: 403 }
  }

  return { material, tutor }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const result = await getOwnedMaterial(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ material: result.material })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const result = await getOwnedMaterial(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const body = await req.json()
  const { title, description, chapters, status } = body

  const update: any = {}
  if (title !== undefined) update.title = title
  if (description !== undefined) update.description = description
  if (chapters !== undefined) update.chapters = chapters

  if (status !== undefined) {
    if (status === 'published' && (!chapters || chapters.length === 0) && result.material.chapters.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one chapter before publishing' },
        { status: 400 }
      )
    }
    update.status = status
  }

  const updated = await CourseMaterial.findByIdAndUpdate(id, update, { new: true })

  return NextResponse.json({ success: true, material: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const result = await getOwnedMaterial(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  await CourseMaterial.findByIdAndDelete(id)
  await MaterialProgress.deleteMany({ materialId: id })

  return NextResponse.json({ success: true })
}
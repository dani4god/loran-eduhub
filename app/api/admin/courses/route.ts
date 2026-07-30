// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const courses = await Course.find().sort({ category: 1, name: 1 })
  return NextResponse.json({ courses })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, category, discordRoleGroup, syllabus, isActive } = await req.json()

  if (!name?.trim() || !category?.trim() || !discordRoleGroup?.trim()) {
    return NextResponse.json({ error: 'Name, category, and Discord role group are required' }, { status: 400 })
  }

  await connectDB()

  const course = await Course.create({
    name: name.trim(),
    description: (description || '').trim(),
    category: category.trim(),
    discordRoleGroup: discordRoleGroup.trim(),
    syllabus: (syllabus || []).filter((s: string) => s.trim()).map((s: string) => s.trim()),
    isActive: isActive !== false,
  })

  return NextResponse.json({ success: true, course })
}
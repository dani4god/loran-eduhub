// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import { CATEGORY_TO_ROLE_GROUP, COURSE_CATEGORIES } from '@/lib/discordRoleMap'

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

  const { name, description, category, syllabus, isActive } = await req.json()

  // Validate required fields
  if (!name?.trim() || !category?.trim()) {
    return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
  }

  // Validate category against the known list
  const validCategories = Object.keys(CATEGORY_TO_ROLE_GROUP)
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Category must be one of: ${validCategories.join(', ')}` },
      { status: 400 }
    )
  }

  await connectDB()

  // Derive Discord role group from category
  const discordRoleGroup = CATEGORY_TO_ROLE_GROUP[category as keyof typeof CATEGORY_TO_ROLE_GROUP]

  // Check for duplicate course name
  const existingCourse = await Course.findOne({ name: name.trim() })
  if (existingCourse) {
    return NextResponse.json(
      { error: 'A course with this name already exists' },
      { status: 400 }
    )
  }

  const course = await Course.create({
    name: name.trim(),
    description: (description || '').trim(),
    category: category.trim(),
    discordRoleGroup, // derived automatically from category — never typed separately
    syllabus: (syllabus || []).filter((s: string) => s.trim()).map((s: string) => s.trim()),
    isActive: isActive !== false,
  })

  return NextResponse.json({ success: true, course })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name, description, category, syllabus, isActive } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
  }

  await connectDB()

  const course = await Course.findById(id)
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Validate category if being updated
  if (category) {
    const validCategories = Object.keys(CATEGORY_TO_ROLE_GROUP)
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
  }

  // Build update object
  const update: any = {}
  if (name !== undefined) update.name = name.trim()
  if (description !== undefined) update.description = (description || '').trim()
  if (category !== undefined) {
    update.category = category.trim()
    update.discordRoleGroup = CATEGORY_TO_ROLE_GROUP[category as keyof typeof CATEGORY_TO_ROLE_GROUP]
  }
  if (syllabus !== undefined) {
    update.syllabus = syllabus.filter((s: string) => s.trim()).map((s: string) => s.trim())
  }
  if (isActive !== undefined) update.isActive = isActive

  const updatedCourse = await Course.findByIdAndUpdate(id, update, { new: true })

  return NextResponse.json({ success: true, course: updatedCourse })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
  }

  await connectDB()

  const course = await Course.findByIdAndDelete(id)
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const grouped = searchParams.get('grouped') === 'true'

    const filter: any = { isActive: true }
    if (category) filter.category = category

    const courses = await Course.find(filter).sort({ category: 1, name: 1 })

    if (grouped) {
      const groups = {
        tech: courses.filter(c => c.category === 'tech'),
        igcse: courses.filter(c => c.category === 'igcse'),
        language: courses.filter(c => c.category === 'language'),
        ielts: courses.filter(c => c.category === 'ielts'),
        'jamb-waec': courses.filter(c => c.category === 'jamb-waec'),
        diploma: courses.filter(c => c.category === 'diploma'),
      }
      return NextResponse.json({ groups, total: courses.length })
    }

    return NextResponse.json({ courses, total: courses.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const course = await Course.create(body)
    return NextResponse.json({ course }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import '@/models/Course'

import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    console.log('Registered Models:', mongoose.modelNames())

    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')

    const limit = parseInt(searchParams.get('limit') || '10')

    const status = searchParams.get('status')

    const search = searchParams.get('search')

    let query: any = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (search && search.trim()) {
      query.$or = [
        {
          firstName: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          lastName: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
      ]
    }

    const total = await Tutor.countDocuments(query)

    const tutors = await Tutor.find(query)
      .populate('courses', 'name category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      tutors,
      total,
      page,
      pages: Math.ceil(total / limit),
    })

  } catch (error: any) {
    console.error('Admin tutors error:', error)

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
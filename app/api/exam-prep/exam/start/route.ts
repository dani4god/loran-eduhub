// app/api/exam-prep/exam/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import ExamPrepSession from '@/models/ExamPrepSession'
import { fetchExamQuestions } from '@/lib/alocApi'

export async function POST(req: NextRequest) {
  try {
    const { regNumber, examType, subject } = await req.json()
    
    // Validate required fields
    if (!regNumber || !examType || !subject) {
      return NextResponse.json({ 
        error: 'Missing required fields: regNumber, examType, subject' 
      }, { status: 400 })
    }

    await connectDB()

    // Find student
    const student = await ExamPrepStudent.findOne({ regNumber })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if exam prep is locked
    const settings = await ExamPrepSettings.findOne()
    if (settings?.isLocked === true) {
      return NextResponse.json({ 
        error: 'Practice exams are currently unavailable. Please check back later.' 
      }, { status: 403 })
    }

    // Check subscription
    const sub = await ExamPrepSubscription.findOne({ examPrepStudentId: student._id })
    const hasAccess = sub?.wasFreeAtRegistration || 
                     (sub?.endDate ? sub.endDate > new Date() : false) ||
                     sub?.planDuration === 'life'
                     
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Subscription required to access exam prep',
        requiresPayment: true 
      }, { status: 403 })
    }

    // Fetch questions from ALOC API
    try {
      const questions = await fetchExamQuestions({ 
        examType: examType.toLowerCase() as 'jamb' | 'waec' | 'neco', 
        subject: subject.toLowerCase(), 
        count: 15 // API max is 15
      })

      if (!questions || questions.length === 0) {
        return NextResponse.json({ 
          error: 'No questions available for this subject right now. Please try another subject.' 
        }, { status: 404 })
      }

      // Create exam session
      const sessionToken = crypto.randomBytes(24).toString('hex')
      const durationMinutes = 30

      await ExamPrepSession.create({
        sessionToken,
        examPrepStudentId: student._id,
        examType: examType.toLowerCase(),
        subject: subject.toLowerCase(),
        questions: questions.map((q) => ({ 
          id: q.id, 
          text: q.text, 
          options: q.options, 
          correctAnswer: q.correctAnswer 
        })),
        durationMinutes,
        expiresAt: new Date(Date.now() + (durationMinutes + 15) * 60 * 1000),
      })

      // Return questions WITHOUT correct answers
      return NextResponse.json({
        sessionToken,
        durationMinutes,
        questions: questions.map((q) => ({ 
          id: q.id, 
          text: q.text, 
          options: q.options, 
          section: q.section, 
          imageUrl: q.imageUrl 
        })),
      })

    } catch (apiError: any) {
      console.error('[ALOC API] Error fetching questions:', {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name
      })
      
      // Return a more specific error message
      let errorMessage = 'Unable to fetch questions from the question bank. Please try again in a moment.'
      
      if (apiError.message.includes('No questions available')) {
        errorMessage = `No practice questions available for ${subject} (${examType}). Please try another subject.`
      } else if (apiError.message.includes('timeout')) {
        errorMessage = 'The question bank is taking too long to respond. Please try again.'
      } else if (apiError.message.includes('API key') || apiError.message.includes('401') || apiError.message.includes('403')) {
        errorMessage = 'Authentication error with the question bank. Please contact support.'
      } else if (apiError.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      }
      
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 502 })
    }

  } catch (error: any) {
    console.error('[Exam Start] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred. Please try again.' 
    }, { status: 500 })
  }
}
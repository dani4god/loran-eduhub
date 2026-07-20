// models/Grade.ts

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGradeBreakdown {
  questionId: string
  questionText: string
  type: string
  studentAnswer: any
  correctAnswer: string
  isCorrect: boolean
  marks: number
  awarded: number
}

export interface IGrade extends Document {
  studentId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  examId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  score: number
  total: number
  percentage: number
  timeTaken?: number
  feedback: string
  gradedAt: Date
  breakdown: IGradeBreakdown[]
  createdAt: Date
  updatedAt: Date
}

// Proper subdocument schema
const BreakdownSchema = new Schema<IGradeBreakdown>(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    studentAnswer: {
      type: Schema.Types.Mixed,
      default: null,
    },
    correctAnswer: {
      type: String,
      default: '',
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marks: {
      type: Number,
      default: 0,
    },
    awarded: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
)

const GradeSchema = new Schema<IGrade>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
      required: true,
    },

    timeTaken: {
      type: Number,
      default: null,
    },

    feedback: {
      type: String,
      default: '',
    },

    gradedAt: {
      type: Date,
      default: Date.now,
    },

    breakdown: {
      type: [BreakdownSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const Grade: Model<IGrade> =
  mongoose.models.Grade ||
  mongoose.model<IGrade>('Grade', GradeSchema)

export default Grade
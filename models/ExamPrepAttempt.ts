// models/ExamPrepAttempt.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepAttempt extends Document {
  examPrepStudentId: mongoose.Types.ObjectId
  examType: 'jamb' | 'waec' | 'neco'
  subject: string
  score: number
  total: number
  percentage: number
  durationSeconds: number
  breakdown: {
    question: string
    selected: string
    correct: string
    isCorrect: boolean
  }[]
  createdAt: Date
  updatedAt: Date
}

const ExamPrepAttemptSchema = new Schema<IExamPrepAttempt>(
  {
    examPrepStudentId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamPrepStudent',
      required: true,
      index: true,
    },
    examType: {
      type: String,
      enum: ['jamb', 'waec', 'neco'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    breakdown: {
      type: [{
        question: { type: String, required: true },
        selected: { type: String, default: '' },
        correct: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Add indexes for common queries
ExamPrepAttemptSchema.index({ examPrepStudentId: 1, createdAt: -1 })
ExamPrepAttemptSchema.index({ examPrepStudentId: 1, examType: 1 })
ExamPrepAttemptSchema.index({ examPrepStudentId: 1, subject: 1 })

const ExamPrepAttempt: Model<IExamPrepAttempt> =
  mongoose.models.ExamPrepAttempt ||
  mongoose.model<IExamPrepAttempt>('ExamPrepAttempt', ExamPrepAttemptSchema)

export default ExamPrepAttempt
// models/MaterialProgress.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IQuizAttempt {
  unitKey: string
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  attemptedAt: Date
}

export interface IMaterialProgress extends Document {
  studentId: mongoose.Types.ObjectId
  materialId: mongoose.Types.ObjectId
  viewedKeys: string[]
  quizAttempts: IQuizAttempt[]
  lastVisitedKey: string | null
  createdAt: Date
  updatedAt: Date
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    unitKey: { type: String, required: true },
    questionId: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const MaterialProgressSchema = new Schema<IMaterialProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    materialId: { type: Schema.Types.ObjectId, ref: 'CourseMaterial', required: true },
    viewedKeys: [{ type: String }],
    quizAttempts: [QuizAttemptSchema],
    lastVisitedKey: { type: String, default: null },
  },
  { timestamps: true }
)

MaterialProgressSchema.index({ studentId: 1, materialId: 1 }, { unique: true })

const MaterialProgress: Model<IMaterialProgress> =
  mongoose.models.MaterialProgress ||
  mongoose.model<IMaterialProgress>('MaterialProgress', MaterialProgressSchema)

export default MaterialProgress
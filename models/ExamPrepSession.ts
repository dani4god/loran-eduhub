// models/ExamPrepSession.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepSession extends Document {
  sessionToken: string
  examPrepStudentId: mongoose.Types.ObjectId
  examType: string
  subject: string
  questions: { id: string; text: string; options: any; correctAnswer: string }[]
  durationMinutes: number
  used: boolean
  expiresAt: Date
  createdAt: Date
}

const ExamPrepSessionSchema = new Schema<IExamPrepSession>(
  {
    sessionToken: { type: String, required: true, unique: true },
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true },
    examType: { type: String, required: true },
    subject: { type: String, required: true },
    questions: [{ id: String, text: String, options: Schema.Types.Mixed, correctAnswer: String }],
    durationMinutes: { type: Number, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

// Mongo TTL index — expired sessions self-delete, no cleanup job needed.
ExamPrepSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const ExamPrepSession: Model<IExamPrepSession> =
  mongoose.models.ExamPrepSession || mongoose.model<IExamPrepSession>('ExamPrepSession', ExamPrepSessionSchema)
export default ExamPrepSession
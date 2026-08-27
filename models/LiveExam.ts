// models/LiveExam.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILiveExamQuestion {
  _id?: mongoose.Types.ObjectId
  type: 'mcq' | 'trueFalse' | 'fill'
  question: string
  options?: string[]
  correctAnswer: string
  marks: number
}

export interface ILiveExam extends Document {
  title: string
  description: string
  requirements: string
  scheduledDate: Date
  durationMinutes: number
  questions: ILiveExamQuestion[]
  status: 'draft' | 'published'
  createdAt: Date
}

const LiveExamQuestionSchema = new Schema<ILiveExamQuestion>(
  { type: { type: String, enum: ['mcq', 'trueFalse', 'fill'], required: true }, question: { type: String, required: true }, options: [String], correctAnswer: { type: String, required: true }, marks: { type: Number, default: 1 } },
  { _id: true }
)

const LiveExamSchema = new Schema<ILiveExam>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    requirements: { type: String, default: '' },
    scheduledDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    questions: [LiveExamQuestionSchema],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
)

const LiveExam: Model<ILiveExam> = mongoose.models.LiveExam || mongoose.model<ILiveExam>('LiveExam', LiveExamSchema)
export default LiveExam
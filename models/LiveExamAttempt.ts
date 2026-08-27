// models/LiveExamAttempt.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILiveExamAttempt extends Document {
  liveExamId: mongoose.Types.ObjectId
  examPrepStudentId: mongoose.Types.ObjectId
  score: number
  total: number
  percentage: number
  submittedAt: Date
}

const LiveExamAttemptSchema = new Schema<ILiveExamAttempt>(
  {
    liveExamId: { type: Schema.Types.ObjectId, ref: 'LiveExam', required: true },
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

LiveExamAttemptSchema.index({ liveExamId: 1, examPrepStudentId: 1 }, { unique: true }) // one attempt per student per live exam

const LiveExamAttempt: Model<ILiveExamAttempt> =
  mongoose.models.LiveExamAttempt || mongoose.model<ILiveExamAttempt>('LiveExamAttempt', LiveExamAttemptSchema)
export default LiveExamAttempt
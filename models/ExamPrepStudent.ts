// models/ExamPrepStudent.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepStudent extends Document {
  regNumber: string
  fullName: string
  location: string
  school: string
  subjectsInterested: string[]
  discordId?: string
  discordUsername?: string
  discordRoles?: string[]
  createdAt: Date
}

const ExamPrepStudentSchema = new Schema<IExamPrepStudent>(
  {
    regNumber: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    location: { type: String, required: true },
    school: { type: String, required: true },
    subjectsInterested: { type: [String], default: [] },
    discordId: { type: String, default: null, sparse: true },
    discordUsername: { type: String, default: null },
    discordRoles: { type: [String], default: [] },
  },
  { timestamps: true }
)

ExamPrepStudentSchema.index({ fullName: 'text' })

const ExamPrepStudent: Model<IExamPrepStudent> =
  mongoose.models.ExamPrepStudent || mongoose.model<IExamPrepStudent>('ExamPrepStudent', ExamPrepStudentSchema)
export default ExamPrepStudent
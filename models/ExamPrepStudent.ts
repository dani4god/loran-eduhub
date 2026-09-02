import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepStudent extends Document {
  regNumber: string
  fullName: string
  email: string
  location: string
  school: string
  subjectsInterested: string[]
  authPinHash: string
  lastLoginAt?: Date
  discordId?: string
  discordUsername?: string
  discordRoles?: string[]
  createdAt: Date
  updatedAt: Date
}

const ExamPrepStudentSchema = new Schema<IExamPrepStudent>(
  {
    regNumber: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    location: { type: String, required: true, trim: true },
    school: { type: String, required: true, trim: true },
    subjectsInterested: { type: [String], default: [] },
    authPinHash: { type: String, required: true, select: false },
    lastLoginAt: Date,
    discordId: { type: String, default: null, sparse: true },
    discordUsername: { type: String, default: null },
    discordRoles: { type: [String], default: [] },
  },
  { timestamps: true }
)

ExamPrepStudentSchema.index({ fullName: 'text' })

const ExamPrepStudent: Model<IExamPrepStudent> =
  mongoose.models.ExamPrepStudent ||
  mongoose.model<IExamPrepStudent>('ExamPrepStudent', ExamPrepStudentSchema)

export default ExamPrepStudent

// models/SelfPacedCourse.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISPQuestion {
  _id?: mongoose.Types.ObjectId
  type: 'mcq' | 'fill' | 'trueFalse'
  question: string
  options?: string[]
  correctAnswer: string
  marks: number
}

export interface ISPWeek {
  _id?: mongoose.Types.ObjectId
  weekNumber: number
  title: string
  content: string
  links: { label: string; url: string }[]
  exam: {
    durationMinutes: number
    questions: ISPQuestion[]
  }
}

export interface IWeeklyWorkshop {
  enabled: boolean
  dayOfWeek?: string
  time?: string
  description?: string
}

export interface ISelfPacedCourse extends Document {
  tutorId: mongoose.Types.ObjectId
  title: string
  description: string
  coverImageUrl: string
  price: number // 0 = free
  category: string
  weeks: ISPWeek[]
  status: 'draft' | 'pending_approval' | 'published' | 'rejected'
  rejectionReason?: string
  coachingEnabled: boolean
  coachingHourlyRate: number
  discordEnabled: boolean
  discordDescription: string
  weeklyWorkshop: IWeeklyWorkshop
  certificateSignatureUrl?: string
  certificateLogoUrl?: string
  createdAt: Date
  updatedAt: Date
}

const SPQuestionSchema = new Schema<ISPQuestion>(
  {
    type: { type: String, enum: ['mcq', 'fill', 'trueFalse'], required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    marks: { type: Number, default: 1 },
  },
  { _id: true }
)

const SPWeekSchema = new Schema<ISPWeek>(
  {
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    links: [{ label: String, url: String }],
    exam: {
      durationMinutes: { type: Number, default: 60 },
      questions: [SPQuestionSchema],
    },
  },
  { _id: true }
)

const SelfPacedCourseSchema = new Schema<ISelfPacedCourse>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImageUrl: { type: String, default: null },
    price: { type: Number, default: 0, min: 0 },
    category: { type: String, default: '' },
    weeks: [SPWeekSchema],
    status: { type: String, enum: ['draft', 'pending_approval', 'published', 'rejected'], default: 'draft' },
    rejectionReason: { type: String },
    coachingEnabled: { type: Boolean, default: false },
    coachingHourlyRate: { type: Number, default: 0 },
    discordEnabled: { type: Boolean, default: true },
    discordDescription: { type: String, default: 'Join our Discord community to get your questions answered instantly by students and tutors.' },
    weeklyWorkshop: {
      enabled: { type: Boolean, default: false },
      dayOfWeek: { type: String },
      time: { type: String },
      description: { type: String },
    },
    certificateSignatureUrl: { type: String },
    certificateLogoUrl: { type: String },
  },
  { timestamps: true }
)

const SelfPacedCourse: Model<ISelfPacedCourse> =
  mongoose.models.SelfPacedCourse || mongoose.model<ISelfPacedCourse>('SelfPacedCourse', SelfPacedCourseSchema)

export default SelfPacedCourse
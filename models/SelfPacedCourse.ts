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

export interface ISPPage {
  _id?: mongoose.Types.ObjectId
  title: string
  content: string
  links: { label: string; url: string }[]
}

export interface ISPWeek {
  _id?: mongoose.Types.ObjectId
  weekNumber: number
  title: string
  pages: ISPPage[]
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
  sourceCourseId: mongoose.Types.ObjectId
  rejectionReason?: string
  coachingEnabled: boolean
  previewVideoUrl?: string
  coachingHourlyRate: number
  discordEnabled: boolean
  discordDescription: string
  weeklyWorkshop: IWeeklyWorkshop
  learningOutcomes: string[]
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

const SPPageSchema = new Schema<ISPPage>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    links: [{ label: String, url: String }],
  },
  { _id: true }
)

const SPWeekSchema = new Schema<ISPWeek>(
  {
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    pages: [SPPageSchema],
    exam: {
      durationMinutes: { type: Number, default: 20 },
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
    sourceCourseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
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
    learningOutcomes: { type: [String], default: [] },
    certificateLogoUrl: { type: String },
    previewVideoUrl: { type: String, default: null }
  },
  { timestamps: true }
)

const SelfPacedCourse: Model<ISelfPacedCourse> =
  mongoose.models.SelfPacedCourse || mongoose.model<ISelfPacedCourse>('SelfPacedCourse', SelfPacedCourseSchema)

export default SelfPacedCourse
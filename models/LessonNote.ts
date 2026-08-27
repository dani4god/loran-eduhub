// models/LessonNote.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILNPage {
  _id?: mongoose.Types.ObjectId
  title: string
  content: string
  links: { label: string; url: string }[]
}

export interface ILNWeek {
  _id?: mongoose.Types.ObjectId
  weekNumber: number
  title: string
  pages: ILNPage[]
}

export interface ILessonNote extends Document {
  tutorId: mongoose.Types.ObjectId
  title: string
  description: string
  coverImageUrl?: string
  previewVideoUrl?: string
  price: number
  studentClass: string // 'jss1'...'ss3'
  category?: string // only for SS classes
  subject: string
  weeks: ILNWeek[]
  status: 'draft' | 'pending_approval' | 'published' | 'rejected'
  rejectionReason?: string
  purchaseCount: number
  createdAt: Date
  updatedAt: Date
}

const LNPageSchema = new Schema<ILNPage>(
  { title: { type: String, required: true }, content: { type: String, default: '' }, links: [{ label: String, url: String }] },
  { _id: true }
)
const LNWeekSchema = new Schema<ILNWeek>(
  { weekNumber: { type: Number, required: true }, title: { type: String, required: true }, pages: [LNPageSchema] },
  { _id: true }
)

const LessonNoteSchema = new Schema<ILessonNote>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImageUrl: { type: String, default: null },
    previewVideoUrl: { type: String, default: null },
    price: { type: Number, default: 0, min: 0 },
    studentClass: { type: String, required: true, index: true },
    category: { type: String },
    subject: { type: String, required: true, index: true },
    weeks: [LNWeekSchema],
    status: { type: String, enum: ['draft', 'pending_approval', 'published', 'rejected'], default: 'draft', index: true },
    rejectionReason: { type: String },
    purchaseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const LessonNote: Model<ILessonNote> = mongoose.models.LessonNote || mongoose.model<ILessonNote>('LessonNote', LessonNoteSchema)
export default LessonNote
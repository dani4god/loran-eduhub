// models/Review.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReview extends Document {
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  rating: number
  comment: string
  studentDisplayName: string // e.g. "Chidi O." — privacy-safe snapshot, no email/phone/full surname
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    studentDisplayName: { type: String, required: true },
  },
  { timestamps: true }
)

// One review per student per tutor+course — resubmitting updates it rather
// than creating a duplicate.
ReviewSchema.index({ studentId: 1, tutorId: 1, courseId: 1 }, { unique: true })
ReviewSchema.index({ tutorId: 1, createdAt: -1 })

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
export default Review
// models/CoachingBooking.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICoachingBooking extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  slotId: mongoose.Types.ObjectId
  amountPaid: number
  paystackReference?: string
  status: 'pending_payment' | 'confirmed'
  tutorReplyMessage?: string
  tutorReplyLink?: string
  repliedAt?: Date
  createdAt: Date
}

const CoachingBookingSchema = new Schema<ICoachingBooking>(
  {
    selfPacedStudentId: { type: Schema.Types.ObjectId, ref: 'SelfPacedStudent', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'SelfPacedCourse', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'TutorAvailabilitySlot', required: true },
    amountPaid: { type: Number, required: true },
    paystackReference: { type: String },
    status: { type: String, enum: ['pending_payment', 'confirmed'], default: 'pending_payment' },
    tutorReplyMessage: { type: String },
    tutorReplyLink: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
)

const CoachingBooking: Model<ICoachingBooking> =
  mongoose.models.CoachingBooking || mongoose.model<ICoachingBooking>('CoachingBooking', CoachingBookingSchema)

export default CoachingBooking
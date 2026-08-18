// models/TutorAvailabilitySlot.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITutorAvailabilitySlot extends Document {
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  date: Date
  startTime: string // "14:00"
  endTime: string   // "15:00"
  isBooked: boolean
  createdAt: Date
}

const TutorAvailabilitySlotSchema = new Schema<ITutorAvailabilitySlot>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'SelfPacedCourse', required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const TutorAvailabilitySlot: Model<ITutorAvailabilitySlot> =
  mongoose.models.TutorAvailabilitySlot || mongoose.model<ITutorAvailabilitySlot>('TutorAvailabilitySlot', TutorAvailabilitySlotSchema)

export default TutorAvailabilitySlot
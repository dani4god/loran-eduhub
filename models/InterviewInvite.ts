// models/InterviewInvite.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IInterviewInvite extends Document {
  tutorId: mongoose.Types.ObjectId
  scheduledDate: Date
  venue: string
  meetingLink?: string
  hrName: string
  sentAt: Date
  sentByAdminId: mongoose.Types.ObjectId
  createdAt: Date
}

const InterviewInviteSchema = new Schema<IInterviewInvite>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    scheduledDate: { type: Date, required: true },
    venue: { type: String, required: true },
    meetingLink: { type: String },
    hrName: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    sentByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
)

const InterviewInvite: Model<IInterviewInvite> =
  mongoose.models.InterviewInvite || mongoose.model<IInterviewInvite>('InterviewInvite', InterviewInviteSchema)

export default InterviewInvite
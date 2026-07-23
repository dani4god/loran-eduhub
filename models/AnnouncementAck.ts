// models/AnnouncementAck.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAnnouncementAck extends Document {
  announcementId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  acknowledgedAt: Date
}

const AnnouncementAckSchema = new Schema<IAnnouncementAck>(
  {
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

AnnouncementAckSchema.index({ announcementId: 1, studentId: 1 }, { unique: true })

const AnnouncementAck: Model<IAnnouncementAck> =
  mongoose.models.AnnouncementAck ||
  mongoose.model<IAnnouncementAck>('AnnouncementAck', AnnouncementAckSchema)

export default AnnouncementAck
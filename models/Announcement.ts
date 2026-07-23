// models/Announcement.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAnnouncementLink {
  _id?: mongoose.Types.ObjectId
  label: string
  url: string
}

export interface IAnnouncement extends Document {
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  title: string
  message: string
  links: IAnnouncementLink[]
  scheduledAt?: Date // optional class time, if this is a class-schedule announcement
  createdAt: Date
  updatedAt: Date
}

const AnnouncementLinkSchema = new Schema<IAnnouncementLink>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: true }
)

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    links: [AnnouncementLinkSchema],
    scheduledAt: { type: Date },
  },
  { timestamps: true }
)

AnnouncementSchema.index({ tutorId: 1, courseId: 1, createdAt: -1 })

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)

export default Announcement
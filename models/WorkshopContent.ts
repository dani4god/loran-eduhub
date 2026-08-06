// models/WorkshopContent.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISpeaker {
  _id?: mongoose.Types.ObjectId
  name: string
  title: string
  institution: string
  sessionTitle: string
  description: string
  points: string[]
  isConvener: boolean
}

export interface IWorkshopContent extends Document {
  key: string
  heading: string
  subheading: string
  speakers: ISpeaker[]
  advertImages: string[]
  discordInviteLink: string
  updatedAt: Date
}

const SpeakerSchema = new Schema<ISpeaker>(
  {
    name: { type: String, required: true },
    title: { type: String, default: '' },
    institution: { type: String, default: '' },
    sessionTitle: { type: String, required: true },
    description: { type: String, default: '' },
    points: [{ type: String }],
    isConvener: { type: Boolean, default: false },
  },
  { _id: true }
)

const WorkshopContentSchema = new Schema<IWorkshopContent>(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    heading: { type: String, required: true },
    subheading: { type: String, default: '' },
    speakers: [SpeakerSchema],
    advertImages: [{ type: String }],
    discordInviteLink: { type: String, default: '' },
  },
  { timestamps: true }
)

const WorkshopContent: Model<IWorkshopContent> =
  mongoose.models.WorkshopContent || mongoose.model<IWorkshopContent>('WorkshopContent', WorkshopContentSchema)

export default WorkshopContent
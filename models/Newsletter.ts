// models/Newsletter.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INewsletterLink {
  _id?: mongoose.Types.ObjectId
  label: string
  url: string
}

export interface INewsletter extends Document {
  subject: string
  heading: string
  bodyHtml: string
  imageUrl?: string
  links: INewsletterLink[]
  audience: 'all' | 'students' | 'tutors' | 'admins'
  recipientCount: number
  sentByAdminId: mongoose.Types.ObjectId
  sentAt: Date
  createdAt: Date
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    subject: { type: String, required: true, trim: true },
    heading: { type: String, required: true, trim: true },
    bodyHtml: { type: String, required: true },
    imageUrl: { type: String },
    links: [{
      label: { type: String, required: true },
      url: { type: String, required: true },
    }],
    audience: { type: String, enum: ['all', 'students', 'tutors', 'admins'], required: true },
    recipientCount: { type: Number, required: true },
    sentByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const Newsletter: Model<INewsletter> =
  mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', NewsletterSchema)

export default Newsletter
// models/Advertisement.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAdvertisement extends Document {
  title: string
  message: string
  imageUrl?: string
  linkUrl?: string
  linkLabel?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: null },
    linkUrl: { type: String, default: null },
    linkLabel: { type: String, default: 'Learn More' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Advertisement: Model<IAdvertisement> =
  mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema)

export default Advertisement
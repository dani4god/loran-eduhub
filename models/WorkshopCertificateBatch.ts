// models/WorkshopCertificateBatch.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWorkshopCertificateBatch extends Document {
  title: string
  code: string
  themeImageUrl: string
  logoUrl: string
  signatureUrl: string
  convenerName: string
  isActive: boolean
  createdAt: Date
}

const WorkshopCertificateBatchSchema = new Schema<IWorkshopCertificateBatch>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true },
    themeImageUrl: { type: String, required: true },
    logoUrl: { type: String, required: true },
    signatureUrl: { type: String, required: true },
    convenerName: { type: String, required: true, default: 'Okeke Daniel' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const WorkshopCertificateBatch: Model<IWorkshopCertificateBatch> =
  mongoose.models.WorkshopCertificateBatch ||
  mongoose.model<IWorkshopCertificateBatch>('WorkshopCertificateBatch', WorkshopCertificateBatchSchema)

export default WorkshopCertificateBatch
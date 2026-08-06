// models/WorkshopCertificateIssue.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWorkshopCertificateIssue extends Document {
  batchId: mongoose.Types.ObjectId
  fullName: string
  certificateNumber: string
  issuedAt: Date
}

const WorkshopCertificateIssueSchema = new Schema<IWorkshopCertificateIssue>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'WorkshopCertificateBatch', required: true, index: true },
    fullName: { type: String, required: true },
    certificateNumber: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const WorkshopCertificateIssue: Model<IWorkshopCertificateIssue> =
  mongoose.models.WorkshopCertificateIssue ||
  mongoose.model<IWorkshopCertificateIssue>('WorkshopCertificateIssue', WorkshopCertificateIssueSchema)

export default WorkshopCertificateIssue
// models/Certificate.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type CertificateClassification = 'distinction' | 'credit' | 'pass'

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  certificateNumber: string
  studentName: string
  nameEdited: boolean
  courseName: string
  tutorName: string
  signatureUrl: string
  logoUrl: string
  averageScore: number
  classification: CertificateClassification
  durationStart: Date
  durationEnd: Date
  issuedAt: Date
  viewedByStudent: boolean
  createdAt: Date
  updatedAt: Date
}

const CertificateSchema = new Schema<ICertificate>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    certificateNumber: { type: String, required: true, unique: true },
    studentName: { type: String, required: true, trim: true },
    nameEdited: { type: Boolean, default: false },
    courseName: { type: String, required: true },
    tutorName: { type: String, required: true },
    signatureUrl: { type: String, required: true },
    logoUrl: { type: String, required: true },
    averageScore: { type: Number, required: true },
    classification: { type: String, enum: ['distinction', 'credit', 'pass'], required: true },
    durationStart: { type: Date, required: true },
    durationEnd: { type: Date, required: true },
    issuedAt: { type: Date, default: Date.now },
    viewedByStudent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema)

export default Certificate
// models/SelfPacedCertificate.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISelfPacedCertificate extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  certificateNumber: string
  studentName: string
  nameEdited: boolean
  courseName: string
  tutorName: string
  signatureUrl: string
  logoUrl: string
  averageScore: number
  classification: 'distinction' | 'credit' | 'pass'
  issuedAt: Date
  createdAt: Date
}

const SelfPacedCertificateSchema = new Schema<ISelfPacedCertificate>(
  {
    selfPacedStudentId: { type: Schema.Types.ObjectId, ref: 'SelfPacedStudent', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'SelfPacedCourse', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'SelfPacedEnrollment', required: true, unique: true },
    certificateNumber: { type: String, required: true, unique: true },
    studentName: { type: String, required: true },
    nameEdited: { type: Boolean, default: false },
    courseName: { type: String, required: true },
    tutorName: { type: String, required: true },
    signatureUrl: { type: String, required: true },
    logoUrl: { type: String, required: true },
    averageScore: { type: Number, required: true },
    classification: { type: String, enum: ['distinction', 'credit', 'pass'], required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const SelfPacedCertificate: Model<ISelfPacedCertificate> =
  mongoose.models.SelfPacedCertificate || mongoose.model<ISelfPacedCertificate>('SelfPacedCertificate', SelfPacedCertificateSchema)

export default SelfPacedCertificate
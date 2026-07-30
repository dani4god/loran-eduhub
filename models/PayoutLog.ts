// models/PayoutLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayoutLog extends Document {
  paymentId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  paystackTransferCode?: string
  paystackTransferReference?: string
  failureReason?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PayoutLogSchema = new Schema<IPayoutLog>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    grossAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true, default: 0.15 },
    commissionAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending', index: true },
    paystackTransferCode: { type: String },
    paystackTransferReference: { type: String },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
)

const PayoutLog: Model<IPayoutLog> = mongoose.models.PayoutLog || mongoose.model<IPayoutLog>('PayoutLog', PayoutLogSchema)

PayoutLogSchema.index({ paymentId: 1, tutorId: 1, courseId: 1 }, { unique: true })

export default PayoutLog

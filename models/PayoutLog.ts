// models/PayoutLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type PayoutSourceModel = 'Payment' | 'CoachingBooking'

export interface IPayoutLog extends Document {
  sourceModel: PayoutSourceModel
  paymentId?: mongoose.Types.ObjectId
  bookingId?: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId // may point to Student OR SelfPacedStudent, depending on sourceModel
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId // may point to Course OR SelfPacedCourse, depending on sourceModel
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
    // Distinguishes what generated this payout — a regular course
    // enrollment payment, or a coaching session booking. Everything
    // downstream (admin payouts list, tutor payment history) branches on
    // this to know which collections studentId/courseId actually point to.
    sourceModel: { type: String, enum: ['Payment', 'CoachingBooking'], required: true, index: true },

    // Only set when sourceModel === 'Payment' — a coaching booking has no
    // Payment document, so this must be optional, not required.
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    // Only set when sourceModel === 'CoachingBooking'.
    bookingId: { type: Schema.Types.ObjectId, ref: 'CoachingBooking' },

    // No `ref` pinned here intentionally — for a course-enrollment payout
    // this points to Student, for a coaching-booking payout it points to
    // SelfPacedStudent. Whichever route reads this must check sourceModel
    // first to know which collection to query.
    studentId: { type: Schema.Types.ObjectId, required: true },

    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },

    // Same reasoning as studentId — Course for enrollment payouts,
    // SelfPacedCourse for coaching payouts.
    courseId: { type: Schema.Types.ObjectId, required: true },

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

// Two separate sparse-unique indexes, one per source type — sparse means
// documents missing the indexed field (e.g. a CoachingBooking-sourced log
// with no paymentId) are simply excluded from that index instead of
// colliding on a shared `null` value, which is what would happen with a
// single non-sparse compound index across both source types.
PayoutLogSchema.index(
  { sourceModel: 1, paymentId: 1, tutorId: 1, courseId: 1 },
  { unique: true, sparse: true }
)
PayoutLogSchema.index(
  { sourceModel: 1, bookingId: 1 },
  { unique: true, sparse: true }
)

const PayoutLog: Model<IPayoutLog> =
  mongoose.models.PayoutLog || mongoose.model<IPayoutLog>('PayoutLog', PayoutLogSchema)

export default PayoutLog
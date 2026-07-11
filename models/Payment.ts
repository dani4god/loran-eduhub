import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId
  enrollmentIds: mongoose.Types.ObjectId[]
  groupId?: mongoose.Types.ObjectId
  amount: number
  currency: string
  plan: 'trial' | '3months' | '6months' | '1year'
  tutorCount: number
  basePlanAmount?: number
  paystackReference?: string
  paystackAccessCode?: string
  status: 'pending' | 'success' | 'failed'
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    enrollmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Enrollment',
      },
    ],
    groupId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    plan: {
      type: String,
      enum: ['trial', '3months', '6months', '1year'],
      required: true,
    },
    tutorCount: {
      type: Number,
      default: 1,
    },
    basePlanAmount: {
      type: Number,
    },
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    paystackAccessCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)

export default Payment
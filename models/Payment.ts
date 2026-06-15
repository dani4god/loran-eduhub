import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId
  enrollmentIds: mongoose.Types.ObjectId[]
  groupId: mongoose.Types.ObjectId
  amount: number
  currency: string
  plan: 'trial' | '3months' | '6months' | '1year'
  tutorCount: number
  basePlanAmount: number
  paystackReference: string
  paystackAccessCode?: string
  status: 'pending' | 'success' | 'failed'
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollmentIds: [{ type: Schema.Types.ObjectId, ref: 'Enrollment', required: true }],
    groupId: { type: Schema.Types.ObjectId, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    plan: { type: String, enum: ['trial', '3months', '6months', '1year'], required: true },
    tutorCount: { type: Number, required: true, default: 1 },
    basePlanAmount: { type: Number, required: true },
    paystackReference: { type: String, required: true, unique: true },
    paystackAccessCode: { type: String },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: true }
)

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export default Payment
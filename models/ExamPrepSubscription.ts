// models/ExamPrepSubscription.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepSubscription extends Document {
  examPrepStudentId: mongoose.Types.ObjectId
  wasFreeAtRegistration: boolean // if free at signup, access is permanent regardless of later admin changes
  planDuration?: '1month' | '2months' | '3months' | 'life'
  amountPaid?: number
  paystackReference?: string
  startDate?: Date
  endDate?: Date // undefined for 'life'
  createdAt: Date
}

const ExamPrepSubscriptionSchema = new Schema<IExamPrepSubscription>(
  {
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, unique: true },
    wasFreeAtRegistration: { type: Boolean, required: true },
    planDuration: { type: String, enum: ['1month', '2months', '3months', 'life'] },
    amountPaid: { type: Number },
    paystackReference: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
)

const ExamPrepSubscription: Model<IExamPrepSubscription> =
  mongoose.models.ExamPrepSubscription || mongoose.model<IExamPrepSubscription>('ExamPrepSubscription', ExamPrepSubscriptionSchema)
export default ExamPrepSubscription
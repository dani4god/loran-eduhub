import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExamPrepSubscription extends Document {
  examPrepStudentId: mongoose.Types.ObjectId
  wasFreeAtRegistration: boolean
  planDuration?: '1month' | '2months' | '3months' | 'life'
  amountPaid?: number
  paystackReference?: string
  startDate?: Date
  endDate?: Date
}

const ExamPrepSubscriptionSchema = new Schema<IExamPrepSubscription>(
  {
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, unique: true },
    wasFreeAtRegistration: { type: Boolean, required: true },
    planDuration: { type: String, enum: ['1month', '2months', '3months', 'life'] },
    amountPaid: Number,
    paystackReference: String,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
)

const ExamPrepSubscription: Model<IExamPrepSubscription> =
  mongoose.models.ExamPrepSubscription ||
  mongoose.model<IExamPrepSubscription>('ExamPrepSubscription', ExamPrepSubscriptionSchema)

export default ExamPrepSubscription

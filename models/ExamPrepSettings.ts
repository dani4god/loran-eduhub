// models/ExamPrepSettings.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPlanPrice { duration: '1month' | '2months' | '3months' | 'life'; price: number; enabled: boolean }

export interface IExamPrepSettings extends Document {
  key: string
  isLocked: boolean // admin lock/unlock — locked means students can't take exams at all
  isPaid: boolean // free vs paid
  plans: IPlanPrice[]
  updatedAt: Date
}

const ExamPrepSettingsSchema = new Schema<IExamPrepSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    isLocked: { type: Boolean, default: true }, // starts locked until admin unlocks
    isPaid: { type: Boolean, default: false },
    plans: {
      type: [{ duration: String, price: Number, enabled: Boolean }],
      default: [
        { duration: '1month', price: 1000, enabled: true },
        { duration: '2months', price: 1800, enabled: true },
        { duration: '3months', price: 2500, enabled: true },
        { duration: 'life', price: 5000, enabled: true },
      ],
    },
  },
  { timestamps: true }
)

const ExamPrepSettings: Model<IExamPrepSettings> =
  mongoose.models.ExamPrepSettings || mongoose.model<IExamPrepSettings>('ExamPrepSettings', ExamPrepSettingsSchema)
export default ExamPrepSettings
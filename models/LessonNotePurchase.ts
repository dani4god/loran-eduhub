// models/LessonNotePurchase.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILessonNotePurchase extends Document {
  lessonNoteId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  buyerEmail: string
  buyerName: string
  amountPaid: number
  paystackReference: string
  payoutLogged: boolean
  createdAt: Date
}

const LessonNotePurchaseSchema = new Schema<ILessonNotePurchase>(
  {
    lessonNoteId: { type: Schema.Types.ObjectId, ref: 'LessonNote', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    buyerEmail: { type: String, required: true },
    buyerName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paystackReference: { type: String, required: true, unique: true },
    payoutLogged: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const LessonNotePurchase: Model<ILessonNotePurchase> =
  mongoose.models.LessonNotePurchase || mongoose.model<ILessonNotePurchase>('LessonNotePurchase', LessonNotePurchaseSchema)
export default LessonNotePurchase
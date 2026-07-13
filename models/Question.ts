// models/Question.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId
  type: 'mcq' | 'fill-in-the-gap' | 'true-or-false'
  questionText: string
  options: string[]
  correctAnswer: string
  marks: number
  order: number
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema<IQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'fill-in-the-gap', 'true-or-false'],
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
)

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema)

export default Question
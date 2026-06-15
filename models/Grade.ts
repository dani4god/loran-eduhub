import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGrade extends Document {
  studentId: mongoose.Types.ObjectId
  examId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  answers?: { questionId: mongoose.Types.ObjectId; answer: string }[]
  score: number
  total: number
  percentage: number
  feedback?: string
  gradedAt?: Date
  isAutoGraded: boolean
  createdAt: Date
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        answer: { type: String },
      },
    ],
    score: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true, default: 0 },
    feedback: { type: String },
    gradedAt: { type: Date },
    isAutoGraded: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Grade: Model<IGrade> = mongoose.models.Grade || mongoose.model('Grade', GradeSchema)
export default Grade
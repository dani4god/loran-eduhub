// models/WithdrawalFeedback.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type WithdrawalReason =
  | 'too_expensive'
  | 'not_satisfied_with_tutor'
  | 'course_too_difficult'
  | 'course_too_easy'
  | 'no_longer_needed'
  | 'found_alternative'
  | 'technical_issues'
  | 'schedule_conflict'
  | 'other'

export const WITHDRAWAL_REASONS: WithdrawalReason[] = [
  'too_expensive',
  'not_satisfied_with_tutor',
  'course_too_difficult',
  'course_too_easy',
  'no_longer_needed',
  'found_alternative',
  'technical_issues',
  'schedule_conflict',
  'other',
]

export interface IWithdrawalFeedback extends Document {
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  reason: WithdrawalReason
  feedback: string
  studentSnapshot: {
    firstName: string
    lastName: string
    phone: string
    email: string
  }
  courseSnapshot: {
    courseName: string
    plan: string
    amountPaid: number
  }
  withdrawnAt: Date
  createdAt: Date
  updatedAt: Date
}

const WithdrawalFeedbackSchema = new Schema<IWithdrawalFeedback>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    reason: { type: String, enum: WITHDRAWAL_REASONS, required: true },
    feedback: { type: String, trim: true, default: '' },
    studentSnapshot: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    courseSnapshot: {
      courseName: { type: String, required: true },
      plan: { type: String, required: true },
      amountPaid: { type: Number, required: true },
    },
    withdrawnAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const WithdrawalFeedback: Model<IWithdrawalFeedback> =
  mongoose.models.WithdrawalFeedback ||
  mongoose.model<IWithdrawalFeedback>('WithdrawalFeedback', WithdrawalFeedbackSchema)

export default WithdrawalFeedback
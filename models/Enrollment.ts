// models/Enrollment.ts - Updated
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  groupId: mongoose.Types.ObjectId
  plan: 'trial' | '3months' | '6months' | '1year'
  status: 'pending' | 'active' | 'paused' | 'expired' | 'suspended'
  startDate: Date
  endDate: Date
  amount: number
  paymentId?: mongoose.Types.ObjectId
  pausedAt?: Date
  pausedBy?: 'tutor' | 'admin'
  createdAt: Date
  updatedAt: Date
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    plan: {
      type: String,
      enum: ['trial', '3months', '6months', '1year'],
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'expired', 'suspended'],
      default: 'pending',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    pausedAt: { type: Date },
    pausedBy: { type: String, enum: ['tutor', 'admin'] },
  },
  { timestamps: true }
)

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema)
export default Enrollment
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  groupId: mongoose.Types.ObjectId

  plan: 'trial' | 'monthly' | '3months' | '6months' | '1year'

  status: 'pending' | 'active' | 'withdrawn' | 'paused' | 'expired' | 'suspended'

  startDate: Date
  endDate: Date

  amount: number

  paymentId?: mongoose.Types.ObjectId

  pausedAt?: Date
  pausedBy?: 'tutor' | 'admin'

  withdrawnAt?: Date

  isActive(): boolean
  isExpiringSoon(daysThreshold?: number): boolean

  createdAt: Date
  updatedAt: Date
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
      index: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    groupId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    plan: {
      type: String,
      enum: ['trial', 'monthly', '3months', '6months', '1year'],
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'withdrawn', 'paused', 'expired', 'suspended'],
      default: 'pending',
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },

    pausedAt: Date,

    pausedBy: {
      type: String,
      enum: ['tutor', 'admin'],
    },

    withdrawnAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

EnrollmentSchema.index({ studentId: 1, status: 1 })
EnrollmentSchema.index({ tutorId: 1, status: 1 })

// NOTE: this is synchronous middleware (no `next` param) — Mongoose
// auto-completes it when the function returns. Declaring a `next`
// parameter here instead would make Mongoose wait for an explicit
// next() call, which this function never made — that previously caused
// every enrollment save to hang indefinitely.
EnrollmentSchema.pre<IEnrollment>('save', function () {
  if (!this.endDate && this.startDate) {
    const durationMap: Record<
      'trial' | 'monthly' | '3months' | '6months' | '1year',
      number
    > = {
      trial: 7,
      monthly: 30,
      '3months': 90,
      '6months': 180,
      '1year': 365,
    }

    const duration = durationMap[this.plan]

    this.endDate = new Date(
      this.startDate.getTime() + duration * 24 * 60 * 60 * 1000
    )
  }
})

EnrollmentSchema.methods.isActive = function (): boolean {
  if (!this.endDate) return false

  return (
    this.status === 'active' &&
    this.endDate.getTime() > Date.now()
  )
}

EnrollmentSchema.methods.isExpiringSoon = function (
  daysThreshold = 7
): boolean {
  if (!this.endDate || this.status !== 'active') {
    return false
  }

  const msRemaining = this.endDate.getTime() - Date.now()

  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24)

  return daysRemaining > 0 && daysRemaining <= daysThreshold
}

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema)

export default Enrollment
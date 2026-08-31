// models/SelfPacedEnrollment.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface IWeekProgress {
  weekNumber: number
  examScore: number
  examTotal: number
  examPercentage: number
  passed: boolean
  attemptsUsed: number
  attemptedAt: Date
}

export interface ISelfPacedEnrollment extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId

  amountPaid: number
  paystackReference?: string

  payoutLogged: boolean

  weekProgress: IWeekProgress[]

  locked: boolean
  lockedAtWeek?: number
  unlockedByTutorAt?: Date

  completedAt?: Date
  certificateId?: mongoose.Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

const WeekProgressSchema = new Schema<IWeekProgress>(
  {
    weekNumber: {
      type: Number,
      required: true,
    },

    examScore: {
      type: Number,
      required: true,
    },

    examTotal: {
      type: Number,
      required: true,
    },

    examPercentage: {
      type: Number,
      required: true,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    attemptsUsed: {
      type: Number,
      default: 0,
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
)

const SelfPacedEnrollmentSchema =
  new Schema<ISelfPacedEnrollment>(
    {
      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
        index: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        required: true,
        index: true,
      },

      tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
        index: true,
      },

      amountPaid: {
        type: Number,
        required: true,
        default: 0,
      },

      paystackReference: {
        type: String,
        trim: true,
      },

      payoutLogged: {
        type: Boolean,
        default: false,
        index: true,
      },

      weekProgress: [
        WeekProgressSchema,
      ],

      locked: {
        type: Boolean,
        default: false,
      },

      lockedAtWeek: {
        type: Number,
      },

      unlockedByTutorAt: {
        type: Date,
      },

      completedAt: {
        type: Date,
      },

      certificateId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCertificate',
      },
    },
    {
      timestamps: true,
    }
  )

/**
 * A self-paced student can only own
 * a particular course once.
 */
SelfPacedEnrollmentSchema.index(
  {
    selfPacedStudentId: 1,
    courseId: 1,
  },
  {
    unique: true,
  }
)

/**
 * A Paystack reference must not be reused.
 *
 * Free enrollments don't have a reference,
 * so only string values are indexed.
 */
SelfPacedEnrollmentSchema.index(
  {
    paystackReference: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      paystackReference: {
        $type: 'string',
      },
    },
  }
)

const SelfPacedEnrollment:
  Model<ISelfPacedEnrollment> =
    mongoose.models.SelfPacedEnrollment ||
    mongoose.model<ISelfPacedEnrollment>(
      'SelfPacedEnrollment',
      SelfPacedEnrollmentSchema
    )

export default SelfPacedEnrollment
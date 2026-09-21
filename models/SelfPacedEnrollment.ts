// models/SelfPacedEnrollment.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

// ============================================================
// WEEK PROGRESS
// ============================================================

export interface IWeekProgress {
  weekNumber: number
  examScore: number
  examTotal: number
  examPercentage: number
  passed: boolean
  attemptsUsed: number
  attemptedAt: Date
}

// ============================================================
// PAGE PROGRESS
// ============================================================

export interface IPageProgress {
  weekNumber: number
  pageId: mongoose.Types.ObjectId

  firstViewedAt: Date
  lastViewedAt: Date

  completed: boolean
  completedAt?: Date
}

// ============================================================
// ENROLLMENT
// ============================================================

export interface ISelfPacedEnrollment
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId

  amountPaid: number
  paystackReference?: string

  payoutLogged: boolean

  weekProgress: IWeekProgress[]

  /**
   * Tracks lesson-page activity.
   *
   * This allows the course and WhatsApp mentor systems
   * to understand whether the student is actively
   * studying, rather than relying only on exam attempts.
   */
  pageProgress: IPageProgress[]

  /**
   * Last meaningful course activity.
   *
   * Updated when the student studies course material
   * or performs another meaningful learning action.
   */
  lastActivityAt: Date

  locked: boolean
  lockedAtWeek?: number
  unlockedByTutorAt?: Date

  completedAt?: Date
  certificateId?: mongoose.Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

// ============================================================
// WEEK PROGRESS SCHEMA
// ============================================================

const WeekProgressSchema =
  new Schema<IWeekProgress>(
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

// ============================================================
// PAGE PROGRESS SCHEMA
// ============================================================

const PageProgressSchema =
  new Schema<IPageProgress>(
    {
      weekNumber: {
        type: Number,
        required: true,
      },

      pageId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      firstViewedAt: {
        type: Date,
        default: Date.now,
      },

      lastViewedAt: {
        type: Date,
        default: Date.now,
      },

      completed: {
        type: Boolean,
        default: false,
      },

      completedAt: {
        type: Date,
      },
    },
    {
      _id: false,
    }
  )

// ============================================================
// ENROLLMENT SCHEMA
// ============================================================

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

      // ======================================================
      // ASSESSMENT PROGRESS
      // ======================================================

      weekProgress: [
        WeekProgressSchema,
      ],

      // ======================================================
      // LESSON / PAGE PROGRESS
      // ======================================================

      pageProgress: {
        type: [
          PageProgressSchema,
        ],

        default: [],
      },

      // ======================================================
      // COURSE ACTIVITY
      // ======================================================

      lastActivityAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      // ======================================================
      // COURSE LOCKING
      // ======================================================

      locked: {
        type: Boolean,
        default: false,
        index: true,
      },

      lockedAtWeek: {
        type: Number,
      },

      unlockedByTutorAt: {
        type: Date,
      },

      // ======================================================
      // COMPLETION
      // ======================================================

      completedAt: {
        type: Date,
        index: true,
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

// ============================================================
// INDEXES
// ============================================================

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

/**
 * Useful for mentor/inactivity queries.
 *
 * Allows the mentoring job to efficiently locate
 * active, incomplete enrollments based on their
 * most recent course activity.
 */
SelfPacedEnrollmentSchema.index({
  completedAt: 1,
  locked: 1,
  lastActivityAt: 1,
})

// ============================================================
// MODEL
// ============================================================

const SelfPacedEnrollment:
  Model<ISelfPacedEnrollment> =
    mongoose.models.SelfPacedEnrollment ||
    mongoose.model<ISelfPacedEnrollment>(
      'SelfPacedEnrollment',
      SelfPacedEnrollmentSchema
    )

export default SelfPacedEnrollment
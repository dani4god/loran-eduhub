// models/PayoutLog.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export type PayoutSourceModel =
  | 'Payment'
  | 'SelfPacedEnrollment'
  | 'CoachingBooking'
  | 'LessonNotePurchase'

export interface IPayoutLog extends Document {
  sourceModel: PayoutSourceModel

  /**
   * Regular course payment
   */
  paymentId?: mongoose.Types.ObjectId

  /**
   * Self-paced course purchase
   */
  selfPacedEnrollmentId?: mongoose.Types.ObjectId

  /**
   * Coaching session
   */
  bookingId?: mongoose.Types.ObjectId

  /**
   * Lesson-note purchase
   */
  purchaseId?: mongoose.Types.ObjectId

  /**
   * Optional because lesson-note purchases
   * may be made without a Student record.
   */
  studentId?: mongoose.Types.ObjectId

  tutorId: mongoose.Types.ObjectId

  /**
   * This points to:
   *
   * Payment              -> Course
   * SelfPacedEnrollment  -> SelfPacedCourse
   * CoachingBooking      -> SelfPacedCourse
   * LessonNotePurchase   -> LessonNote
   */
  courseId: mongoose.Types.ObjectId

  grossAmount: number

  commissionRate: number

  commissionAmount: number

  netAmount: number

  status:
    | 'pending'
    | 'processing'
    | 'paid'
    | 'failed'

  paystackTransferCode?: string

  paystackTransferReference?: string

  failureReason?: string

  paidAt?: Date

  createdAt: Date
  updatedAt: Date
}

const PayoutLogSchema =
  new Schema<IPayoutLog>(
    {
      sourceModel: {
        type: String,
        enum: [
          'Payment',
          'SelfPacedEnrollment',
          'CoachingBooking',
          'LessonNotePurchase',
        ],
        required: true,
        index: true,
      },

      paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
      },

      selfPacedEnrollmentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedEnrollment',
      },

      bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'CoachingBooking',
      },

      purchaseId: {
        type: Schema.Types.ObjectId,
        ref: 'LessonNotePurchase',
      },

      studentId: {
        type: Schema.Types.ObjectId,
      },

      tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
        index: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      grossAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      commissionRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },

      commissionAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      netAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          'pending',
          'processing',
          'paid',
          'failed',
        ],
        default: 'pending',
        index: true,
      },

      paystackTransferCode: {
        type: String,
      },

      paystackTransferReference: {
        type: String,
      },

      failureReason: {
        type: String,
      },

      paidAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  )

/**
 * ---------------------------------------------------------
 * REGULAR COURSE PAYMENT
 * ---------------------------------------------------------
 *
 * One payout per:
 *
 * payment + tutor + course
 */
PayoutLogSchema.index(
  {
    paymentId: 1,
    tutorId: 1,
    courseId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      sourceModel:
        'Payment',

      paymentId: {
        $exists: true,
      },
    },
  }
)

/**
 * ---------------------------------------------------------
 * SELF-PACED COURSE PURCHASE
 * ---------------------------------------------------------
 *
 * One payout per SelfPacedEnrollment.
 */
PayoutLogSchema.index(
  {
    selfPacedEnrollmentId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      sourceModel:
        'SelfPacedEnrollment',

      selfPacedEnrollmentId: {
        $exists: true,
      },
    },
  }
)

/**
 * ---------------------------------------------------------
 * COACHING
 * ---------------------------------------------------------
 *
 * One payout per coaching booking.
 */
PayoutLogSchema.index(
  {
    bookingId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      sourceModel:
        'CoachingBooking',

      bookingId: {
        $exists: true,
      },
    },
  }
)

/**
 * ---------------------------------------------------------
 * LESSON NOTE
 * ---------------------------------------------------------
 *
 * One payout per lesson-note purchase.
 */
PayoutLogSchema.index(
  {
    purchaseId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      sourceModel:
        'LessonNotePurchase',

      purchaseId: {
        $exists: true,
      },
    },
  }
)

PayoutLogSchema.index({
  tutorId: 1,
  status: 1,
  createdAt: -1,
})

const PayoutLog:
  Model<IPayoutLog> =
    mongoose.models.PayoutLog ||
    mongoose.model<IPayoutLog>(
      'PayoutLog',
      PayoutLogSchema
    )

export default PayoutLog
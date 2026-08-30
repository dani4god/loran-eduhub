// models/PayoutLog.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export type PayoutSourceModel =
  | 'Payment'
  | 'CoachingBooking'
  | 'LessonNotePurchase'

export interface IPayoutLog extends Document {
  sourceModel: PayoutSourceModel

  paymentId?: mongoose.Types.ObjectId
  bookingId?: mongoose.Types.ObjectId
  purchaseId?: mongoose.Types.ObjectId

  studentId?: mongoose.Types.ObjectId

  tutorId: mongoose.Types.ObjectId

  /**
   * Depending on sourceModel:
   *
   * Payment
   * -> Course
   *
   * CoachingBooking
   * -> SelfPacedCourse
   *
   * LessonNotePurchase
   * -> LessonNote
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

      bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'CoachingBooking',
      },

      purchaseId: {
        type: Schema.Types.ObjectId,
        ref: 'LessonNotePurchase',
      },

      /**
       * Intentionally no ref.
       *
       * Payment:
       * Student
       *
       * CoachingBooking:
       * SelfPacedStudent
       *
       * LessonNotePurchase:
       * may be missing because lesson-note purchases
       * can be anonymous/public purchases.
       */
      studentId: {
        type: Schema.Types.ObjectId,
        required: false,
      },

      tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
        index: true,
      },

      /**
       * Intentionally no ref because this field can point
       * to different collections depending on sourceModel.
       */
      courseId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      grossAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      commissionRate: {
        type: Number,
        required: true,
        default: 0.15,
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

// ============================================================
// UNIQUE PAYOUT IDENTITIES
// ============================================================

/**
 * A Payment can contain several courseDetails.
 *
 * Therefore one Payment can legitimately generate multiple
 * tutor payouts.
 *
 * Identity:
 *
 * Payment + Tutor + Course
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
      sourceModel: 'Payment',
      paymentId: {
        $exists: true,
      },
    },
  }
)

/**
 * A coaching booking represents exactly one coaching payout.
 */
PayoutLogSchema.index(
  {
    bookingId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceModel: 'CoachingBooking',
      bookingId: {
        $exists: true,
      },
    },
  }
)

/**
 * Every LessonNotePurchase is a separate transaction.
 *
 * If the same user buys the same lesson note twice using two
 * different Paystack references, there must be TWO purchases
 * and therefore TWO payout records.
 */
PayoutLogSchema.index(
  {
    purchaseId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceModel: 'LessonNotePurchase',
      purchaseId: {
        $exists: true,
      },
    },
  }
)

// ============================================================
// QUERY INDEXES
// ============================================================

PayoutLogSchema.index({
  tutorId: 1,
  status: 1,
  createdAt: -1,
})

PayoutLogSchema.index({
  status: 1,
  createdAt: -1,
})

PayoutLogSchema.index({
  sourceModel: 1,
  createdAt: -1,
})

const PayoutLog: Model<IPayoutLog> =
  mongoose.models.PayoutLog ||
  mongoose.model<IPayoutLog>(
    'PayoutLog',
    PayoutLogSchema
  )

export default PayoutLog
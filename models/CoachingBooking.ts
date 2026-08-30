import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface ICoachingBooking
  extends Document {
  selfPacedStudentId:
    mongoose.Types.ObjectId

  tutorId:
    mongoose.Types.ObjectId

  courseId:
    mongoose.Types.ObjectId

  slotId:
    mongoose.Types.ObjectId

  amountPaid: number

  netAmount: number

  commissionAmount: number

  payoutLogged: boolean

  paystackReference?: string

  status:
    | 'pending_payment'
    | 'confirmed'

  tutorReplyMessage?: string

  tutorReplyLink?: string

  repliedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const CoachingBookingSchema =
  new Schema<ICoachingBooking>(
    {
      selfPacedStudentId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'SelfPacedStudent',

        required:
          true,

        index:
          true,
      },

      tutorId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Tutor',

        required:
          true,

        index:
          true,
      },

      courseId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'SelfPacedCourse',

        required:
          true,

        index:
          true,
      },

      slotId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'TutorAvailabilitySlot',

        required:
          true,

        index:
          true,
      },

      amountPaid: {
        type:
          Number,

        required:
          true,
      },

      paystackReference: {
        type:
          String,
      },

      netAmount: {
        type:
          Number,

        default:
          0,
      },

      commissionAmount: {
        type:
          Number,

        default:
          0,
      },

      payoutLogged: {
        type:
          Boolean,

        default:
          false,
      },

      status: {
        type:
          String,

        enum: [
          'pending_payment',
          'confirmed',
        ],

        default:
          'pending_payment',

        index:
          true,
      },

      tutorReplyMessage: {
        type:
          String,
      },

      tutorReplyLink: {
        type:
          String,
      },

      repliedAt: {
        type:
          Date,
      },
    },
    {
      timestamps:
        true,
    }
  )

// ----------------------------------------------------------
// PAYMENT REFERENCE
// One Paystack reference must belong to only one booking
// ----------------------------------------------------------

CoachingBookingSchema.index(
  {
    paystackReference:
      1,
  },
  {
    unique:
      true,

    sparse:
      true,
  }
)

// ----------------------------------------------------------
// STUDENT BOOKING HISTORY
// ----------------------------------------------------------

CoachingBookingSchema.index({
  selfPacedStudentId:
    1,

  createdAt:
    -1,
})

// ----------------------------------------------------------
// TUTOR BOOKING HISTORY
// ----------------------------------------------------------

CoachingBookingSchema.index({
  tutorId:
    1,

  status:
    1,

  createdAt:
    -1,
})

// ----------------------------------------------------------
// COURSE BOOKINGS
// ----------------------------------------------------------

CoachingBookingSchema.index({
  courseId:
    1,

  status:
    1,

  createdAt:
    -1,
})

// ----------------------------------------------------------
// SLOT LOOKUP
// Useful when resolving a booking from a slot
// ----------------------------------------------------------

CoachingBookingSchema.index({
  slotId:
    1,

  createdAt:
    -1,
})

const CoachingBooking:
  Model<ICoachingBooking> =
  mongoose.models
    .CoachingBooking ||
  mongoose.model<ICoachingBooking>(
    'CoachingBooking',
    CoachingBookingSchema
  )

export default CoachingBooking
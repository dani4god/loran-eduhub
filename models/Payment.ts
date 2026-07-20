import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICoursePaymentDetail {
  courseId: mongoose.Types.ObjectId
  courseName: string
  tutorId: mongoose.Types.ObjectId
  tutorName: string
  planPrice: number
  planKey: 'monthly' | '3months' | '6months' | '1year'
}

export interface IAmountBreakdown {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId
  enrollmentIds: mongoose.Types.ObjectId[]
  groupId?: mongoose.Types.ObjectId

  courseDetails: ICoursePaymentDetail[]

  amount: number
  currency: string

  plan: 'trial' | 'monthly' | '3months' | '6months' | '1year'
  planDurationDays: number

  tutorCount: number

  basePlanAmount?: number
  discountApplied?: number
  discountType?: 'bulk' | 'promo' | 'early_bird' | 'referral' | 'other'

  paystackReference?: string
  paystackAccessCode?: string
  paymentGateway?: 'paystack' | 'flutterwave' | 'other'

  status: 'pending' | 'success' | 'failed' | 'refunded'

  paidAt?: Date

  amountBreakdown?: IAmountBreakdown

  createdAt: Date
  updatedAt: Date
}

const CoursePaymentDetailSchema = new Schema<ICoursePaymentDetail>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },

    tutorName: {
      type: String,
      required: true,
      trim: true,
    },

    planPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    planKey: {
      type: String,
      enum: ['monthly', '3months', '6months', '1year'],
      required: true,
    },
  },
  { _id: false }
)

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    enrollmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Enrollment',
      },
    ],

    groupId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    courseDetails: {
      type: [CoursePaymentDetailSchema],
      required: true,
      validate: {
        validator(v: ICoursePaymentDetail[]) {
          return Array.isArray(v) && v.length > 0
        },
        message: 'At least one course detail is required',
      },
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
      trim: true,
    },

    plan: {
      type: String,
      enum: ['trial', 'monthly', '3months', '6months', '1year'],
      required: true,
    },

    planDurationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    tutorCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    basePlanAmount: {
      type: Number,
      min: 0,
    },

    discountApplied: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountType: {
      type: String,
      enum: ['bulk', 'promo', 'early_bird', 'referral', 'other'],
    },

    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    paystackAccessCode: String,

    paymentGateway: {
      type: String,
      enum: ['paystack', 'flutterwave', 'other'],
      default: 'paystack',
    },

    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },

    paidAt: Date,

    amountBreakdown: {
      subtotal: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

PaymentSchema.index({ studentId: 1, status: 1 })
PaymentSchema.index({ createdAt: -1 })

PaymentSchema.virtual('courseCount').get(function (this: IPayment) {
  return this.courseDetails?.length || 0
})

PaymentSchema.pre<IPayment>('save', function (next) {
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

  this.planDurationDays = durationMap[this.plan]

  if (this.courseDetails?.length) {
    const subtotal = this.courseDetails.reduce(
      (sum, item) => sum + item.planPrice,
      0
    )

    this.amount = subtotal

    const discount = this.discountApplied || 0

    this.amountBreakdown = {
      subtotal,
      discount,
      tax: 0,
      total: subtotal - discount,
    }

    const uniqueTutors = new Set(
      this.courseDetails.map((c) => c.tutorId.toString())
    )

    this.tutorCount = uniqueTutors.size

    if (!this.basePlanAmount) {
      this.basePlanAmount = subtotal
    }
  }
})

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', PaymentSchema)

export default Payment
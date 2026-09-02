import mongoose, { Schema, Document, Model } from 'mongoose'

export type ExamPrepPlanDuration =
  | '1month'
  | '2months'
  | '3months'
  | 'life'

export interface IExamPrepPlan {
  duration: ExamPrepPlanDuration
  label: string
  price: number
  enabled: boolean
}

export interface IExamPrepSettings extends Document {
  key: 'global'
  isLocked: boolean
  isPaid: boolean
  plans: IExamPrepPlan[]
  createdAt: Date
  updatedAt: Date
}

export const DEFAULT_EXAM_PREP_PLANS: IExamPrepPlan[] = [
  {
    duration: '1month',
    label: '1 Month',
    price: 1000,
    enabled: true,
  },
  {
    duration: '2months',
    label: '2 Months',
    price: 1800,
    enabled: true,
  },
  {
    duration: '3months',
    label: '3 Months',
    price: 2500,
    enabled: true,
  },
  {
    duration: 'life',
    label: 'Lifetime',
    price: 5000,
    enabled: true,
  },
]

const ExamPrepPlanSchema = new Schema<IExamPrepPlan>(
  {
    duration: {
      type: String,
      enum: ['1month', '2months', '3months', 'life'],
      required: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
)

const ExamPrepSettingsSchema = new Schema<IExamPrepSettings>(
  {
    key: {
      type: String,
      enum: ['global'],
      default: 'global',
      unique: true,
      required: true,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    plans: {
      type: [ExamPrepPlanSchema],
      default: () =>
        DEFAULT_EXAM_PREP_PLANS.map((plan) => ({
          ...plan,
        })),
    },
  },
  {
    timestamps: true,
  }
)

const ExamPrepSettings: Model<IExamPrepSettings> =
  mongoose.models.ExamPrepSettings ||
  mongoose.model<IExamPrepSettings>(
    'ExamPrepSettings',
    ExamPrepSettingsSchema
  )

export default ExamPrepSettings
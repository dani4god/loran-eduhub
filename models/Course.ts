import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICourse extends Document {
  name: string
  description: string
  category:
    | 'tech'
    | 'igcse'
    | 'language'
    | 'ielts'
    | 'jamb-waec'
    | 'diploma'
  syllabus: string[]
  isActive: boolean
  discordRoleGroup: string // e.g. "Tech", "Languages", "IELTS", "JAMB", "IGCSE", "Diploma"
  createdAt: Date
  updatedAt: Date
}

const CourseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ['tech', 'igcse', 'language', 'ielts', 'jamb-waec', 'diploma'],
      required: true,
    },

    syllabus: [
      {
        type: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    discordRoleGroup: {
      type: String,
      required: true,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
)

const Course: Model<ICourse> =
  mongoose.models.Course ||
  mongoose.model<ICourse>('Course', CourseSchema)

export default Course
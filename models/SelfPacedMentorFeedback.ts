// models/SelfPacedMentorFeedback.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export type MentorFeedbackType =
  | 'progress'
  | 'difficulty'
  | 'course_rating'
  | 'completion'
  | 'general'

export type MentorFeedbackCategory =
  | 'content'
  | 'assessment'
  | 'time'
  | 'technical'
  | 'tutor'
  | 'other'

export interface ISelfPacedMentorFeedback
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId

  enrollmentId?: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId

  weekNumber?: number

  type: MentorFeedbackType

  category?: MentorFeedbackCategory

  rating?: number

  message?: string

  sourceMessageId?: mongoose.Types.ObjectId

  requiresAttention: boolean

  resolved: boolean
  resolvedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const SelfPacedMentorFeedbackSchema =
  new Schema<ISelfPacedMentorFeedback>(
    {
      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
        index: true,
      },

      enrollmentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedEnrollment',
        index: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        required: true,
        index: true,
      },

      weekNumber: {
        type: Number,
        min: 1,
      },

      type: {
        type: String,
        enum: [
          'progress',
          'difficulty',
          'course_rating',
          'completion',
          'general',
        ],
        required: true,
        index: true,
      },

      category: {
        type: String,
        enum: [
          'content',
          'assessment',
          'time',
          'technical',
          'tutor',
          'other',
        ],
      },

      rating: {
        type: Number,
        min: 1,
        max: 5,
      },

      message: {
        type: String,
        trim: true,
      },

      sourceMessageId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedMentorMessage',
      },

      requiresAttention: {
        type: Boolean,
        default: false,
        index: true,
      },

      resolved: {
        type: Boolean,
        default: false,
        index: true,
      },

      resolvedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  )

SelfPacedMentorFeedbackSchema.index({
  courseId: 1,
  requiresAttention: 1,
  resolved: 1,
  createdAt: -1,
})

SelfPacedMentorFeedbackSchema.index({
  selfPacedStudentId: 1,
  createdAt: -1,
})

const SelfPacedMentorFeedback:
  Model<ISelfPacedMentorFeedback> =
    mongoose.models.SelfPacedMentorFeedback ||
    mongoose.model<ISelfPacedMentorFeedback>(
      'SelfPacedMentorFeedback',
      SelfPacedMentorFeedbackSchema
    )

export default SelfPacedMentorFeedback
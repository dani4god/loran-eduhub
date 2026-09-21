// models/SelfPacedMentorMessage.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export type MentorMessageDirection =
  | 'inbound'
  | 'outbound'

export type MentorMessageType =
  | 'welcome'
  | 'study_reminder'
  | 'inactivity'
  | 'progress_check'
  | 'week_passed'
  | 'assessment_support'
  | 'feedback_request'
  | 'completion'
  | 'student_reply'
  | 'ai_reply'
  | 'manual'

export type MentorMessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'received'

export interface ISelfPacedMentorMessage
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId

  enrollmentId?: mongoose.Types.ObjectId
  courseId?: mongoose.Types.ObjectId

  direction: MentorMessageDirection
  type: MentorMessageType

  phone: string
  message: string

  whatsappMessageId?: string

  templateName?: string

  status: MentorMessageStatus

  errorMessage?: string

  metadata?: Record<string, unknown>

  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  receivedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const SelfPacedMentorMessageSchema =
  new Schema<ISelfPacedMentorMessage>(
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
        index: true,
      },

      direction: {
        type: String,
        enum: [
          'inbound',
          'outbound',
        ],
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          'welcome',
          'study_reminder',
          'inactivity',
          'progress_check',
          'week_passed',
          'assessment_support',
          'feedback_request',
          'completion',
          'student_reply',
          'ai_reply',
          'manual',
        ],
        required: true,
        index: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      message: {
        type: String,
        required: true,
      },

      whatsappMessageId: {
        type: String,
        trim: true,
      },

      templateName: {
        type: String,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          'queued',
          'sent',
          'delivered',
          'read',
          'failed',
          'received',
        ],
        required: true,
        default: 'queued',
        index: true,
      },

      errorMessage: {
        type: String,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      sentAt: {
        type: Date,
      },

      deliveredAt: {
        type: Date,
      },

      readAt: {
        type: Date,
      },

      receivedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  )

SelfPacedMentorMessageSchema.index(
  {
    whatsappMessageId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
)

SelfPacedMentorMessageSchema.index({
  selfPacedStudentId: 1,
  createdAt: -1,
})

SelfPacedMentorMessageSchema.index({
  enrollmentId: 1,
  createdAt: -1,
})

SelfPacedMentorMessageSchema.index({
  courseId: 1,
  createdAt: -1,
})

const SelfPacedMentorMessage:
  Model<ISelfPacedMentorMessage> =
    mongoose.models.SelfPacedMentorMessage ||
    mongoose.model<ISelfPacedMentorMessage>(
      'SelfPacedMentorMessage',
      SelfPacedMentorMessageSchema
    )

export default SelfPacedMentorMessage
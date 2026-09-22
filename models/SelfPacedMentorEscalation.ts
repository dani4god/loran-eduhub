// models/SelfPacedMentorEscalation.ts

import mongoose, {
  Document,
  Model,
  Schema,
} from 'mongoose'

export type MentorEscalationStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export type MentorEscalationReason =
  | 'student_requested_human'
  | 'ai_cannot_answer'
  | 'account_issue'
  | 'payment_issue'
  | 'technical_issue'
  | 'course_access_issue'
  | 'other'

export interface ISelfPacedMentorEscalation
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId

  enrollmentId?: mongoose.Types.ObjectId

  courseId?: mongoose.Types.ObjectId

  sourceMessageId?: mongoose.Types.ObjectId

  phone: string

  studentMessage: string

  reason: MentorEscalationReason

  aiSummary?: string

  status: MentorEscalationStatus

  assignedTo?: mongoose.Types.ObjectId

  humanResponse?: string

  resolvedAt?: Date

  createdAt: Date

  updatedAt: Date
}

const SelfPacedMentorEscalationSchema =
  new Schema<ISelfPacedMentorEscalation>(
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

      sourceMessageId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedMentorMessage',
        index: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      studentMessage: {
        type: String,
        required: true,
        trim: true,
      },

      reason: {
        type: String,
        required: true,

        enum: [
          'student_requested_human',
          'ai_cannot_answer',
          'account_issue',
          'payment_issue',
          'technical_issue',
          'course_access_issue',
          'other',
        ],
      },

      aiSummary: {
        type: String,
        trim: true,
      },

      status: {
        type: String,

        enum: [
          'open',
          'in_progress',
          'resolved',
          'closed',
        ],

        default: 'open',
        index: true,
      },

      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },

      humanResponse: {
        type: String,
        trim: true,
      },

      resolvedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  )

// ============================================================
// INDEXES
// ============================================================

SelfPacedMentorEscalationSchema.index({
  status: 1,
  createdAt: -1,
})

SelfPacedMentorEscalationSchema.index({
  selfPacedStudentId: 1,
  status: 1,
  createdAt: -1,
})

SelfPacedMentorEscalationSchema.index({
  courseId: 1,
  status: 1,
})

// ============================================================
// MODEL
// ============================================================

const SelfPacedMentorEscalation:
  Model<ISelfPacedMentorEscalation> =
    mongoose.models
      .SelfPacedMentorEscalation ||
    mongoose.model<ISelfPacedMentorEscalation>(
      'SelfPacedMentorEscalation',
      SelfPacedMentorEscalationSchema
    )

export default SelfPacedMentorEscalation
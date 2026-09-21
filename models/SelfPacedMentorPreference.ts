// models/SelfPacedMentorPreference.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface ISelfPacedMentorPreference
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId

  enabled: boolean

  whatsappPhone: string

  consentGiven: boolean
  consentGivenAt?: Date
  consentRevokedAt?: Date

  studyReminders: boolean
  progressMessages: boolean
  assessmentSupport: boolean
  feedbackRequests: boolean

  preferredTime: string
  timezone: string

  lastStudentReplyAt?: Date
  lastInboundPhone?: string

  createdAt: Date
  updatedAt: Date
}

const SelfPacedMentorPreferenceSchema =
  new Schema<ISelfPacedMentorPreference>(
    {
      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
        unique: true,
        index: true,
      },

      enabled: {
        type: Boolean,
        default: false,
        index: true,
      },

      whatsappPhone: {
        type: String,
        required: true,
        trim: true,
      },

      consentGiven: {
        type: Boolean,
        default: false,
        index: true,
      },

      consentGivenAt: {
        type: Date,
      },

      consentRevokedAt: {
        type: Date,
      },

      studyReminders: {
        type: Boolean,
        default: true,
      },

      progressMessages: {
        type: Boolean,
        default: true,
      },

      assessmentSupport: {
        type: Boolean,
        default: true,
      },

      feedbackRequests: {
        type: Boolean,
        default: true,
      },

      preferredTime: {
        type: String,
        default: '18:00',
        trim: true,
      },

      timezone: {
        type: String,
        default: 'Africa/Lagos',
        trim: true,
      },

      lastStudentReplyAt: {
        type: Date,
      },

      lastInboundPhone: {
        type: String,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  )

SelfPacedMentorPreferenceSchema.index({
  enabled: 1,
  consentGiven: 1,
})

const SelfPacedMentorPreference:
  Model<ISelfPacedMentorPreference> =
    mongoose.models.SelfPacedMentorPreference ||
    mongoose.model<ISelfPacedMentorPreference>(
      'SelfPacedMentorPreference',
      SelfPacedMentorPreferenceSchema
    )

export default SelfPacedMentorPreference
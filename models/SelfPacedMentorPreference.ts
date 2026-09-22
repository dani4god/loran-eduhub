// models/SelfPacedMentorPreference.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

// ============================================================
// INTERFACE
// ============================================================

export interface ISelfPacedMentorPreference
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId

  enabled: boolean

  whatsappPhone?: string

  consentGiven: boolean
  consentGivenAt?: Date
  consentRevokedAt?: Date

  studyReminders: boolean
  progressMessages: boolean
  assessmentSupport: boolean
  feedbackRequests: boolean

  preferredTime: string
  timezone: string

  // ----------------------------------------------------------
  // WHATSAPP ACTIVITY
  // ----------------------------------------------------------

  lastStudentReplyAt?: Date
  lastInboundPhone?: string

  // ----------------------------------------------------------
  // CURRENT WHATSAPP COURSE CONTEXT
  // ----------------------------------------------------------

  /**
   * The enrollment/course currently being discussed in the
   * student's WhatsApp conversation.
   *
   * This is student-level conversation context.
   *
   * It is deliberately stored here rather than inside
   * SelfPacedMentorState because a student may have several
   * mentor states, one for each course.
   */
  activeEnrollmentId?: mongoose.Types.ObjectId
  activeCourseId?: mongoose.Types.ObjectId
  contextSelectedAt?: Date

  /**
   * True when the student has multiple active enrollments and
   * the mentor has asked them to choose which course they want
   * to discuss.
   */
  awaitingCourseSelection: boolean

  createdAt: Date
  updatedAt: Date
}

// ============================================================
// SCHEMA
// ============================================================

const SelfPacedMentorPreferenceSchema =
  new Schema<ISelfPacedMentorPreference>(
    {
      // ======================================================
      // STUDENT
      // ======================================================

      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
        unique: true,
        index: true,
      },

      // ======================================================
      // MENTORING STATUS
      // ======================================================

      enabled: {
        type: Boolean,
        default: false,
        index: true,
      },

      whatsappPhone: {
        type: String,
        trim: true,
      },

      // ======================================================
      // CONSENT
      // ======================================================

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

      // ======================================================
      // MESSAGE PREFERENCES
      // ======================================================

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

      // ======================================================
      // SCHEDULING
      // ======================================================

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

      // ======================================================
      // WHATSAPP ACTIVITY
      // ======================================================

      lastStudentReplyAt: {
        type: Date,
      },

      lastInboundPhone: {
        type: String,
        trim: true,
      },

      // ======================================================
      // CURRENT WHATSAPP COURSE CONTEXT
      // ======================================================

      activeEnrollmentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedEnrollment',
        index: true,
      },

      activeCourseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        index: true,
      },

      contextSelectedAt: {
        type: Date,
      },

      awaitingCourseSelection: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  )

// ============================================================
// INDEXES
// ============================================================

SelfPacedMentorPreferenceSchema.index({
  enabled: 1,
  consentGiven: 1,
})

// ============================================================
// MODEL
// ============================================================

const SelfPacedMentorPreference:
  Model<ISelfPacedMentorPreference> =
    mongoose.models.SelfPacedMentorPreference ||
    mongoose.model<ISelfPacedMentorPreference>(
      'SelfPacedMentorPreference',
      SelfPacedMentorPreferenceSchema
    )

export default SelfPacedMentorPreference
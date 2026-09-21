// models/SelfPacedMentorState.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

// ============================================================
// TYPES
// ============================================================

export type MentorStateStatus =
  | 'active'
  | 'paused'
  | 'completed'

export type MentorAction =
  | 'welcome'
  | 'study_checkin'
  | 'inactivity'
  | 'week_passed'
  | 'assessment_support'
  | 'feedback_request'
  | 'completion'
  | null

// ============================================================
// INTERFACE
// ============================================================

export interface ISelfPacedMentorState
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId

  status: MentorStateStatus

  // ----------------------------------------------------------
  // CURRENT COURSE CONTEXT
  // ----------------------------------------------------------

  currentWeek: number

  lastKnownPageId?: mongoose.Types.ObjectId
  lastKnownPageTitle?: string

  lastKnownExamPercentage?: number
  lastKnownAttemptsUsed?: number

  // ----------------------------------------------------------
  // EVENT DEDUPLICATION
  // ----------------------------------------------------------

  /**
   * Identifies the latest failed assessment attempt
   * for which the mentor has already sent support.
   *
   * Example:
   * Week 3, attempt 1 failed -> mentor sends support.
   * The scheduler must not send that same intervention again.
   *
   * If attempt 2 later fails, attemptsUsed changes and
   * another support message may become eligible.
   */
  lastHandledAssessmentWeek?: number
  lastHandledAssessmentAttempts?: number

  /**
   * Highest/latest week completion for which the mentor
   * has already sent a congratulatory progress message.
   */
  lastCelebratedWeek?: number

  // ----------------------------------------------------------
  // MESSAGE SCHEDULING
  // ----------------------------------------------------------

  lastMentorMessageAt?: Date
  nextMentorCheckAt?: Date

  lastAction?: MentorAction

  // ----------------------------------------------------------
  // FREQUENCY CONTROL
  // ----------------------------------------------------------

  automatedMessagesLast7Days: number
  messageWindowStartedAt?: Date

  // ----------------------------------------------------------
  // ONE-TIME / MILESTONE FLAGS
  // ----------------------------------------------------------

  welcomeSent: boolean
  completionMessageSent: boolean
  feedbackRequested: boolean

  createdAt: Date
  updatedAt: Date
}

// ============================================================
// SCHEMA
// ============================================================

const SelfPacedMentorStateSchema =
  new Schema<ISelfPacedMentorState>(
    {
      // ======================================================
      // RELATIONSHIPS
      // ======================================================

      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
        index: true,
      },

      enrollmentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedEnrollment',
        required: true,
        unique: true,
        index: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        required: true,
        index: true,
      },

      // ======================================================
      // STATUS
      // ======================================================

      status: {
        type: String,

        enum: [
          'active',
          'paused',
          'completed',
        ],

        default: 'active',
        index: true,
      },

      // ======================================================
      // CURRENT COURSE CONTEXT
      // ======================================================

      currentWeek: {
        type: Number,
        default: 1,
        min: 1,
      },

      lastKnownPageId: {
        type: Schema.Types.ObjectId,
      },

      lastKnownPageTitle: {
        type: String,
        trim: true,
      },

      lastKnownExamPercentage: {
        type: Number,
      },

      lastKnownAttemptsUsed: {
        type: Number,
        min: 0,
      },

      // ======================================================
      // EVENT DEDUPLICATION
      // ======================================================

      lastHandledAssessmentWeek: {
        type: Number,
        min: 1,
      },

      lastHandledAssessmentAttempts: {
        type: Number,
        min: 0,
      },

      lastCelebratedWeek: {
        type: Number,
        min: 1,
      },

      // ======================================================
      // MESSAGE SCHEDULING
      // ======================================================

      lastMentorMessageAt: {
        type: Date,
      },

      nextMentorCheckAt: {
        type: Date,
        index: true,
      },

      lastAction: {
        type: String,

        enum: [
          'welcome',
          'study_checkin',
          'inactivity',
          'week_passed',
          'assessment_support',
          'feedback_request',
          'completion',
          null,
        ],

        default: null,
      },

      // ======================================================
      // FREQUENCY CONTROL
      // ======================================================

      automatedMessagesLast7Days: {
        type: Number,
        default: 0,
        min: 0,
      },

      messageWindowStartedAt: {
        type: Date,
      },

      // ======================================================
      // MILESTONE FLAGS
      // ======================================================

      welcomeSent: {
        type: Boolean,
        default: false,
      },

      completionMessageSent: {
        type: Boolean,
        default: false,
      },

      feedbackRequested: {
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

/**
 * There should only be one mentor state for a student's
 * enrollment in a particular course.
 */
SelfPacedMentorStateSchema.index(
  {
    selfPacedStudentId: 1,
    courseId: 1,
  },
  {
    unique: true,
  }
)

/**
 * Used by the scheduled mentor job to find states that
 * are due to be evaluated.
 */
SelfPacedMentorStateSchema.index({
  status: 1,
  nextMentorCheckAt: 1,
})

/**
 * Useful when loading all mentor states belonging to
 * a particular student.
 */
SelfPacedMentorStateSchema.index({
  selfPacedStudentId: 1,
  status: 1,
})

// ============================================================
// MODEL
// ============================================================

const SelfPacedMentorState:
  Model<ISelfPacedMentorState> =
    mongoose.models.SelfPacedMentorState ||
    mongoose.model<ISelfPacedMentorState>(
      'SelfPacedMentorState',
      SelfPacedMentorStateSchema
    )

export default SelfPacedMentorState
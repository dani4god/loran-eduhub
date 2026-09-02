// app/models/AIQuestionBank.ts

import mongoose, {
  Schema,
  Model,
} from 'mongoose'

// =============================================================
// SCHEMA
// =============================================================

const AIQuestionBankSchema = new Schema(
  {
    // =========================================================
    // IDENTITY
    // =========================================================

    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // QUESTION CLASSIFICATION
    // =========================================================

    subject: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    standard: {
      type: String,

      enum: [
        'jamb',
        'waec',
        'neco',
        'igcse',
        'mixed',
      ],

      required: true,
      index: true,
    },

    topic: {
      type: String,
      required: true,
      default: 'General',
      index: true,
      trim: true,
    },

    subtopic: {
      type: String,
      default: '',
      trim: true,
    },

    difficulty: {
      type: String,

      enum: [
        'easy',
        'medium',
        'hard',
      ],

      default: 'medium',
      index: true,
    },

    // =========================================================
    // QUESTION CONTENT
    // =========================================================

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      a: {
        type: String,
        required: true,
        trim: true,
      },

      b: {
        type: String,
        required: true,
        trim: true,
      },

      c: {
        type: String,
        required: true,
        trim: true,
      },

      d: {
        type: String,
        required: true,
        trim: true,
      },
    },

    correctAnswer: {
      type: String,

      enum: [
        'a',
        'b',
        'c',
        'd',
      ],

      required: true,
    },

    explanation: {
      type: String,
      default: '',
      trim: true,
    },

    // =========================================================
    // SOURCE
    // =========================================================

    source: {
      type: String,

      enum: [
        'ai',
        'aloc',
      ],

      required: true,
      default: 'ai',
      index: true,
    },

    /**
     * Original provider question ID.
     *
     * For ALOC this stores q.id.
     *
     * AI-generated questions normally leave this empty.
     */
    providerQuestionId: {
      type: String,
      default: '',
      index: true,
      trim: true,
    },

    // =========================================================
    // EXAM / PROVIDER METADATA
    // =========================================================

    year: {
      type: Number,
      default: null,
      index: true,
    },

    section: {
      type: String,
      default: '',
      trim: true,
    },

    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },

    /**
     * Keep ALOC category separate from academic topic.
     *
     * Values such as "passage-a" should NOT become analytics
     * topics.
     */
    category: {
      type: String,
      default: '',
      trim: true,
    },

    educationLevel: {
      type: String,
      default: '',
      trim: true,
    },

    classLevel: {
      type: String,
      default: '',
      index: true,
      trim: true,
    },

    country: {
      type: String,
      default: '',
      trim: true,
    },

    publisher: {
      type: String,
      default: '',
      trim: true,
    },

    authorised: {
      type: String,
      default: '',
      trim: true,
    },

    /**
     * Curriculum information returned by ALOC when available.
     *
     * This is useful for later classification, analytics,
     * curriculum filtering, and admin inspection.
     */
    curriculumMapping: {
      type: String,
      default: '',
      trim: true,
    },

    // =========================================================
    // ANALYTICS / REUSE
    // =========================================================

    /**
     * Number of times this bank question has been selected for
     * an exam.
     */
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /**
     * Used together with usageCount so the bank can favour
     * questions that have not been served recently.
     */
    lastUsedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// =============================================================
// COMPOUND INDEXES
// =============================================================

/**
 * Main lookup for practice exams.
 *
 * Example:
 *
 * Physics + JAMB + least-used questions.
 */
AIQuestionBankSchema.index({
  subject: 1,
  standard: 1,
  usageCount: 1,
  lastUsedAt: 1,
})

/**
 * Useful for weakness drills and topic-specific practice.
 */
AIQuestionBankSchema.index({
  subject: 1,
  standard: 1,
  topic: 1,
  usageCount: 1,
})

/**
 * Useful when an exam year is specifically selected.
 */
AIQuestionBankSchema.index({
  subject: 1,
  standard: 1,
  year: 1,
  usageCount: 1,
})

/**
 * Allows source-specific bank queries.
 *
 * Example:
 *
 * source = aloc
 * subject = Physics
 * standard = jamb
 */
AIQuestionBankSchema.index({
  subject: 1,
  standard: 1,
  source: 1,
  usageCount: 1,
})

/**
 * Helps locate an original provider question.
 *
 * sparse prevents empty provider IDs from causing unnecessary
 * index entries.
 */
AIQuestionBankSchema.index(
  {
    source: 1,
    providerQuestionId: 1,
  },
  {
    sparse: true,
  }
)

/**
 * Useful if we later want class-aware AI question-bank filtering.
 */
AIQuestionBankSchema.index({
  subject: 1,
  standard: 1,
  classLevel: 1,
  usageCount: 1,
})

// =============================================================
// MODEL
// =============================================================

const AIQuestionBank: Model<any> =
  mongoose.models.AIQuestionBank ||
  mongoose.model(
    'AIQuestionBank',
    AIQuestionBankSchema
  )

export default AIQuestionBank
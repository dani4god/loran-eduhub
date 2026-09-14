// app/models/ExamPrepAttempt.ts

import mongoose, {
  Schema,
  Model,
} from 'mongoose'

// ============================================================
// QUESTION OPTIONS
// ============================================================

const QuestionOptionsSchema =
  new Schema(
    {
      a: {
        type:
          String,
        default:
          '',
      },

      b: {
        type:
          String,
        default:
          '',
      },

      c: {
        type:
          String,
        default:
          '',
      },

      d: {
        type:
          String,
        default:
          '',
      },
    },
    {
      _id:
        false,
    }
  )

// ============================================================
// BREAKDOWN ITEM
// ============================================================

const BreakdownSchema =
  new Schema(
    {
      questionId: {
        type:
          String,
        default:
          '',
      },

      fingerprint: {
        type:
          String,
        default:
          '',
      },

      question: {
        type:
          String,
        required:
          true,
      },

      // ======================================================
      // OPTIONS
      // ======================================================

      options: {
        type:
          QuestionOptionsSchema,

        default:
          () => ({
            a:
              '',
            b:
              '',
            c:
              '',
            d:
              '',
          }),
      },

      // ======================================================
      // ANSWERS
      // ======================================================

      selected: {
        type:
          String,
        default:
          '',
      },

      correct: {
        type:
          String,
        required:
          true,
      },

      /*
       * Actual text of the option selected by the student.
       *
       * Example:
       *
       * selected = "b"
       * selectedText = "Mortise chisel"
       */
      selectedText: {
        type:
          String,
        default:
          '',
      },

      /*
       * Actual text of the correct option.
       *
       * Example:
       *
       * correct = "a"
       * correctText = "Dovetail joint"
       */
      correctText: {
        type:
          String,
        default:
          '',
      },

      isCorrect: {
        type:
          Boolean,
        default:
          false,
      },

      // ======================================================
      // QUESTION METADATA
      // ======================================================

      subject: {
        type:
          String,
        required:
          true,
      },

      topic: {
        type:
          String,
        default:
          'General',
      },

      subtopic: {
        type:
          String,
        default:
          '',
      },

      difficulty: {
        type:
          String,

        enum: [
          'easy',
          'medium',
          'hard',
        ],

        default:
          'medium',
      },

      standard: {
        type:
          String,
        default:
          '',
      },

      source: {
        type:
          String,
        default:
          '',
      },

      explanation: {
        type:
          String,
        default:
          '',
      },
    },
    {
      _id:
        false,
    }
  )

// ============================================================
// EXAM PREP ATTEMPT
// ============================================================

const ExamPrepAttemptSchema =
  new Schema(
    {
      examPrepStudentId: {
        type:
          Schema.Types
            .ObjectId,

        ref:
          'ExamPrepStudent',

        required:
          true,

        index:
          true,
      },

      attemptType: {
        type:
          String,

        enum: [
          'practice',
          'competition',
        ],

        default:
          'practice',

        index:
          true,
      },

      competitionRoomId: {
        type:
          Schema.Types
            .ObjectId,

        ref:
          'ExamCompetitionRoom',
      },

      examType: {
        type:
          String,

        enum: [
          'jamb',
          'waec',
          'neco',
          'igcse',
          'mixed',
        ],

        required:
          true,
      },

      subject: {
        type:
          String,

        required:
          true,

        index:
          true,
      },

      studentClass: {
        type:
          String,

        enum: [
          'ss1',
          'ss2',
          'ss3',
        ],
      },

      score: {
        type:
          Number,

        required:
          true,

        min:
          0,
      },

      total: {
        type:
          Number,

        required:
          true,

        min:
          1,
      },

      percentage: {
        type:
          Number,

        required:
          true,

        min:
          0,

        max:
          100,
      },

      durationSeconds: {
        type:
          Number,

        required:
          true,

        min:
          0,
      },

      breakdown: {
        type: [
          BreakdownSchema,
        ],

        default:
          [],
      },
    },
    {
      timestamps:
        true,
    }
  )

// ============================================================
// INDEXES
// ============================================================

ExamPrepAttemptSchema.index(
  {
    examPrepStudentId:
      1,

    createdAt:
      -1,
  }
)

ExamPrepAttemptSchema.index(
  {
    examPrepStudentId:
      1,

    subject:
      1,
  }
)

// ============================================================
// MODEL
// ============================================================

const ExamPrepAttempt:
  Model<any> =
  mongoose.models
    .ExamPrepAttempt ||
  mongoose.model(
    'ExamPrepAttempt',
    ExamPrepAttemptSchema
  )

export default ExamPrepAttempt
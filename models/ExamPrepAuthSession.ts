// models/ExamPrepAuthSession.ts

import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from 'mongoose'

export interface IExamPrepAuthSession
  extends Document {
  examPrepStudentId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  lastUsedAt: Date
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const ExamPrepAuthSessionSchema =
  new Schema<IExamPrepAuthSession>(
    {
      examPrepStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'ExamPrepStudent',
        required: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,

        // DO NOT put index: true here.
        // The TTL index is defined below.
      },

      lastUsedAt: {
        type: Date,
        default: Date.now,
      },

      userAgent: {
        type: String,
        default: '',
        maxlength: 500,
      },
    },
    {
      timestamps: true,
    }
  )

// Automatically remove expired login sessions.
ExamPrepAuthSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
)

ExamPrepAuthSessionSchema.index({
  examPrepStudentId: 1,
  createdAt: -1,
})

const ExamPrepAuthSession: Model<IExamPrepAuthSession> =
  mongoose.models.ExamPrepAuthSession ||
  mongoose.model<IExamPrepAuthSession>(
    'ExamPrepAuthSession',
    ExamPrepAuthSessionSchema
  )

export default ExamPrepAuthSession
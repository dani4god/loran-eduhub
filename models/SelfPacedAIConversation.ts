// models/SelfPacedAIConversation.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export type SelfPacedAIRole =
  | 'user'
  | 'assistant'

export interface ISelfPacedAIMessage {
  role: SelfPacedAIRole
  content: string
  createdAt: Date
}

export interface ISelfPacedAIConversation
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId

  weekNumber: number
  pageId: mongoose.Types.ObjectId

  messages: ISelfPacedAIMessage[]

  createdAt: Date
  updatedAt: Date
}

const SelfPacedAIMessageSchema =
  new Schema<ISelfPacedAIMessage>(
    {
      role: {
        type: String,
        enum: [
          'user',
          'assistant',
        ],
        required: true,
      },

      content: {
        type: String,
        required: true,
        trim: true,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  )

const SelfPacedAIConversationSchema =
  new Schema<ISelfPacedAIConversation>(
    {
      selfPacedStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        required: true,
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
        required: true,
      },

      pageId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      messages: {
        type: [
          SelfPacedAIMessageSchema,
        ],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  )

/**
 * One conversation per:
 *
 * student + course + week + page
 *
 * This means every lesson page keeps its own
 * study conversation.
 */
SelfPacedAIConversationSchema.index(
  {
    selfPacedStudentId: 1,
    courseId: 1,
    weekNumber: 1,
    pageId: 1,
  },
  {
    unique: true,
  }
)

SelfPacedAIConversationSchema.index({
  selfPacedStudentId: 1,
  updatedAt: -1,
})

const SelfPacedAIConversation:
  Model<ISelfPacedAIConversation> =
    mongoose.models
      .SelfPacedAIConversation ||
    mongoose.model<ISelfPacedAIConversation>(
      'SelfPacedAIConversation',
      SelfPacedAIConversationSchema
    )

export default SelfPacedAIConversation
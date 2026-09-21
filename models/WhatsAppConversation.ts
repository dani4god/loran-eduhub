import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface IWhatsAppMessage {
  role: 'assistant' | 'student'
  text: string
  messageId?: string
  sentAt: Date
}

export interface IWhatsAppConversation
  extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId

  phone: string

  status:
    | 'active'
    | 'completed'
    | 'paused'

  currentWeek: number

  lastMentorMessageAt?: Date
  lastStudentReplyAt?: Date

  feedbackScore?: number
  feedbackText?: string

  messages: IWhatsAppMessage[]

  createdAt: Date
  updatedAt: Date
}

const MessageSchema =
  new Schema<IWhatsAppMessage>(
    {
      role: {
        type: String,
        enum: ['assistant', 'student'],
        required: true,
      },

      text: {
        type: String,
        required: true,
      },

      messageId: String,

      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  )

const WhatsAppConversationSchema =
  new Schema<IWhatsAppConversation>(
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
        required: true,
        unique: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        required: true,
        index: true,
      },

      phone: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          'active',
          'completed',
          'paused',
        ],
        default: 'active',
      },

      currentWeek: {
        type: Number,
        default: 1,
      },

      lastMentorMessageAt: Date,

      lastStudentReplyAt: Date,

      feedbackScore: Number,

      feedbackText: String,

      messages: {
        type: [MessageSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  )

WhatsAppConversationSchema.index({
  selfPacedStudentId: 1,
  status: 1,
})

const WhatsAppConversation:
  Model<IWhatsAppConversation> =
    mongoose.models
      .WhatsAppConversation ||
    mongoose.model<IWhatsAppConversation>(
      'WhatsAppConversation',
      WhatsAppConversationSchema
    )

export default WhatsAppConversation
import mongoose, { Schema, Model } from 'mongoose'

const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    fingerprint: { type: String, required: true },
    text: { type: String, required: true },
    options: { type: Schema.Types.Mixed, required: true },
    correctAnswer: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, default: 'General' },
    subtopic: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    standard: { type: String, enum: ['jamb', 'waec', 'neco', 'igcse', 'mixed'], required: true },
    source: { type: String, enum: ['aloc', 'ai', 'competition'], required: true },
    explanation: { type: String, default: '' },
    section: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
)

const ExamPrepSessionSchema = new Schema(
  {
    sessionToken: { type: String, required: true, unique: true },
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, index: true },
    examType: { type: String, enum: ['jamb', 'waec', 'neco', 'igcse', 'mixed'], required: true },
    subject: { type: String, required: true },
    studentClass: { type: String, enum: ['ss1', 'ss2', 'ss3'], required: true },
    questions: { type: [QuestionSchema], default: [] },
    durationMinutes: { type: Number, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

ExamPrepSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const ExamPrepSession: Model<any> =
  mongoose.models.ExamPrepSession ||
  mongoose.model('ExamPrepSession', ExamPrepSessionSchema)

export default ExamPrepSession

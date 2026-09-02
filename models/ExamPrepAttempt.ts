//app/models/ExamPrepAttempt.ts
import mongoose, { Schema, Model } from 'mongoose'

const BreakdownSchema = new Schema(
  {
    questionId: String,
    fingerprint: String,
    question: { type: String, required: true },
    selected: { type: String, default: '' },
    correct: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    subject: { type: String, required: true },
    topic: { type: String, default: 'General' },
    subtopic: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    standard: String,
    source: String,
    explanation: { type: String, default: '' },
  },
  { _id: false }
)

const ExamPrepAttemptSchema = new Schema(
  {
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, index: true },
    attemptType: { type: String, enum: ['practice', 'competition'], default: 'practice', index: true },
    competitionRoomId: { type: Schema.Types.ObjectId, ref: 'ExamCompetitionRoom' },
    examType: { type: String, enum: ['jamb', 'waec', 'neco', 'igcse', 'mixed'], required: true },
    subject: { type: String, required: true, index: true },
    studentClass: { type: String, enum: ['ss1', 'ss2', 'ss3'] },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    durationSeconds: { type: Number, required: true, min: 0 },
    breakdown: { type: [BreakdownSchema], default: [] },
  },
  { timestamps: true }
)

ExamPrepAttemptSchema.index({ examPrepStudentId: 1, createdAt: -1 })
ExamPrepAttemptSchema.index({ examPrepStudentId: 1, subject: 1 })

const ExamPrepAttempt: Model<any> =
  mongoose.models.ExamPrepAttempt ||
  mongoose.model('ExamPrepAttempt', ExamPrepAttemptSchema)

export default ExamPrepAttempt

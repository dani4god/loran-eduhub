//app/models/ExamPrepAIAnalysis.ts
import mongoose, { Schema, Model } from 'mongoose'

const ExamPrepAIAnalysisSchema = new Schema(
  {
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, unique: true, index: true },
    basedOnAttemptCount: { type: Number, required: true },
    deterministicSnapshot: { type: Schema.Types.Mixed, required: true },
    aiCoach: { type: Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const ExamPrepAIAnalysis: Model<any> =
  mongoose.models.ExamPrepAIAnalysis ||
  mongoose.model('ExamPrepAIAnalysis', ExamPrepAIAnalysisSchema)

export default ExamPrepAIAnalysis

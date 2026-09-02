//app/models/ExamCompetitionParticipant.ts
import mongoose, { Schema, Model } from 'mongoose'

const SubjectResultSchema = new Schema(
  {
    subject: String,
    score: Number,
    total: Number,
    percentage: Number,
    durationSeconds: Number,
    submittedAt: Date,
    breakdown: [Schema.Types.Mixed],
  },
  { _id: false }
)

const ExamCompetitionParticipantSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'ExamCompetitionRoom', required: true, index: true },
    examPrepStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent', required: true, index: true },
    joinedAt: { type: Date, default: Date.now },
    screenShareActive: { type: Boolean, default: false },
    lastScreenShareHeartbeat: Date,
    subjectResults: { type: [SubjectResultSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    totalPossible: { type: Number, default: 0 },
    overallPercentage: { type: Number, default: 0 },
    totalDurationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ExamCompetitionParticipantSchema.index(
  { roomId: 1, examPrepStudentId: 1 },
  { unique: true }
)

const ExamCompetitionParticipant: Model<any> =
  mongoose.models.ExamCompetitionParticipant ||
  mongoose.model('ExamCompetitionParticipant', ExamCompetitionParticipantSchema)

export default ExamCompetitionParticipant

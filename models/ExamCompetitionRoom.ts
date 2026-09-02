//app/models/ExamCompetitionRoom.ts
import mongoose, { Schema, Model } from 'mongoose'

const ArenaQuestionSchema = new Schema(
  {
    id: String,
    fingerprint: String,
    text: String,
    options: Schema.Types.Mixed,
    correctAnswer: String,
    topic: String,
    subtopic: String,
    difficulty: String,
    standard: String,
    source: { type: String, enum: ['ai', 'aloc', 'competition'], default: 'competition' },
    explanation: String,
  },
  { _id: false }
)

const ArenaSubjectSchema = new Schema(
  {
    subject: { type: String, required: true },
    durationMinutes: { type: Number, min: 5, max: 120, required: true },
    questionCount: { type: Number, min: 5, max: 50, default: 50 },
    generationStatus: { type: String, enum: ['pending', 'generating', 'ready', 'failed'], default: 'pending' },
    questions: { type: [ArenaQuestionSchema], default: [] },
  },
  { _id: false }
)

const ExamCompetitionRoomSchema = new Schema(
  {
    roomCode: { type: String, unique: true, required: true, index: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    instructions: { type: String, default: '' },
    creatorType: { type: String, enum: ['student', 'admin'], required: true },
    creatorStudentId: { type: Schema.Types.ObjectId, ref: 'ExamPrepStudent' },
    creatorAdminUserId: String,
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: { type: String, enum: ['preparing', 'lobby', 'completed', 'cancelled'], default: 'preparing', index: true },
    screenShareMode: { type: String, enum: ['off', 'optional', 'required'], default: 'off' },
    subjects: { type: [ArenaSubjectSchema], default: [] },
    maxParticipants: { type: Number, min: 1, max: 500, default: 50 },
    startedAt: Date,
    intermissionSeconds: { type: Number, default: 15 },
  },
  { timestamps: true }
)

ExamCompetitionRoomSchema.index({ visibility: 1, status: 1, createdAt: -1 })

const ExamCompetitionRoom: Model<any> =
  mongoose.models.ExamCompetitionRoom ||
  mongoose.model('ExamCompetitionRoom', ExamCompetitionRoomSchema)

export default ExamCompetitionRoom

// models/TutorContractAck.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITutorContractAck extends Document {
  tutorId: mongoose.Types.ObjectId
  acknowledgedAt: Date
}

const TutorContractAckSchema = new Schema<ITutorContractAck>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, unique: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const TutorContractAck: Model<ITutorContractAck> =
  mongoose.models.TutorContractAck || mongoose.model<ITutorContractAck>('TutorContractAck', TutorContractAckSchema)

export default TutorContractAck
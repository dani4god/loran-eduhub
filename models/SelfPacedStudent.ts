// models/SelfPacedStudent.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISelfPacedStudent extends Document {
  userId: mongoose.Types.ObjectId
  firstName: string
  lastName: string
  phone: string
  profileImage?: string
  createdAt: Date
  updatedAt: Date
  discordId?: string
  discordUsername?: string
  discordRoles?: string[]
}

const SelfPacedStudentSchema = new Schema<ISelfPacedStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    profileImage: { type: String },
    discordId: { type: String, default: null, sparse: true },
    discordUsername: { type: String, default: null },
    discordRoles: { type: [String], default: [] },
  },
  { timestamps: true }
)

const SelfPacedStudent: Model<ISelfPacedStudent> =
  mongoose.models.SelfPacedStudent || mongoose.model<ISelfPacedStudent>('SelfPacedStudent', SelfPacedStudentSchema)

export default SelfPacedStudent
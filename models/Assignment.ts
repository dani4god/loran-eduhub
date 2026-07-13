import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAssignment extends Document {
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  title: string
  description: string
  instructions: string
  totalScore: number
  dueDate?: Date
  isPublished: boolean
  attachmentUrl?: string
  createdAt: Date
  updatedAt: Date
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructions: { type: String, default: '' },
    totalScore: { type: Number, required: true, min: 1 },
    dueDate: { type: Date },
    isPublished: { type: Boolean, default: false },
    attachmentUrl: { type: String },
  },
  { timestamps: true }
)

const Assignment: Model<IAssignment> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignment>('Assignment', AssignmentSchema)

export default Assignment
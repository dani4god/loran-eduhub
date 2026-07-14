import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId
  firstName: string
  lastName: string
  phone: string
  state: string
  dateOfBirth?: Date
  profileImage?: string
  hasUsedFreeTrial: boolean
  enrollments: mongoose.Types.ObjectId[]
  discordId?: string
  discordUsername?: string
  discordRoles?: string[]
  createdAt: Date
  updatedAt: Date
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    state: { type: String, required: true },
    dateOfBirth: { type: Date },
    profileImage: { type: String },
    hasUsedFreeTrial: { type: Boolean, default: false },
    enrollments: [{ type: Schema.Types.ObjectId, ref: 'Enrollment' }],
    discordId: { type: String, default: null },
    discordUsername: { type: String, default: null },
    discordRoles: [{ type: String }],
  },
  { timestamps: true }
)

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model('Student', StudentSchema)
export default Student
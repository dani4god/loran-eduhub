import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password: string
  role: 'student' | 'tutor' | 'admin'
  isActive: boolean
  discordId?: string
  discordUsername?: string
  discordAccessToken?: string
  discordRefreshToken?: string
  discordTokenExpiresAt?: Date
  emailVerified: boolean
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date

  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['student', 'tutor', 'admin'],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    discordId: {
      type: String,
      default: null,
    },

    discordUsername: {
      type: String,
      default: null,
    },

    discordAccessToken: {
      type: String,
      default: null,
    },

    discordRefreshToken: {
      type: String,
      default: null,
    },

    discordTokenExpiresAt: {
      type: Date,
      default: null,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,

    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
)

// HASH PASSWORD BEFORE SAVE
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 12)
})

// COMPARE PASSWORD
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password)
}

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema)

export default User
import mongoose, { Schema, Document, Model } from 'mongoose'
import './Course'

export interface IQualification {
  degree: string
  institution: string
  year: string
}

export interface IPricing {
  monthly: number
  threeMonths: number
  sixMonths: number
  oneYear: number
}

export interface ITutor extends Document {
  userId: mongoose.Types.ObjectId
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  qualifications: IQualification[]
  profileImage?: string
  videoLink?: string
  resume?: string
  pricing: IPricing 
  courses: mongoose.Types.ObjectId[]
  status: 'pending' | 'approved' | 'disapproved' | 'suspended'
  slug: string
  discordId?: string
  discordUsername?: string
  discordServerId?: string
  discordInviteLink?: string
  discordRoles?: string[]  // ← ADDED: Track assigned Discord roles
  createdAt: Date
  updatedAt: Date
  certificateSignatureUrl?: string
  certificateLogoUrl?: string
}

const TutorSchema = new Schema<ITutor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: true,
    },

    qualifications: [
      {
        degree: {
          type: String,
          required: true,
        },

        institution: {
          type: String,
          required: true,
        },

        year: {
          type: String,
          required: true,
        },
      },
    ],

    profileImage: {
      type: String,
    },

    videoLink: {
      type: String,
    },

    resume: {
      type: String,
    },

    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],

    status: {
      type: String,
      enum: ['pending', 'approved', 'disapproved', 'suspended'],
      default: 'pending',
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    discordId: {
      type: String,
      default: null,
      sparse: true,
    },

    discordUsername: {
      type: String,
      default: null,
    },

    discordServerId: {
      type: String,
      default: null,
      sparse: true,
    },

    discordInviteLink: {
      type: String,
      default: null,
    },
    certificateSignatureUrl: { type: String, default: null },
    certificateLogoUrl: { type: String, default: null },
    // in TutorSchema, add alongside the other fields:
    pricing: {
      monthly: { type: Number, required: true, min: 1 },
      threeMonths: { type: Number, required: true, min: 1 },
      sixMonths: { type: Number, required: true, min: 1 },
      oneYear: { type: Number, required: true, min: 1 },
    },

    // ← ADDED: Store assigned Discord roles
    discordRoles: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const Tutor: Model<ITutor> =
  mongoose.models.Tutor ||
  mongoose.model<ITutor>('Tutor', TutorSchema)

export default Tutor
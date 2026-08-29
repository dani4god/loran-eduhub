// models/WorkshopCertificateBatch.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface IWorkshopCertificateBatch
  extends Document {
  title: string
  code: string

  logoUrl: string
  signatureUrl: string

  convenerName: string

  certificateOutcomes: string[]

  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

const WorkshopCertificateBatchSchema =
  new Schema<IWorkshopCertificateBatch>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      logoUrl: {
        type: String,
        required: true,
      },

      signatureUrl: {
        type: String,
        required: true,
      },

      convenerName: {
        type: String,
        required: true,
        trim: true,
        default: 'Okeke Daniel',
      },

      certificateOutcomes: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: [],
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  )

const WorkshopCertificateBatch: Model<IWorkshopCertificateBatch> =
  mongoose.models.WorkshopCertificateBatch ||
  mongoose.model<IWorkshopCertificateBatch>(
    'WorkshopCertificateBatch',
    WorkshopCertificateBatchSchema
  )

export default WorkshopCertificateBatch
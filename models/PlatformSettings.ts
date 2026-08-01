// models/PlatformSettings.ts — full file

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPlatformSettings extends Document {
  key: string
  commissionRate: number
  logoUrl?: string
  maintenanceMode: boolean
  updatedAt: Date
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    commissionRate: { type: Number, required: true, default: 0.15, min: 0, max: 1 },
    logoUrl: { type: String, default: null },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema)

export default PlatformSettings
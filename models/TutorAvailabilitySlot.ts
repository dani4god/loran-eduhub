import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface ITutorAvailabilitySlot
  extends Document {
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId

  date: Date
  startTime: string
  endTime: string

  isBooked: boolean

  // Temporary payment hold
  holdReference?: string
  holdStudentId?: mongoose.Types.ObjectId
  holdExpiresAt?: Date

  createdAt: Date
  updatedAt: Date
}

const TutorAvailabilitySlotSchema =
  new Schema<ITutorAvailabilitySlot>(
    {
      tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
        index: true,
      },

      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedCourse',
        required: true,
        index: true,
      },

      date: {
        type: Date,
        required: true,
      },

      startTime: {
        type: String,
        required: true,
      },

      endTime: {
        type: String,
        required: true,
      },

      isBooked: {
        type: Boolean,
        default: false,
        index: true,
      },

      holdReference: {
        type: String,
        default: undefined,
      },

      holdStudentId: {
        type: Schema.Types.ObjectId,
        ref: 'SelfPacedStudent',
        default: undefined,
      },

      holdExpiresAt: {
        type: Date,
        default: undefined,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  )

TutorAvailabilitySlotSchema.index({
  courseId: 1,
  isBooked: 1,
  date: 1,
})

const TutorAvailabilitySlot: Model<ITutorAvailabilitySlot> =
  mongoose.models.TutorAvailabilitySlot ||
  mongoose.model<ITutorAvailabilitySlot>(
    'TutorAvailabilitySlot',
    TutorAvailabilitySlotSchema
  )

export default TutorAvailabilitySlot
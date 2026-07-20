// models/AssignmentSubmission.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  enrollmentId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  submittedAt: Date
  score?: number
  feedback?: string
  gradedAt?: Date
  status: 'submitted' | 'graded'
  createdAt: Date
  updatedAt: Date
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    submittedAt: { type: Date, default: Date.now },
    score: { type: Number, default: null },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },
  },
  { timestamps: true }
)

// Changed from {assignmentId, studentId} — that blocked a re-enrolled
// student from submitting again, since their OLD submission (tied to a
// withdrawn enrollment) still matched. Now scoped per enrollment, so a
// fresh enrollment always gets a fresh chance to submit.
AssignmentSubmissionSchema.index(
  { assignmentId: 1, enrollmentId: 1 },
  { unique: true }
)

const AssignmentSubmission: Model<IAssignmentSubmission> =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema)

export default AssignmentSubmission
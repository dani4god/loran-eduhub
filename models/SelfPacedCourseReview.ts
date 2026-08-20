// models/SelfPacedCourseReview.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type SurveyChoice = string

export interface ISelfPacedCourseReview extends Document {
  selfPacedStudentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  tutorId: mongoose.Types.ObjectId
  rating: number
  studentDisplayName: string
  courseExperience: SurveyChoice
  wouldRecommend: SurveyChoice
  difficultyLevel: SurveyChoice
  mostDifficultConcept: string
  weeklyStructureHelpful: SurveyChoice
  tutorRating: SurveyChoice
  hadOneOnOneSession: SurveyChoice
  workshopRating: SurveyChoice
  careerImpact: SurveyChoice
  platformMessage: string
  createdAt: Date
}

const SelfPacedCourseReviewSchema = new Schema<ISelfPacedCourseReview>(
  {
    selfPacedStudentId: { type: Schema.Types.ObjectId, ref: 'SelfPacedStudent', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'SelfPacedCourse', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    studentDisplayName: { type: String, required: true },
    courseExperience: { type: String, required: true },
    wouldRecommend: { type: String, required: true },
    difficultyLevel: { type: String, required: true },
    mostDifficultConcept: { type: String, required: true },
    weeklyStructureHelpful: { type: String, required: true },
    tutorRating: { type: String, required: true },
    hadOneOnOneSession: { type: String, required: true },
    workshopRating: { type: String, required: true },
    careerImpact: { type: String, required: true },
    platformMessage: { type: String, default: '' },
  },
  { timestamps: true }
)

SelfPacedCourseReviewSchema.index({ selfPacedStudentId: 1, courseId: 1 }, { unique: true })

const SelfPacedCourseReview: Model<ISelfPacedCourseReview> =
  mongoose.models.SelfPacedCourseReview || mongoose.model<ISelfPacedCourseReview>('SelfPacedCourseReview', SelfPacedCourseReviewSchema)

export default SelfPacedCourseReview
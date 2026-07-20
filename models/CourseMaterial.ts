// models/CourseMaterial.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type QuestionType = 'mcq' | 'fill' | 'trueFalse'

export interface IQuestion {
  _id?: mongoose.Types.ObjectId
  type: QuestionType
  question: string
  options?: string[]       // mcq only
  correctAnswer: string    // mcq: matching option text; trueFalse: 'true'|'false'; fill: expected text
  explanation?: string
}

export interface ILink {
  _id?: mongoose.Types.ObjectId
  label: string
  url: string
}

export interface ISubtopic {
  _id?: mongoose.Types.ObjectId
  title: string
  content: string
  links: ILink[]
  questions: IQuestion[]
}

export interface ITopic {
  _id?: mongoose.Types.ObjectId
  title: string
  content: string
  links: ILink[]
  questions: IQuestion[]
  subtopics: ISubtopic[]
}

export interface IChapter {
  _id?: mongoose.Types.ObjectId
  title: string
  content: string
  links: ILink[]
  questions: IQuestion[]
  topics: ITopic[]
}

export interface ICourseMaterial extends Document {
  tutorId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  title: string
  description?: string
  status: 'draft' | 'published'
  chapters: IChapter[]
  createdAt: Date
  updatedAt: Date
}

const LinkSchema = new Schema<ILink>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: true }
)

const QuestionSchema = new Schema<IQuestion>(
  {
    type: { type: String, enum: ['mcq', 'fill', 'trueFalse'], required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: true }
)

const SubtopicSchema = new Schema<ISubtopic>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    links: [LinkSchema],
    questions: [QuestionSchema],
  },
  { _id: true }
)

const TopicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    links: [LinkSchema],
    questions: [QuestionSchema],
    subtopics: [SubtopicSchema],
  },
  { _id: true }
)

const ChapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    links: [LinkSchema],
    questions: [QuestionSchema],
    topics: [TopicSchema],
  },
  { _id: true }
)

const CourseMaterialSchema = new Schema<ICourseMaterial>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'Tutor', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    chapters: [ChapterSchema],
  },
  { timestamps: true }
)

const CourseMaterial: Model<ICourseMaterial> =
  mongoose.models.CourseMaterial ||
  mongoose.model<ICourseMaterial>('CourseMaterial', CourseMaterialSchema)

export default CourseMaterial
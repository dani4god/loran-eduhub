// models/Question.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId;
  type: "mcq" | "theory" | "truefalse";
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["mcq", "theory", "truefalse"],
      required: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      required: function () {
        return this.type !== "theory";
      },
    },

    marks: {
      type: Number,
      required: true,
      default: 1,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
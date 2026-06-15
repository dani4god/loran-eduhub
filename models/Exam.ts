
import mongoose, { Schema } from "mongoose";

const ExamSchema = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "Tutor", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },

    title: { type: String, required: true },
    instructions: { type: String },

    duration: { type: Number, default: 60 },

    isPublished: { type: Boolean, default: false },

    scheduledDate: { type: Date },

    allowAutoGrade: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);
import { toISODate, toStringId } from "@/lib/serializers";
import { ExamDTO } from "@/types/exam";

export function mapExam(exam: any, questionCount = 0, submissions = 0): ExamDTO {
  return {
    _id: toStringId(exam._id),

    title: exam.title,
    instructions: exam.instructions,

    course: {
      _id: toStringId(exam.courseId?._id),
      name: exam.courseId?.name,
    },

    duration: exam.duration,
    isPublished: exam.isPublished,

    scheduledDate: toISODate(exam.scheduledDate),

    totalQuestions: questionCount,
    totalMarks: 0,
    submissions,
  };
}
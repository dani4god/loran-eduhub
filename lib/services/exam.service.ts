import dbConnect from "@/lib/mongodb";
import Tutor from "@/models/Tutor";
import Exam from "@/models/Exam";

export async function getTutorExams(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();
  if (!tutor) throw new Error("Tutor not found");

  const exams = await Exam.find({ tutorId: tutor._id })
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  return exams;
}
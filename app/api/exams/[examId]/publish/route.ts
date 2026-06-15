// app/api/exams/[examId]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Tutor from "@/models/Tutor";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = await params;
    await dbConnect();

    const tutor = await Tutor.findOne({ email: session.user.email }).lean();
    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.tutorId.toString() !== tutor._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questionsCount = await Question.countDocuments({ examId });

    if (questionsCount === 0) {
      return NextResponse.json(
        { error: "Cannot publish: add at least one question first." },
        { status: 400 }
      );
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { isPublished: true },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error: any) {
    console.error("[publish] error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to publish exam" },
      { status: 500 }
    );
  }
}
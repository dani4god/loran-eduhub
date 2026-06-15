// app/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Tutor from "@/models/Tutor";
import Question from "@/models/Question";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const tutor = await Tutor.findOne({ email: session.user.email });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, instructions, courseId, duration, scheduledDate, questions } = body;

    // Create exam
    const examData: any = {
      tutorId: tutor._id,
      courseId,
      title,
      instructions,
      duration,
      isPublished: false,
    };

    if (scheduledDate) {
      examData.scheduledDate = new Date(scheduledDate);
    }

    const exam = await Exam.create(examData);

    // Create questions
    const questionDocs = questions.map((q: any, index: number) => ({
      examId: exam._id,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      order: index,
    }));

    await Question.insertMany(questionDocs);

    return NextResponse.json({ success: true, examId: exam._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const tutor = await Tutor.findOne({ email: session.user.email });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const exams = await Exam.find({ tutorId: tutor._id })
      .populate("courseId", "name")
      .sort({ createdAt: -1 });

    // Get question count for each exam
    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        const totalMarks = await Question.aggregate([
          { $match: { examId: exam._id } },
          { $group: { _id: null, total: { $sum: "$marks" } } },
        ]);

        return {
          _id: exam._id,
          title: exam.title,
          instructions: exam.instructions,
          course: exam.courseId,
          duration: exam.duration,
          isPublished: exam.isPublished,
          scheduledDate: exam.scheduledDate,
          totalQuestions: questionCount,
          totalMarks: totalMarks[0]?.total || 0,
        };
      })
    );

    return NextResponse.json(examsWithDetails);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
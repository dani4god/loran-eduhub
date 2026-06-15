// app/api/exams/[examId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Grade from "@/models/Grade";

export async function GET(
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

    const exam = await Exam.findById(examId).populate("courseId", "name");
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const questions = await Question.find({ examId }).sort({ order: 1 });

    return NextResponse.json({ exam, questions });
  } catch (error: any) {
    console.error("[GET exam] error:", error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function DELETE(
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

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    await Promise.all([
      Exam.findByIdAndDelete(examId),
      Question.deleteMany({ examId }),
      Grade.deleteMany({ examId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE exam] error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}

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

    const body = await req.json();

    const exam = await Exam.findByIdAndUpdate(examId, body, { new: true });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error: any) {
    console.error("[PATCH exam] error:", error);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

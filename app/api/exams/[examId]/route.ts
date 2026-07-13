// app/api/exams/[examId]/route.ts
// app/api/exams/[examId]/route.ts

import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import dbConnect from "@/lib/mongodb";

import Exam from "@/models/Exam";
import Course from "@/models/Course"; // Registers Course model for populate()
import Question from "@/models/Question";
import Grade from "@/models/Grade";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { examId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const exam = await Exam.findById(examId).populate(
      "courseId",
      "name"
    );

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    const questions = await Question.find({
      examId,
    }).sort({ order: 1 });

    return NextResponse.json({
      exam,
      questions,
    });
  } catch (error: any) {
    console.error("[GET exam] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch exam",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { examId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const body = await req.json();

    const exam = await Exam.findByIdAndUpdate(
      examId,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exam);
  } catch (error: any) {
    console.error("[PATCH exam] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to update exam",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { examId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const exam = await Exam.findById(examId);

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    await Promise.all([
      Exam.findByIdAndDelete(examId),
      Question.deleteMany({ examId }),
      Grade.deleteMany({ examId }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error: any) {
    console.error("[DELETE exam] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to delete exam",
      },
      { status: 500 }
    );
  }
}
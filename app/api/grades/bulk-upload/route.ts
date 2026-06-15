// app/api/grades/bulk-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Grade from "@/models/Grade";
import Student from "@/models/Student";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const examId = formData.get("examId") as string;

    if (!file || !examId) {
      return NextResponse.json(
        { error: "Missing file or exam ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const text = await file.text();
    const lines = text.split("\n");
    const headers = lines[0].split(",");

    const grades = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length >= 2) {
        const studentEmail = values[0].trim();
        const score = parseFloat(values[1]);
        const feedback = values[2]?.trim();

        const user = await User.findOne({ email: studentEmail });
        if (user) {
          const student = await Student.findOne({ userId: user._id });
          if (student) {
            grades.push({
              studentId: student._id,
              examId: new mongoose.Types.ObjectId(examId),
              courseId: exam.courseId,
              tutorId: exam.tutorId,
              score,
              total: 0, // Will be calculated from exam questions
              percentage: 0, // Will be calculated
              feedback,
              isAutoGraded: false,
              gradedAt: new Date(),
            });
          }
        }
      }
    }

    for (const grade of grades) {
      await Grade.findOneAndUpdate(
        { studentId: grade.studentId, examId: grade.examId },
        grade,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: grades.length,
    });
  } catch (error) {
    console.error("Error uploading grades:", error);
    return NextResponse.json(
      { error: "Failed to upload grades" },
      { status: 500 }
    );
  }
}
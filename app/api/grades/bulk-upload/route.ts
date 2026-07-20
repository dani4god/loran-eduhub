// app/api/grades/bulk-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Grade from "@/models/Grade";
import Student from "@/models/Student";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
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

    const grades = [];
    const skipped: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length >= 2) {
        const studentEmail = values[0].trim();
        const score = parseFloat(values[1]);
        const feedback = values[2]?.trim();

        const user = await User.findOne({ email: studentEmail });
        if (!user) {
          skipped.push(`${studentEmail}: no account found`);
          continue;
        }

        const student = await Student.findOne({ userId: user._id });
        if (!student) {
          skipped.push(`${studentEmail}: no student profile`);
          continue;
        }

        // Grades must be scoped to the SPECIFIC active enrollment — this is
        // what stops a re-enrolled student's new grades from being confused
        // with grades from a previous, withdrawn enrollment in the same
        // course with the same tutor.
        const enrollment = await Enrollment.findOne({
          studentId: student._id,
          courseId: exam.courseId,
          tutorId: exam.tutorId,
          status: { $in: ["active", "paused"] },
        }).sort({ createdAt: -1 });

        if (!enrollment) {
          skipped.push(`${studentEmail}: no active enrollment for this course`);
          continue;
        }

        grades.push({
          studentId: student._id,
          enrollmentId: enrollment._id,
          examId: new mongoose.Types.ObjectId(examId),
          courseId: exam.courseId,
          tutorId: exam.tutorId,
          score,
          total: 0,
          percentage: 0,
          feedback,
          gradedAt: new Date(),
        });
      }
    }

    for (const grade of grades) {
      // Upsert now keyed on (studentId, examId, enrollmentId) — if a student
      // retakes/re-enrolls, this ensures the upload updates THIS enrollment's
      // grade record, not a stale one from a prior enrollment.
      await Grade.findOneAndUpdate(
        { studentId: grade.studentId, examId: grade.examId, enrollmentId: grade.enrollmentId },
        grade,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: grades.length,
      skipped,
    });
  } catch (error) {
    console.error("Error uploading grades:", error);
    return NextResponse.json(
      { error: "Failed to upload grades" },
      { status: 500 }
    );
  }
}
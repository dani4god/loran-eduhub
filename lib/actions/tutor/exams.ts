// lib/actions/tutor/exams.ts
"use server";

import { getTutorExams } from "@/lib/services/exam.service";
import Question from "@/models/Question";
import Grade from "@/models/Grade";
import { mapExam } from "@/lib/dto/exam.dto";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";

export async function getAllTutorExams(email: string) {
  const exams = await getTutorExams(email);

  const results = await Promise.all(
    exams.map(async (exam: any) => {
      const questionCount = await Question.countDocuments({
        examId: exam._id,
      });

      const submissions = await Grade.countDocuments({
        examId: exam._id,
      });

      return mapExam(exam, questionCount, submissions);
    })
  );

  return results;
}

export async function getExamDetails(examId: string) {
  await dbConnect();

  // Fetch exam with course details
  const exam = await Exam.findById(examId).populate("courseId", "name");
  
  if (!exam) {
    return null;
  }

  // Fetch all questions for this exam
  const questions = await Question.find({ examId }).sort({ order: 1 });

  // Calculate total marks
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  // Get all submissions (grades) for this exam
  const submissions = await Grade.find({ examId })
    .populate("studentId", "firstName lastName email");

  // Calculate statistics
  const submissionCount = submissions.length;
  
  let averageScore = 0;
  let passRate = 0;
  let completionRate = 0;

  if (submissionCount > 0) {
    // Average score
    const totalScore = submissions.reduce((sum, g) => sum + g.percentage, 0);
    averageScore = Number((totalScore / submissionCount).toFixed(1));

    // Pass rate (score >= 50%)
    const passedCount = submissions.filter(g => g.percentage >= 50).length;
    passRate = Number(((passedCount / submissionCount) * 100).toFixed(1));

    // Completion rate (submissions that have been graded)
    const completedCount = submissions.filter(g => g.score > 0).length;
    completionRate = Number(((completedCount / submissionCount) * 100).toFixed(1));
  }

  // Get grade distribution
  const gradeDistribution = {
    excellent: submissions.filter(g => g.percentage >= 80).length, // 80-100%
    good: submissions.filter(g => g.percentage >= 65 && g.percentage < 80).length, // 65-79%
    average: submissions.filter(g => g.percentage >= 50 && g.percentage < 65).length, // 50-64%
    poor: submissions.filter(g => g.percentage < 50 && g.percentage > 0).length, // Below 50%
    notGraded: submissions.filter(g => g.score === 0).length, // Not graded yet
  };

  // Transform questions for frontend
  const transformedQuestions = questions.map((q, index) => ({
    _id: q._id,
    type: q.type,
    questionText: q.questionText,
    options: q.options || [],
    correctAnswer: q.correctAnswer,
    marks: q.marks,
    order: q.order || index,
  }));

  return {
    exam: {
      _id: exam._id,
      title: exam.title,
      instructions: exam.instructions,
      duration: exam.duration,
      scheduledDate: exam.scheduledDate,
      isPublished: exam.isPublished,
      courseId: exam.courseId,
      tutorId: exam.tutorId,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    },
    questions: transformedQuestions,
    statistics: {
      totalQuestions: questions.length,
      totalMarks,
      submissions: submissionCount,
      averageScore,
      passRate,
      completionRate,
      gradeDistribution,
    },
    submissions: submissions.map((s: any) => ({
      _id: s._id,
      studentId: s.studentId?._id || s.studentId,
      studentName: s.studentId 
        ? `${s.studentId.firstName || ""} ${s.studentId.lastName || ""}`.trim()
        : "Unknown Student",
      studentEmail: s.studentId?.email || "No email",
      score: s.score,
      total: s.total,
      percentage: s.percentage,
      feedback: s.feedback,
      isAutoGraded: s.isAutoGraded,
      gradedAt: s.gradedAt,
      submittedAt: s.createdAt,
    })),
  };
}

export async function getExamSubmissions(examId: string) {
  await dbConnect();

  const submissions = await Grade.find({ examId })
    .populate("studentId", "firstName lastName email")
    .sort({ createdAt: -1 });

  return submissions.map((s: any) => ({
    _id: s._id,
    studentId: s.studentId?._id || s.studentId,
    studentName: s.studentId 
      ? `${s.studentId.firstName || ""} ${s.studentId.lastName || ""}`.trim()
      : "Unknown Student",
    studentEmail: s.studentId?.email || "No email",
    score: s.score,
    total: s.total,
    percentage: s.percentage,
    feedback: s.feedback,
    isAutoGraded: s.isAutoGraded,
    gradedAt: s.gradedAt,
    submittedAt: s.createdAt,
  }));
}

export async function getExamQuestionAnalytics(examId: string) {
  await dbConnect();

  const questions = await Question.find({ examId }).sort({ order: 1 });
  const submissions = await Grade.find({ examId });

  // Calculate per-question analytics
  const questionAnalytics = await Promise.all(
    questions.map(async (question) => {
      let correctCount = 0;
      let totalAttempts = 0;

      // For each submission, check if the answer to this question is correct
      // This would require storing individual answers in the Grade model
      // For now, return basic info
      
      return {
        _id: question._id,
        questionText: question.questionText,
        type: question.type,
        marks: question.marks,
        order: question.order,
        correctAnswer: question.correctAnswer,
        totalAttempts: submissions.length,
        correctCount: 0, // This would need answers data
        successRate: 0, // This would need answers data
      };
    })
  );

  return questionAnalytics;
}
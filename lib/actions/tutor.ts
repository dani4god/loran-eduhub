// lib/actions/tutor.ts

"use server";

import dbConnect from "@/lib/mongodb";

import Tutor from "@/models/Tutor";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Grade from "@/models/Grade";
import Course from "@/models/Course";
import { ExamDTO } from "@/types/exam";

// -------------------------------------
// HELPERS
// -------------------------------------

function serializeId(id: any) {
  return id?.toString();
}

function serializeDate(date: any) {
  return date ? new Date(date).toISOString() : null;
}

// -------------------------------------
// DASHBOARD DATA
// -------------------------------------

export async function getTutorDashboardData(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
  })
    .populate("studentId")
    .lean();

  const totalStudents = enrollments.length;

  const activeEnrollments = enrollments.filter(
    (e: any) => e.status === "active"
  ).length;

  const exams = await Exam.find({
    tutorId: tutor._id,
  }).lean();

  const totalExams = exams.length;

  const pendingGrading = await Grade.countDocuments({
    tutorId: tutor._id,
    score: 0,
  });

  const recentStudents = await Enrollment.find({
    tutorId: tutor._id,
  })
    .populate("studentId")
    .populate("courseId")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const upcomingExams = await Exam.find({
    tutorId: tutor._id,
    scheduledDate: { $gte: new Date() },
    isPublished: true,
  })
    .populate("courseId")
    .sort({ scheduledDate: 1 })
    .limit(5)
    .lean();

  return {
    tutor: {
      firstName: tutor.firstName,
    },

    stats: {
      totalStudents,
      activeEnrollments,
      totalExams,
      pendingGrading,
    },

    recentStudents: recentStudents.map((e: any) => ({
      id: serializeId(e.studentId?._id),
      name: `${e.studentId?.firstName} ${e.studentId?.lastName}`,
      email: e.studentId?.email,
      phone: e.studentId?.phone,
      course: e.courseId?.name,
      status: e.status,
    })),

    upcomingExams: upcomingExams.map((e: any) => ({
      _id: serializeId(e._id),
      title: e.title,
      course: e.courseId?.name,
      scheduledDate: serializeDate(e.scheduledDate),
    })),
  };
}

// -------------------------------------
// ALL TUTOR STUDENTS
// -------------------------------------

export async function getAllTutorStudents(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
  })
    .populate("studentId")
    .populate("courseId")
    .lean();

  return enrollments.map((enrollment: any) => ({
    _id: serializeId(enrollment.studentId?._id),

    firstName: enrollment.studentId?.firstName,

    lastName: enrollment.studentId?.lastName,

    email: enrollment.studentId?.email,

    phone: enrollment.studentId?.phone,

    course: enrollment.courseId
      ? {
          _id: serializeId(enrollment.courseId._id),
          name: enrollment.courseId.name,
        }
      : null,

    plan: enrollment.plan,

    status: enrollment.status,

    startDate: serializeDate(enrollment.startDate),

    endDate: serializeDate(enrollment.endDate),
  }));
}

// -------------------------------------
// STUDENT DETAILS
// -------------------------------------

export async function getStudentDetails(studentId: string) {
  await dbConnect();

  const student = await Student.findById(studentId).lean();

  if (!student) {
    return null;
  }

  const enrollments = await Enrollment.find({
    studentId,
  })
    .populate("tutorId")
    .populate("courseId")
    .lean();

  const grades = await Grade.find({
    studentId,
  })
    .populate("examId")
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  return {
    student: {
      ...student,
      _id: serializeId(student._id),
    },

    enrollments: enrollments.map((e: any) => ({
      ...e,
      _id: serializeId(e._id),
    })),

    grades: grades.map((g: any) => ({
      ...g,
      _id: serializeId(g._id),
    })),
  };
}

// -------------------------------------
// TUTOR SETTINGS
// -------------------------------------

export async function getTutorSettings(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  return {
    firstName: tutor.firstName,
    lastName: tutor.lastName,
    email: tutor.email,
    phone: tutor.phone,
    bio: tutor.bio,
    qualifications: tutor.qualifications || [],
  };
}

export async function updateTutorSettings(email: string, data: any) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email });

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const updatedTutor = await Tutor.findByIdAndUpdate(
    tutor._id,
    {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      qualifications: data.qualifications,
    },
    {
      new: true,
      lean: true,
    }
  );

  return {
    firstName: updatedTutor?.firstName,
    lastName: updatedTutor?.lastName,
    email: updatedTutor?.email,
    phone: updatedTutor?.phone,
    bio: updatedTutor?.bio,
    qualifications: updatedTutor?.qualifications || [],
  };
}

// -------------------------------------
// ALL TUTOR EXAMS
// -------------------------------------

export async function getAllTutorExams(email: string): Promise<ExamDTO[]> {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();
  if (!tutor) throw new Error("Tutor not found");

  const exams = await Exam.find({ tutorId: tutor._id })
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  const examsWithDetails: ExamDTO[] = await Promise.all(
    exams.map(async (exam: any) => {
      const questionCount = await Question.countDocuments({
        examId: exam._id,
      });

      const totalMarksAgg = await Question.aggregate([
        { $match: { examId: exam._id } },
        { $group: { _id: null, total: { $sum: "$marks" } } },
      ]);

      const submissions = await Grade.countDocuments({
        examId: exam._id,
      });

      return {
        _id: exam._id.toString(),
        title: exam.title,
        instructions: exam.instructions || "",
        course: {
          _id: exam.courseId?._id?.toString(),
          name: exam.courseId?.name || "Unknown Course",
        },
        duration: exam.duration,
        isPublished: exam.isPublished,
        scheduledDate: exam.scheduledDate
          ? exam.scheduledDate.toISOString()
          : null,
        totalQuestions: questionCount,
        totalMarks: totalMarksAgg[0]?.total || 0,
        submissions,
      };
    })
  );

  return examsWithDetails;
}
// -------------------------------------
// TUTOR COURSES
// -------------------------------------

export async function getTutorCourses(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const courses = await Course.find({
    _id: {
      $in: tutor.courses,
    },
  }).lean();

  return courses.map((course: any) => ({
    _id: serializeId(course._id),

    name: course.name,

    description: course.description || "",

    category: course.category || "",

    syllabus: course.syllabus || "",

    isActive: course.isActive ?? true,

    createdAt: serializeDate(course.createdAt),

    updatedAt: serializeDate(course.updatedAt),
  }));
}

// -------------------------------------
// EXAMS FOR GRADING
// -------------------------------------

export async function getTutorExamsForGrading(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const exams = await Exam.find({
    tutorId: tutor._id,
    isPublished: true,
  })
    .populate("courseId")
    .lean();

  const examsWithSubmissions = await Promise.all(
    exams.map(async (exam: any) => {
      const submissions = await Grade.find({
        examId: exam._id,
      })
        .populate("studentId")
        .lean();

      return {
        _id: serializeId(exam._id),

        title: exam.title,

        course: {
          _id: serializeId(exam.courseId?._id),
          name: exam.courseId?.name,
        },

        submissions: submissions.map((grade: any) => ({
          studentId: serializeId(grade.studentId?._id),

          studentName: `${grade.studentId?.firstName} ${grade.studentId?.lastName}`,

          submittedAt: serializeDate(grade.createdAt),

          isGraded: grade.score > 0,
        })),
      };
    })
  );

  return examsWithSubmissions.filter(
    (exam) => exam.submissions.length > 0
  );
}

// -------------------------------------
// DISCORD INFO
// -------------------------------------

export async function getTutorDiscordInfo(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    return {
      isConnected: false,
    };
  }

  return {
    discordServerId: tutor.discordServerId || null,

    discordInviteLink: tutor.discordInviteLink || null,

    isConnected: !!(
      tutor.discordServerId &&
      tutor.discordInviteLink
    ),
  };
}
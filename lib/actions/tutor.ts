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

// lib/actions/tutor.ts — replace getTutorDashboardData with this

export async function getTutorDashboardData(email: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email }).lean();

  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
  }).lean();

  // "Total Students" = unique students, not raw enrollment rows — a
  // student with 2 active courses + 1 withdrawn one is still ONE student,
  // not three. Withdrawn-only enrollments don't count them as a current
  // student.
  const currentEnrollments = enrollments.filter(
    (e: any) => e.status !== "withdrawn"
  );
  const totalStudents = new Set(
    currentEnrollments.map((e: any) => e.studentId.toString())
  ).size;

  const activeEnrollments = enrollments.filter(
    (e: any) => e.status === "active"
  ).length;

  // Earnings: sum of amounts actually paid. Withdrawn enrollments are
  // included (no refund on withdrawal, so the tutor keeps that revenue).
  // 'pending' is excluded since no payment has been confirmed yet.
  const totalEarnings = enrollments
    .filter((e: any) => e.status !== "pending")
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const exams = await Exam.find({
    tutorId: tutor._id,
  }).lean();

  const totalExams = exams.length;

  const pendingGrading = await Grade.countDocuments({
    tutorId: tutor._id,
    score: 0,
  });

  // Group by student so a student with multiple enrollments under this
  // tutor appears once, not once per enrollment — otherwise React sees
  // duplicate keys (same student._id) when this list is rendered.
  const recentEnrollments = await Enrollment.find({
    tutorId: tutor._id,
    status: { $ne: "withdrawn" },
  })
    .populate("studentId")
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  const recentByStudent = new Map<string, any>();

  for (const e of recentEnrollments as any[]) {
    const s = e.studentId;
    if (!s?._id) continue;

    const id = serializeId(s._id);
    if (recentByStudent.has(id)) continue;

    recentByStudent.set(id, {
      id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      phone: s.phone,
      course: e.courseId?.name,
      status: e.status,
    });

    if (recentByStudent.size >= 5) break;
  }

  const recentStudents = Array.from(recentByStudent.values());

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
      totalEarnings,
    },

    recentStudents,

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
    .sort({ createdAt: -1 })
    .lean();

  // Group enrollments by student — a student enrolled in multiple courses
  // with this tutor must appear as ONE row, with each course/plan listed
  // underneath them, not as duplicate rows sharing the same _id.
  const byStudent = new Map<string, any>();

  for (const enrollment of enrollments as any[]) {
    const student = enrollment.studentId;
    if (!student?._id) continue; // orphaned enrollment — skip

    const studentId = serializeId(student._id);

    const courseEntry = {
      enrollmentId: serializeId(enrollment._id),
      course: enrollment.courseId
        ? {
            _id: serializeId(enrollment.courseId._id),
            name: enrollment.courseId.name || "Unknown Course",
          }
        : { _id: "", name: "No Course Assigned" },
      plan: enrollment.plan || "",
      status: enrollment.status || "pending",
      startDate: serializeDate(enrollment.startDate),
      endDate: serializeDate(enrollment.endDate),
      amount: enrollment.amount || 0,
    };

    if (byStudent.has(studentId)) {
      byStudent.get(studentId).courses.push(courseEntry);
    } else {
      byStudent.set(studentId, {
        _id: studentId,
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phone: student.phone || "",
        courses: [courseEntry],
      });
    }
  }

  return Array.from(byStudent.values());
}

// -------------------------------------
// STUDENT DETAILS
// -------------------------------------

// -------------------------------------
// STUDENT DETAILS
// -------------------------------------

export async function getStudentDetails(studentId: string, tutorEmail: string) {
  await dbConnect();

  const tutor = await Tutor.findOne({ email: tutorEmail }).lean();
  if (!tutor) {
    throw new Error("Tutor not found");
  }

  const student = await Student.findById(studentId)
    .populate('userId', 'email')
    .lean();

  if (!student) {
    return null;
  }

  // Scoped to THIS tutor only — a tutor should never see a student's
  // enrollments or grades from a course taught by a different tutor.
  const enrollments = await Enrollment.find({
    studentId,
    tutorId: tutor._id,
  })
    .populate("tutorId")
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  const enrollmentIds = enrollments.map((e: any) => e._id);

  // Scoped to THIS tutor's enrollments specifically — a withdrawn
  // enrollment's grades never bleed into a fresh re-enrollment's history,
  // and grades from a different tutor's course never show up here at all.
  const grades = await Grade.find({
    studentId,
    enrollmentId: { $in: enrollmentIds },
  })
    .populate("examId")
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  const userEmail = (student.userId as any)?.email || '';

  return {
    student: {
      _id: serializeId(student._id),
      firstName: student.firstName,
      lastName: student.lastName,
      email: userEmail,
      phone: student.phone,
      state: student.state || '',
      subscriptionStatus: (student as any).subscriptionStatus || 'active',
      hasUsedFreeTrial: (student as any).hasUsedFreeTrial || false,
      discordUsername: (student as any).discordUsername || null,
      discordRoles: (student as any).discordRoles || [],
      createdAt: serializeDate(student.createdAt),
    },
    enrollments: enrollments.map((e: any) => ({
      _id: serializeId(e._id),
      courseId: {
        _id: serializeId(e.courseId?._id),
        name: e.courseId?.name || 'Unknown Course',
        description: e.courseId?.description || '',
      },
      tutorId: {
        _id: serializeId(e.tutorId?._id),
        firstName: e.tutorId?.firstName || '',
        lastName: e.tutorId?.lastName || '',
      },
      plan: e.plan,
      status: e.status,
      startDate: serializeDate(e.startDate),
      endDate: serializeDate(e.endDate),
      amount: e.amount || 0,
    })),
    grades: grades.map((g: any) => ({
      _id: serializeId(g._id),
      examId: {
        _id: serializeId(g.examId?._id),
        title: g.examId?.title || 'Unknown Exam',
      },
      courseId: {
        _id: serializeId(g.courseId?._id),
        name: g.courseId?.name || 'Unknown Course',
      },
      score: g.score,
      total: g.total,
      percentage: g.percentage,
      feedback: g.feedback || '',
      gradedAt: serializeDate(g.gradedAt),
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
          // Exams are auto-graded the instant a student submits, so the
          // mere existence of a Grade document means it's graded — a
          // legitimate 0% score is still "graded," not "pending." The
          // previous `grade.score > 0` check incorrectly stuck genuine
          // zero-score submissions in the pending bucket forever.
          isGraded: true,
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
      discordId: null,
      discordUsername: null,
      discordRoles: [],
      isConnected: false,
    };
  }

  return {
    discordId: tutor.discordId || null,
    discordUsername: tutor.discordUsername || null,
    discordRoles: tutor.discordRoles || [],
    isConnected: !!tutor.discordId,
  };
}
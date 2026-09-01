// lib/actions/tutor.ts
"use server";

import dbConnect from "@/lib/mongodb";

import Tutor from "@/models/Tutor";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";

import SelfPacedStudent from "@/models/SelfPacedStudent";
import SelfPacedEnrollment from "@/models/SelfPacedEnrollment";
import SelfPacedCourse from "@/models/SelfPacedCourse";

import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Grade from "@/models/Grade";
import Course from "@/models/Course";

import { ExamDTO } from "@/types/exam";

// ============================================================
// HELPERS
// ============================================================

function serializeId(id: any) {
  return id?.toString();
}

function serializeDate(date: any) {
  return date
    ? new Date(date).toISOString()
    : null;
}

// ============================================================
// DASHBOARD DATA
// ============================================================

export async function getTutorDashboardData(
  email: string
) {
  await dbConnect();

  const tutor = await Tutor.findOne({
    email,
  }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  const enrollments =
    await Enrollment.find({
      tutorId: tutor._id,
    }).lean();

  const currentEnrollments =
    enrollments.filter(
      (e: any) =>
        e.status !==
        "withdrawn"
    );

  const totalStudents =
    new Set(
      currentEnrollments.map(
        (e: any) =>
          e.studentId.toString()
      )
    ).size;

  const activeEnrollments =
    enrollments.filter(
      (e: any) =>
        e.status ===
        "active"
    ).length;

  const totalEarnings =
    enrollments
      .filter(
        (e: any) =>
          e.status !==
          "pending"
      )
      .reduce(
        (
          sum: number,
          e: any
        ) =>
          sum +
          (e.amount || 0),
        0
      );

  const exams =
    await Exam.find({
      tutorId: tutor._id,
    }).lean();

  const totalExams =
    exams.length;

  const pendingGrading =
    await Grade.countDocuments({
      tutorId: tutor._id,
      score: 0,
    });

  const recentEnrollments =
    await Enrollment.find({
      tutorId: tutor._id,
      status: {
        $ne: "withdrawn",
      },
    })
      .populate(
        "studentId"
      )
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  const recentByStudent =
    new Map<
      string,
      any
    >();

  for (
    const e of recentEnrollments as any[]
  ) {
    const s =
      e.studentId;

    if (!s?._id) {
      continue;
    }

    const id =
      serializeId(
        s._id
      );

    if (
      recentByStudent.has(
        id
      )
    ) {
      continue;
    }

    recentByStudent.set(
      id,
      {
        id,

        name:
          `${s.firstName} ${s.lastName}`,

        email:
          s.email,

        phone:
          s.phone,

        course:
          e.courseId?.name,

        status:
          e.status,
      }
    );

    if (
      recentByStudent.size >=
      5
    ) {
      break;
    }
  }

  const recentStudents =
    Array.from(
      recentByStudent.values()
    );

  const upcomingExams =
    await Exam.find({
      tutorId: tutor._id,

      scheduledDate: {
        $gte: new Date(),
      },

      isPublished:
        true,
    })
      .populate(
        "courseId"
      )
      .sort({
        scheduledDate: 1,
      })
      .limit(5)
      .lean();

  return {
    tutor: {
      firstName:
        tutor.firstName,
    },

    stats: {
      totalStudents,
      activeEnrollments,
      totalExams,
      pendingGrading,
      totalEarnings,
    },

    recentStudents,

    upcomingExams:
      upcomingExams.map(
        (e: any) => ({
          _id:
            serializeId(
              e._id
            ),

          title:
            e.title,

          course:
            e.courseId?.name,

          scheduledDate:
            serializeDate(
              e.scheduledDate
            ),
        })
      ),
  };
}

// ============================================================
// ALL TUTOR STUDENTS
// Regular + Self-Paced
// ============================================================

export async function getAllTutorStudents(
  email: string
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  // ----------------------------------------------------------
  // REGULAR ENROLLMENTS
  // ----------------------------------------------------------

  const regularEnrollments =
    await Enrollment.find({
      tutorId:
        tutor._id,
    })
      .populate({
        path:
          "studentId",

        populate: {
          path:
            "userId",

          select:
            "email",
        },
      })
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  // ----------------------------------------------------------
  // SELF-PACED ENROLLMENTS
  // ----------------------------------------------------------

  const selfPacedEnrollments =
    await SelfPacedEnrollment.find({
      tutorId:
        tutor._id,
    })
      .populate({
        path:
          "selfPacedStudentId",

        populate: {
          path:
            "userId",

          select:
            "email",
        },
      })
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  // ----------------------------------------------------------
  // REGULAR STUDENTS
  // ----------------------------------------------------------

  const regularByStudent =
    new Map<
      string,
      any
    >();

  for (
    const enrollment of regularEnrollments as any[]
  ) {
    const student =
      enrollment.studentId;

    if (
      !student?._id
    ) {
      continue;
    }

    const studentId =
      serializeId(
        student._id
      );

    const userEmail =
      student.userId
        ?.email ||
      student.email ||
      "";

    const courseEntry =
      {
        enrollmentId:
          serializeId(
            enrollment._id
          ),

        enrollmentType:
          "regular" as const,

        course:
          enrollment.courseId
            ? {
                _id:
                  serializeId(
                    enrollment
                      .courseId
                      ._id
                  ),

                name:
                  enrollment
                    .courseId
                    .name ||
                  "Unknown Course",
              }
            : {
                _id:
                  "",

                name:
                  "No Course Assigned",
              },

        plan:
          enrollment.plan ||
          "",

        status:
          enrollment.status ||
          "pending",

        startDate:
          serializeDate(
            enrollment.startDate
          ),

        endDate:
          serializeDate(
            enrollment.endDate
          ),

        amount:
          enrollment.amount ||
          0,

        completedWeeks:
          0,

        totalWeeks:
          0,

        locked:
          false,

        lockedAtWeek:
          null,

        completedAt:
          null,

        weekProgress:
          [],
      };

    if (
      regularByStudent.has(
        studentId
      )
    ) {
      regularByStudent
        .get(
          studentId
        )
        .courses.push(
          courseEntry
        );
    } else {
      regularByStudent.set(
        studentId,
        {
          _id:
            studentId,

          studentType:
            "regular" as const,

          firstName:
            student.firstName ||
            "",

          lastName:
            student.lastName ||
            "",

          email:
            userEmail,

          phone:
            student.phone ||
            "",

          profileImage:
            student.profileImage ||
            null,

          createdAt:
            serializeDate(
              student.createdAt
            ),

          courses: [
            courseEntry,
          ],
        }
      );
    }
  }

  // ----------------------------------------------------------
  // SELF-PACED STUDENTS
  // ----------------------------------------------------------

  const selfPacedByStudent =
    new Map<
      string,
      any
    >();

  for (
    const enrollment of selfPacedEnrollments as any[]
  ) {
    const student =
      enrollment.selfPacedStudentId;

    if (
      !student?._id
    ) {
      continue;
    }

    const studentId =
      serializeId(
        student._id
      );

    const userEmail =
      student.userId
        ?.email ||
      "";

    const progress =
      Array.isArray(
        enrollment.weekProgress
      )
        ? enrollment.weekProgress
        : [];

    const completedWeeks =
      progress.filter(
        (
          week: any
        ) =>
          week.passed ===
          true
      ).length;

    const totalWeeks =
      Array.isArray(
        enrollment
          .courseId
          ?.weeks
      )
        ? enrollment
            .courseId
            .weeks.length
        : 0;

    const courseEntry =
      {
        enrollmentId:
          serializeId(
            enrollment._id
          ),

        enrollmentType:
          "self_paced" as const,

        course:
          enrollment.courseId
            ? {
                _id:
                  serializeId(
                    enrollment
                      .courseId
                      ._id
                  ),

                name:
                  enrollment
                    .courseId
                    .title ||
                  "Unknown Self-Paced Course",
              }
            : {
                _id:
                  "",

                name:
                  "Unknown Self-Paced Course",
              },

        plan:
          "self_paced",

        status:
          enrollment.completedAt
            ? "completed"
            : enrollment.locked
              ? "locked"
              : "active",

        startDate:
          serializeDate(
            enrollment.createdAt
          ),

        endDate:
          serializeDate(
            enrollment.completedAt
          ),

        amount:
          enrollment.amountPaid ||
          0,

        completedWeeks,

        totalWeeks,

        locked:
          !!enrollment.locked,

        lockedAtWeek:
          enrollment.lockedAtWeek ||
          null,

        completedAt:
          serializeDate(
            enrollment.completedAt
          ),

        weekProgress:
          progress.map(
            (
              week: any
            ) => ({
              weekNumber:
                week.weekNumber,

              examScore:
                week.examScore,

              examTotal:
                week.examTotal,

              examPercentage:
                week.examPercentage,

              passed:
                week.passed,

              attemptsUsed:
                week.attemptsUsed,

              attemptedAt:
                serializeDate(
                  week.attemptedAt
                ),
            })
          ),
      };

    if (
      selfPacedByStudent.has(
        studentId
      )
    ) {
      selfPacedByStudent
        .get(
          studentId
        )
        .courses.push(
          courseEntry
        );
    } else {
      selfPacedByStudent.set(
        studentId,
        {
          _id:
            studentId,

          studentType:
            "self_paced" as const,

          firstName:
            student.firstName ||
            "",

          lastName:
            student.lastName ||
            "",

          email:
            userEmail,

          phone:
            student.phone ||
            "",

          profileImage:
            student.profileImage ||
            null,

          createdAt:
            serializeDate(
              student.createdAt
            ),

          courses: [
            courseEntry,
          ],
        }
      );
    }
  }

  const regularStudents =
    Array.from(
      regularByStudent.values()
    );

  const selfPacedStudents =
    Array.from(
      selfPacedByStudent.values()
    );

  const allStudents = [
    ...regularStudents,
    ...selfPacedStudents,
  ];

  // Newest first.
  allStudents.sort(
    (
      a: any,
      b: any
    ) =>
      new Date(
        b.createdAt || 0
      ).getTime() -
      new Date(
        a.createdAt || 0
      ).getTime()
  );

  return allStudents;
}

// ============================================================
// STUDENT DETAILS
// Regular + Self-Paced
// ============================================================

export async function getStudentDetails(
  studentId: string,
  tutorEmail: string,
  studentType:
    | "regular"
    | "self_paced" =
    "regular"
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email:
        tutorEmail,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  // ==========================================================
  // SELF-PACED STUDENT
  // ==========================================================

  if (
    studentType ===
    "self_paced"
  ) {
    const student =
      await SelfPacedStudent.findById(
        studentId
      )
        .populate(
          "userId",
          "email"
        )
        .lean();

    if (!student) {
      return null;
    }

    const enrollments =
      await SelfPacedEnrollment.find({
        selfPacedStudentId:
          studentId,

        tutorId:
          tutor._id,
      })
        .populate(
          "tutorId"
        )
        .populate(
          "courseId"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // Security:
    // this tutor may only see
    // self-paced students who
    // actually purchased one of
    // this tutor's courses.
    if (
      enrollments.length ===
      0
    ) {
      return null;
    }

    const userEmail =
      (
        student.userId as any
      )?.email || "";

    const mappedEnrollments =
      enrollments.map(
        (e: any) => {
          const progress =
            Array.isArray(
              e.weekProgress
            )
              ? e.weekProgress
              : [];

          const completedWeeks =
            progress.filter(
              (
                week: any
              ) =>
                week.passed ===
                true
            ).length;

          const totalWeeks =
            Array.isArray(
              e.courseId
                ?.weeks
            )
              ? e.courseId
                  .weeks
                  .length
              : 0;

          const attemptedWeeks =
            progress.filter(
              (
                week: any
              ) =>
                typeof week.examPercentage ===
                "number"
            );

          const averageScore =
            attemptedWeeks.length >
            0
              ? Math.round(
                  attemptedWeeks.reduce(
                    (
                      sum: number,
                      week: any
                    ) =>
                      sum +
                      Number(
                        week.examPercentage ||
                          0
                      ),
                    0
                  ) /
                    attemptedWeeks.length
                )
              : null;

          return {
            _id:
              serializeId(
                e._id
              ),

            enrollmentType:
              "self_paced" as const,

            courseId: {
              _id:
                serializeId(
                  e.courseId
                    ?._id
                ),

              name:
                e.courseId
                  ?.title ||
                "Unknown Self-Paced Course",

              description:
                e.courseId
                  ?.description ||
                "",
            },

            tutorId: {
              _id:
                serializeId(
                  e.tutorId
                    ?._id
                ),

              firstName:
                e.tutorId
                  ?.firstName ||
                "",

              lastName:
                e.tutorId
                  ?.lastName ||
                "",
            },

            plan:
              "self_paced",

            status:
              e.completedAt
                ? "completed"
                : e.locked
                  ? "locked"
                  : "active",

            startDate:
              serializeDate(
                e.createdAt
              ),

            endDate:
              serializeDate(
                e.completedAt
              ),

            amount:
              e.amountPaid ||
              0,

            locked:
              !!e.locked,

            lockedAtWeek:
              e.lockedAtWeek ||
              null,

            completedAt:
              serializeDate(
                e.completedAt
              ),

            completedWeeks,

            totalWeeks,

            averageScore,

            weekProgress:
              progress.map(
                (
                  week: any
                ) => ({
                  weekNumber:
                    week.weekNumber,

                  examScore:
                    week.examScore,

                  examTotal:
                    week.examTotal,

                  examPercentage:
                    week.examPercentage,

                  passed:
                    week.passed,

                  attemptsUsed:
                    week.attemptsUsed,

                  attemptedAt:
                    serializeDate(
                      week.attemptedAt
                    ),
                })
              ),
          };
        }
      );

    return {
      studentType:
        "self_paced" as const,

      student: {
        _id:
          serializeId(
            student._id
          ),

        firstName:
          student.firstName,

        lastName:
          student.lastName,

        email:
          userEmail,

        phone:
          student.phone,

        state: "",

        subscriptionStatus:
          "active",

        hasUsedFreeTrial:
          false,

        profileImage:
          student.profileImage ||
          null,

        discordUsername:
          student.discordUsername ||
          null,

        discordRoles:
          student.discordRoles ||
          [],

        createdAt:
          serializeDate(
            student.createdAt
          ),
      },

      enrollments:
        mappedEnrollments,

      grades: [],
    };
  }

  // ==========================================================
  // REGULAR STUDENT
  // ==========================================================

  const student =
    await Student.findById(
      studentId
    )
      .populate(
        "userId",
        "email"
      )
      .lean();

  if (!student) {
    return null;
  }

  const enrollments =
    await Enrollment.find({
      studentId,

      tutorId:
        tutor._id,
    })
      .populate(
        "tutorId"
      )
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  // Prevent a tutor from
  // manually opening the ID
  // of another tutor's student.
  if (
    enrollments.length ===
    0
  ) {
    return null;
  }

  const enrollmentIds =
    enrollments.map(
      (e: any) =>
        e._id
    );

  const grades =
    await Grade.find({
      studentId,

      enrollmentId: {
        $in:
          enrollmentIds,
      },
    })
      .populate(
        "examId"
      )
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  const userEmail =
    (
      student.userId as any
    )?.email || "";

  return {
    studentType:
      "regular" as const,

    student: {
      _id:
        serializeId(
          student._id
        ),

      firstName:
        student.firstName,

      lastName:
        student.lastName,

      email:
        userEmail,

      phone:
        student.phone,

      state:
        student.state ||
        "",

      subscriptionStatus:
        (student as any)
          .subscriptionStatus ||
        "active",

      hasUsedFreeTrial:
        (student as any)
          .hasUsedFreeTrial ||
        false,

      profileImage:
        (student as any)
          .profileImage ||
        null,

      discordUsername:
        (student as any)
          .discordUsername ||
        null,

      discordRoles:
        (student as any)
          .discordRoles ||
        [],

      createdAt:
        serializeDate(
          student.createdAt
        ),
    },

    enrollments:
      enrollments.map(
        (e: any) => ({
          _id:
            serializeId(
              e._id
            ),

          enrollmentType:
            "regular" as const,

          courseId: {
            _id:
              serializeId(
                e.courseId
                  ?._id
              ),

            name:
              e.courseId
                ?.name ||
              "Unknown Course",

            description:
              e.courseId
                ?.description ||
              "",
          },

          tutorId: {
            _id:
              serializeId(
                e.tutorId
                  ?._id
              ),

            firstName:
              e.tutorId
                ?.firstName ||
              "",

            lastName:
              e.tutorId
                ?.lastName ||
              "",
          },

          plan:
            e.plan,

          status:
            e.status,

          startDate:
            serializeDate(
              e.startDate
            ),

          endDate:
            serializeDate(
              e.endDate
            ),

          amount:
            e.amount ||
            0,

          locked:
            false,

          lockedAtWeek:
            null,

          completedAt:
            null,

          completedWeeks:
            0,

          totalWeeks:
            0,

          averageScore:
            null,

          weekProgress:
            [],
        })
      ),

    grades:
      grades.map(
        (g: any) => ({
          _id:
            serializeId(
              g._id
            ),

          examId: {
            _id:
              serializeId(
                g.examId
                  ?._id
              ),

            title:
              g.examId
                ?.title ||
              "Unknown Exam",
          },

          courseId: {
            _id:
              serializeId(
                g.courseId
                  ?._id
              ),

            name:
              g.courseId
                ?.name ||
              "Unknown Course",
          },

          score:
            g.score,

          total:
            g.total,

          percentage:
            g.percentage,

          feedback:
            g.feedback ||
            "",

          gradedAt:
            serializeDate(
              g.gradedAt
            ),
        })
      ),
  };
}

// ============================================================
// TUTOR SETTINGS
// ============================================================

export async function getTutorSettings(
  email: string
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  return {
    firstName:
      tutor.firstName,

    lastName:
      tutor.lastName,

    email:
      tutor.email,

    phone:
      tutor.phone,

    bio:
      tutor.bio,

    qualifications:
      tutor.qualifications ||
      [],
  };
}

export async function updateTutorSettings(
  email: string,
  data: any
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    });

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  const updatedTutor =
    await Tutor.findByIdAndUpdate(
      tutor._id,

      {
        firstName:
          data.firstName,

        lastName:
          data.lastName,

        phone:
          data.phone,

        bio:
          data.bio,

        qualifications:
          data.qualifications,
      },

      {
        new: true,
        lean: true,
      }
    );

  return {
    firstName:
      updatedTutor?.firstName,

    lastName:
      updatedTutor?.lastName,

    email:
      updatedTutor?.email,

    phone:
      updatedTutor?.phone,

    bio:
      updatedTutor?.bio,

    qualifications:
      updatedTutor
        ?.qualifications ||
      [],
  };
}

// ============================================================
// ALL TUTOR EXAMS
// ============================================================

export async function getAllTutorExams(
  email: string
): Promise<
  ExamDTO[]
> {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  const exams =
    await Exam.find({
      tutorId:
        tutor._id,
    })
      .populate(
        "courseId"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

  const examsWithDetails:
    ExamDTO[] =
    await Promise.all(
      exams.map(
        async (
          exam: any
        ) => {
          const questionCount =
            await Question.countDocuments(
              {
                examId:
                  exam._id,
              }
            );

          const totalMarksAgg =
            await Question.aggregate(
              [
                {
                  $match: {
                    examId:
                      exam._id,
                  },
                },

                {
                  $group: {
                    _id: null,

                    total: {
                      $sum:
                        "$marks",
                    },
                  },
                },
              ]
            );

          const submissions =
            await Grade.countDocuments(
              {
                examId:
                  exam._id,
              }
            );

          return {
            _id:
              exam._id.toString(),

            title:
              exam.title,

            instructions:
              exam.instructions ||
              "",

            course: {
              _id:
                exam.courseId
                  ?._id
                  ?.toString(),

              name:
                exam.courseId
                  ?.name ||
                "Unknown Course",
            },

            duration:
              exam.duration,

            isPublished:
              exam.isPublished,

            scheduledDate:
              exam.scheduledDate
                ? exam.scheduledDate.toISOString()
                : null,

            totalQuestions:
              questionCount,

            totalMarks:
              totalMarksAgg[0]
                ?.total ||
              0,

            submissions,
          };
        }
      )
    );

  return examsWithDetails;
}

// ============================================================
// TUTOR COURSES
// ============================================================

export async function getTutorCourses(
  email: string
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  const courses =
    await Course.find({
      _id: {
        $in:
          tutor.courses,
      },
    }).lean();

  return courses.map(
    (
      course: any
    ) => ({
      _id:
        serializeId(
          course._id
        ),

      name:
        course.name,

      description:
        course.description ||
        "",

      category:
        course.category ||
        "",

      syllabus:
        course.syllabus ||
        "",

      isActive:
        course.isActive ??
        true,

      createdAt:
        serializeDate(
          course.createdAt
        ),

      updatedAt:
        serializeDate(
          course.updatedAt
        ),
    })
  );
}

// ============================================================
// EXAMS FOR GRADING
// ============================================================

export async function getTutorExamsForGrading(
  email: string
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    throw new Error(
      "Tutor not found"
    );
  }

  const exams =
    await Exam.find({
      tutorId:
        tutor._id,

      isPublished:
        true,
    })
      .populate(
        "courseId"
      )
      .lean();

  const examsWithSubmissions =
    await Promise.all(
      exams.map(
        async (
          exam: any
        ) => {
          const submissions =
            await Grade.find({
              examId:
                exam._id,
            })
              .populate(
                "studentId"
              )
              .lean();

          return {
            _id:
              serializeId(
                exam._id
              ),

            title:
              exam.title,

            course: {
              _id:
                serializeId(
                  exam.courseId
                    ?._id
                ),

              name:
                exam.courseId
                  ?.name,
            },

            submissions:
              submissions.map(
                (
                  grade: any
                ) => ({
                  studentId:
                    serializeId(
                      grade
                        .studentId
                        ?._id
                    ),

                  studentName:
                    `${grade.studentId?.firstName} ${grade.studentId?.lastName}`,

                  submittedAt:
                    serializeDate(
                      grade.createdAt
                    ),

                  isGraded:
                    true,
                })
              ),
          };
        }
      )
    );

  return examsWithSubmissions.filter(
    (
      exam
    ) =>
      exam.submissions
        .length >
      0
  );
}

// ============================================================
// DISCORD INFO
// ============================================================

export async function getTutorDiscordInfo(
  email: string
) {
  await dbConnect();

  const tutor =
    await Tutor.findOne({
      email,
    }).lean();

  if (!tutor) {
    return {
      discordId:
        null,

      discordUsername:
        null,

      discordRoles:
        [],

      isConnected:
        false,
    };
  }

  return {
    discordId:
      tutor.discordId ||
      null,

    discordUsername:
      tutor.discordUsername ||
      null,

    discordRoles:
      tutor.discordRoles ||
      [],

    isConnected:
      !!tutor.discordId,
  };
}
// app/api/admin/students/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getToken,
} from "next-auth/jwt";

import connectDB from "@/lib/mongodb";

import Admin from "@/models/Admin";

import Student from "@/models/Student";
import SelfPacedStudent from "@/models/SelfPacedStudent";

import User from "@/models/User";

import Enrollment from "@/models/Enrollment";
import SelfPacedEnrollment from "@/models/SelfPacedEnrollment";

import "@/models/Course";
import "@/models/SelfPacedCourse";
import "@/models/Tutor";

import {
  computeEnrollmentAverage,
} from "@/lib/certificateEligibility";

// ============================================================
// HELPERS
// ============================================================

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function serializeDate(
  value: any
) {
  if (!value) {
    return null;
  }

  return new Date(
    value
  ).toISOString();
}

function getSelfPacedAverage(
  progress: any[]
) {
  if (
    !Array.isArray(
      progress
    ) ||
    progress.length ===
      0
  ) {
    return null;
  }

  const scored =
    progress.filter(
      (
        item: any
      ) =>
        typeof item.examPercentage ===
        "number"
    );

  if (
    scored.length ===
    0
  ) {
    return null;
  }

  return (
    scored.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        Number(
          item.examPercentage ||
            0
        ),
      0
    ) /
    scored.length
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const token =
      await getToken({
        req,
      });

    if (
      !token ||
      token.role !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const admin =
      await Admin.findOne({
        userId:
          token.id,
      }).lean();

    if (
      !admin ||
      !admin.isActive
    ) {
      return NextResponse.json(
        {
          error:
            "Admin account deactivated",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // PARAMS
    // ========================================================

    const {
      searchParams,
    } = new URL(
      req.url
    );

    const rawPage =
      Number.parseInt(
        searchParams.get(
          "page"
        ) || "1",
        10
      );

    const rawLimit =
      Number.parseInt(
        searchParams.get(
          "limit"
        ) || "12",
        10
      );

    const page =
      Number.isFinite(
        rawPage
      )
        ? Math.max(
            1,
            rawPage
          )
        : 1;

    const limit =
      Number.isFinite(
        rawLimit
      )
        ? Math.min(
            50,
            Math.max(
              1,
              rawLimit
            )
          )
        : 12;

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    const type =
      searchParams.get(
        "type"
      ) ||
      "all";

    // ========================================================
    // SEARCH QUERY
    // ========================================================

    let matchingUserIds: any[] =
      [];

    let studentQuery: any =
      {};

    if (search) {
      const safeSearch =
        escapeRegex(
          search
        );

      const regex =
        new RegExp(
          safeSearch,
          "i"
        );

      const matchingUsers =
        await User.find({
          email: regex,
        })
          .select("_id")
          .lean();

      matchingUserIds =
        matchingUsers.map(
          (
            user: any
          ) =>
            user._id
        );

      studentQuery = {
        $or: [
          {
            firstName:
              regex,
          },

          {
            lastName:
              regex,
          },

          {
            phone:
              regex,
          },

          ...(matchingUserIds.length
            ? [
                {
                  userId: {
                    $in:
                      matchingUserIds,
                  },
                },
              ]
            : []),
        ],
      };
    }

    // ========================================================
    // LOAD STUDENTS
    // ========================================================

    const [
      regularStudents,
      selfPacedStudents,
    ] =
      await Promise.all([
        type ===
        "self_paced"
          ? Promise.resolve(
              []
            )
          : Student.find(
              studentQuery
            )
              .populate(
                "userId",
                "email"
              )
              .sort({
                createdAt:
                  -1,
              })
              .lean(),

        type ===
        "regular"
          ? Promise.resolve(
              []
            )
          : SelfPacedStudent.find(
              studentQuery
            )
              .populate(
                "userId",
                "email"
              )
              .sort({
                createdAt:
                  -1,
              })
              .lean(),
      ]);

    const now =
      new Date();

    // ========================================================
    // REGULAR STUDENT DTOs
    // ========================================================

    const regularResults =
      await Promise.all(
        (
          regularStudents as any[]
        ).map(
          async (
            student
          ) => {
            const enrollments =
              await Enrollment.find(
                {
                  studentId:
                    student._id,
                }
              )
                .populate(
                  "courseId",
                  "name category"
                )
                .populate(
                  "tutorId",
                  "firstName lastName"
                )
                .sort({
                  createdAt:
                    -1,
                })
                .lean();

            const enrollmentDetails =
              await Promise.all(
                enrollments.map(
                  async (
                    enrollment: any
                  ) => {
                    const {
                      averageScore,
                      hasAnyGrades,
                    } =
                      await computeEnrollmentAverage(
                        enrollment._id.toString()
                      );

                    const daysLeft =
                      enrollment.endDate
                        ? Math.ceil(
                            (
                              new Date(
                                enrollment.endDate
                              ).getTime() -
                              now.getTime()
                            ) /
                              (
                                1000 *
                                60 *
                                60 *
                                24
                              )
                          )
                        : null;

                    return {
                      enrollmentId:
                        enrollment._id.toString(),

                      enrollmentType:
                        "regular",

                      courseId:
                        enrollment.courseId
                          ?._id?.toString() ||
                        "",

                      courseName:
                        enrollment.courseId
                          ?.name ||
                        "Unknown Course",

                      courseCategory:
                        enrollment.courseId
                          ?.category ||
                        "",

                      tutorName:
                        enrollment.tutorId
                          ? `${enrollment.tutorId.firstName} ${enrollment.tutorId.lastName}`
                          : "Unknown Tutor",

                      plan:
                        enrollment.plan,

                      status:
                        enrollment.status,

                      amount:
                        Number(
                          enrollment.amount ||
                            0
                        ),

                      startDate:
                        serializeDate(
                          enrollment.startDate
                        ),

                      endDate:
                        serializeDate(
                          enrollment.endDate
                        ),

                      daysLeft,

                      isExpired:
                        enrollment.status ===
                          "expired" ||
                        (
                          daysLeft !==
                            null &&
                          daysLeft <=
                            0
                        ),

                      averageScore:
                        hasAnyGrades
                          ? averageScore
                          : null,

                      completedWeeks:
                        null,

                      totalWeeks:
                        null,

                      progressPercent:
                        null,

                      locked:
                        false,

                      completedAt:
                        null,
                    };
                  }
                )
              );

            return {
              _id:
                student._id.toString(),

              studentType:
                "regular",

              userId:
                student.userId
                  ?._id?.toString?.() ||
                student.userId?.toString?.() ||
                "",

              firstName:
                student.firstName,

              lastName:
                student.lastName,

              email:
                student.userId
                  ?.email ||
                "",

              phone:
                student.phone ||
                "",

              state:
                student.state ||
                "",

              profileImage:
                student.profileImage ||
                null,

              discordUsername:
                student.discordUsername ||
                null,

              discordId:
                student.discordId ||
                null,

              hasUsedFreeTrial:
                !!student.hasUsedFreeTrial,

              createdAt:
                serializeDate(
                  student.createdAt
                ),

              enrollments:
                enrollmentDetails,
            };
          }
        )
      );

    // ========================================================
    // SELF-PACED STUDENT DTOs
    // ========================================================

    const selfPacedResults =
      await Promise.all(
        (
          selfPacedStudents as any[]
        ).map(
          async (
            student
          ) => {
            const enrollments =
              await SelfPacedEnrollment.find(
                {
                  selfPacedStudentId:
                    student._id,
                }
              )
                .populate(
                  "courseId",
                  "title category weeks"
                )
                .populate(
                  "tutorId",
                  "firstName lastName"
                )
                .sort({
                  createdAt:
                    -1,
                })
                .lean();

            const enrollmentDetails =
              enrollments.map(
                (
                  enrollment: any
                ) => {
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
                      enrollment.courseId
                        ?.weeks
                    )
                      ? enrollment.courseId
                          .weeks
                          .length
                      : 0;

                  const progressPercent =
                    totalWeeks >
                    0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              completedWeeks /
                              totalWeeks
                            ) *
                              100
                          )
                        )
                      : 0;

                  const averageScore =
                    getSelfPacedAverage(
                      progress
                    );

                  return {
                    enrollmentId:
                      enrollment._id.toString(),

                    enrollmentType:
                      "self_paced",

                    courseId:
                      enrollment.courseId
                        ?._id?.toString() ||
                      "",

                    courseName:
                      enrollment.courseId
                        ?.title ||
                      "Unknown Self-Paced Course",

                    courseCategory:
                      enrollment.courseId
                        ?.category ||
                      "Self-Paced",

                    tutorName:
                      enrollment.tutorId
                        ? `${enrollment.tutorId.firstName} ${enrollment.tutorId.lastName}`
                        : "Unknown Tutor",

                    plan:
                      "self_paced",

                    status:
                      enrollment.completedAt
                        ? "completed"
                        : enrollment.locked
                          ? "locked"
                          : "active",

                    amount:
                      Number(
                        enrollment.amountPaid ||
                          0
                      ),

                    startDate:
                      serializeDate(
                        enrollment.createdAt
                      ),

                    endDate:
                      serializeDate(
                        enrollment.completedAt
                      ),

                    daysLeft:
                      null,

                    isExpired:
                      false,

                    averageScore,

                    completedWeeks,

                    totalWeeks,

                    progressPercent,

                    locked:
                      !!enrollment.locked,

                    lockedAtWeek:
                      enrollment.lockedAtWeek ||
                      null,

                    completedAt:
                      serializeDate(
                        enrollment.completedAt
                      ),
                  };
                }
              );

            return {
              _id:
                student._id.toString(),

              studentType:
                "self_paced",

              userId:
                student.userId
                  ?._id?.toString?.() ||
                student.userId?.toString?.() ||
                "",

              firstName:
                student.firstName,

              lastName:
                student.lastName,

              email:
                student.userId
                  ?.email ||
                "",

              phone:
                student.phone ||
                "",

              state: "",

              profileImage:
                student.profileImage ||
                null,

              discordUsername:
                student.discordUsername ||
                null,

              discordId:
                student.discordId ||
                null,

              hasUsedFreeTrial:
                false,

              createdAt:
                serializeDate(
                  student.createdAt
                ),

              enrollments:
                enrollmentDetails,
            };
          }
        )
      );

    // ========================================================
    // MERGE + PAGINATE
    // ========================================================

    const combined = [
      ...regularResults,
      ...selfPacedResults,
    ].sort(
      (
        a,
        b
      ) =>
        new Date(
          b.createdAt ||
            0
        ).getTime() -
        new Date(
          a.createdAt ||
            0
        ).getTime()
    );

    const total =
      combined.length;

    const pages =
      Math.max(
        1,
        Math.ceil(
          total /
            limit
        )
      );

    const safePage =
      Math.min(
        page,
        pages
      );

    const start =
      (
        safePage -
        1
      ) *
      limit;

    const paginated =
      combined.slice(
        start,
        start +
          limit
      );

    return NextResponse.json({
      students:
        paginated,

      total,

      page:
        safePage,

      pages,

      counts: {
        total:
          regularResults.length +
          selfPacedResults.length,

        live:
          regularResults.length,

        selfPaced:
          selfPacedResults.length,
      },
    });
  } catch (
    error: any
  ) {
    console.error(
      "Admin students error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load students",
      },
      {
        status: 500,
      }
    );
  }
}
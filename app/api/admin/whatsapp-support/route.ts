// app/api/admin/whatsapp-support/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getToken,
} from "next-auth/jwt";

import connectDB from "@/lib/mongodb";

import Admin from "@/models/Admin";
import SelfPacedStudent from "@/models/SelfPacedStudent";
import SelfPacedCourse from "@/models/SelfPacedCourse";
import SelfPacedMentorEscalation from "@/models/SelfPacedMentorEscalation";
import SelfPacedMentorMessage from "@/models/SelfPacedMentorMessage";

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
  value: unknown
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value as string | number | Date
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATE ADMIN
    // ========================================================

    const token =
      await getToken({
        req,
      });

    if (
      !token ||
      token.role !== "admin"
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

    // ========================================================
    // 2. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 3. VERIFY ACTIVE ADMIN ACCOUNT
    // ========================================================

    const admin =
      await Admin.findOne({
        userId:
          token.id,
      })
        .select(
          "_id isActive"
        )
        .lean();

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
    // 4. QUERY PARAMETERS
    // ========================================================

    const {
      searchParams,
    } =
      new URL(
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
        ) || "20",
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
        : 20;

    const status =
      (
        searchParams.get(
          "status"
        ) || "open"
      )
        .trim()
        .toLowerCase();

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    // ========================================================
    // 5. VALIDATE STATUS
    // ========================================================

    const allowedStatuses =
      new Set([
        "all",
        "open",
        "in_progress",
        "resolved",
        "closed",
      ]);

    if (
      !allowedStatuses.has(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid support status.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 6. BUILD ESCALATION QUERY
    // ========================================================

    const query:
      Record<
        string,
        unknown
      > = {};

    if (
      status !== "all"
    ) {
      query.status =
        status;
    }

    /*
     * Search can match:
     *
     * - student first name
     * - student last name
     * - registered phone
     * - WhatsApp mentor phone
     * - course title
     * - escalation message
     * - AI summary
     *
     * Student/course matches are resolved to IDs before the
     * escalation query is executed.
     */

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

      const [
        matchingStudents,
        matchingCourses,
      ] =
        await Promise.all([
          SelfPacedStudent
            .find({
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
              ],
            })
            .select("_id")
            .lean(),

          SelfPacedCourse
            .find({
              title:
                regex,
            })
            .select("_id")
            .lean(),
        ]);

      const studentIds =
        matchingStudents.map(
          (student) =>
            student._id
        );

      const courseIds =
        matchingCourses.map(
          (course) =>
            course._id
        );

      query.$or = [
        {
          phone:
            regex,
        },

        {
          studentMessage:
            regex,
        },

        {
          aiSummary:
            regex,
        },

        ...(studentIds.length
          ? [
              {
                selfPacedStudentId: {
                  $in:
                    studentIds,
                },
              },
            ]
          : []),

        ...(courseIds.length
          ? [
              {
                courseId: {
                  $in:
                    courseIds,
                },
              },
            ]
          : []),
      ];
    }

    // ========================================================
    // 7. LOAD ESCALATIONS
    // ========================================================

    const total =
      await SelfPacedMentorEscalation
        .countDocuments(
          query
        );

    const escalations =
      await SelfPacedMentorEscalation
        .find(
          query
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) *
            limit
        )
        .limit(
          limit
        )
        .lean();

    // ========================================================
    // 8. COLLECT RELATED IDS
    // ========================================================

    const studentIds =
      Array.from(
        new Set(
          escalations
            .map(
              (item) =>
                item
                  .selfPacedStudentId
                  ?.toString()
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(
                  value
                )
            )
        )
      );

    const courseIds =
      Array.from(
        new Set(
          escalations
            .map(
              (item) =>
                item
                  .courseId
                  ?.toString()
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(
                  value
                )
            )
        )
      );

    // ========================================================
    // 9. LOAD STUDENTS + COURSES
    // ========================================================

    const [
      students,
      courses,
    ] =
      await Promise.all([
        studentIds.length
          ? SelfPacedStudent
              .find({
                _id: {
                  $in:
                    studentIds,
                },
              })
              .select(
                "_id firstName lastName phone userId"
              )
              .populate(
                "userId",
                "email"
              )
              .lean()
          : Promise.resolve(
              []
            ),

        courseIds.length
          ? SelfPacedCourse
              .find({
                _id: {
                  $in:
                    courseIds,
                },
              })
              .select(
                "_id title category"
              )
              .lean()
          : Promise.resolve(
              []
            ),
      ]);

    // ========================================================
    // 10. BUILD LOOKUP MAPS
    // ========================================================

    const studentMap =
      new Map<
        string,
        any
      >();

    for (
      const student of
      students as any[]
    ) {
      studentMap.set(
        student._id.toString(),
        student
      );
    }

    const courseMap =
      new Map<
        string,
        any
      >();

    for (
      const course of
      courses as any[]
    ) {
      courseMap.set(
        course._id.toString(),
        course
      );
    }

    // ========================================================
    // 11. BUILD RESPONSE ITEMS
    // ========================================================

    const items =
      await Promise.all(
        escalations.map(
          async (
            escalation: any
          ) => {
            const student =
              studentMap.get(
                escalation
                  .selfPacedStudentId
                  ?.toString()
              );

            const course =
              escalation.courseId
                ? courseMap.get(
                    escalation
                      .courseId
                      .toString()
                  )
                : null;

            /*
             * Show the most recent WhatsApp activity for this
             * student so the admin can immediately see whether
             * the conversation has continued since escalation.
             */
            const latestMessage =
              await SelfPacedMentorMessage
                .findOne({
                  selfPacedStudentId:
                    escalation
                      .selfPacedStudentId,
                })
                .sort({
                  createdAt: -1,
                })
                .select(
                  "direction type message createdAt"
                )
                .lean();

            return {
              _id:
                escalation
                  ._id
                  .toString(),

              status:
                escalation.status,

              reason:
                escalation.reason,

              phone:
                escalation.phone,

              studentMessage:
                escalation
                  .studentMessage,

              aiSummary:
                escalation
                  .aiSummary ||
                null,

              humanResponse:
                escalation
                  .humanResponse ||
                null,

              createdAt:
                serializeDate(
                  escalation
                    .createdAt
                ),

              updatedAt:
                serializeDate(
                  escalation
                    .updatedAt
                ),

              resolvedAt:
                serializeDate(
                  escalation
                    .resolvedAt
                ),

              sourceMessageId:
                escalation
                  .sourceMessageId
                  ?.toString() ||
                null,

              enrollmentId:
                escalation
                  .enrollmentId
                  ?.toString() ||
                null,

              courseId:
                escalation
                  .courseId
                  ?.toString() ||
                null,

              student: {
                _id:
                  student?._id
                    ?.toString() ||
                  escalation
                    .selfPacedStudentId
                    ?.toString() ||
                  "",

                firstName:
                  student
                    ?.firstName ||
                  "",

                lastName:
                  student
                    ?.lastName ||
                  "",

                name:
                  [
                    student
                      ?.firstName,
                    student
                      ?.lastName,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    ) ||
                  "Unknown Student",

                email:
                  student
                    ?.userId
                    ?.email ||
                  "",

                registeredPhone:
                  student
                    ?.phone ||
                  "",
              },

              course:
                course
                  ? {
                      _id:
                        course
                          ._id
                          .toString(),

                      title:
                        course
                          .title,

                      category:
                        course
                          .category ||
                        "",
                    }
                  : null,

              latestMessage:
                latestMessage
                  ? {
                      direction:
                        latestMessage
                          .direction,

                      type:
                        latestMessage
                          .type,

                      message:
                        latestMessage
                          .message,

                      createdAt:
                        serializeDate(
                          latestMessage
                            .createdAt
                        ),
                    }
                  : null,
            };
          }
        )
      );

    // ========================================================
    // 12. STATUS COUNTS
    // ========================================================

    const [
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
    ] =
      await Promise.all([
        SelfPacedMentorEscalation
          .countDocuments({
            status:
              "open",
          }),

        SelfPacedMentorEscalation
          .countDocuments({
            status:
              "in_progress",
          }),

        SelfPacedMentorEscalation
          .countDocuments({
            status:
              "resolved",
          }),

        SelfPacedMentorEscalation
          .countDocuments({
            status:
              "closed",
          }),
      ]);

    const allCount =
      openCount +
      inProgressCount +
      resolvedCount +
      closedCount;

    // ========================================================
    // 13. PAGINATION
    // ========================================================

    const pages =
      Math.max(
        1,
        Math.ceil(
          total /
            limit
        )
      );

    // ========================================================
    // 14. RESPONSE
    // ========================================================

    return NextResponse.json({
      escalations:
        items,

      total,

      page,

      pages,

      statusCounts: {
        all:
          allCount,

        open:
          openCount,

        in_progress:
          inProgressCount,

        resolved:
          resolvedCount,

        closed:
          closedCount,
      },
    });
  } catch (
    error: any
  ) {
    console.error(
      "Admin WhatsApp support error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load WhatsApp support requests.",
      },
      {
        status: 500,
      }
    );
  }
}
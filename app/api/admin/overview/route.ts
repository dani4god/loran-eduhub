// app/api/admin/overview/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getToken,
} from "next-auth/jwt";

import connectDB from "@/lib/mongodb";

import Student from "@/models/Student";
import SelfPacedStudent from "@/models/SelfPacedStudent";

import Tutor from "@/models/Tutor";


import Enrollment from "@/models/Enrollment";
import SelfPacedEnrollment from "@/models/SelfPacedEnrollment";

import Payment from "@/models/Payment";

import LessonNotePurchase from "@/models/LessonNotePurchase";
import LessonNote from "@/models/LessonNote";

import Admin from "@/models/Admin";

import Course from "@/models/Course";
import SelfPacedCourse from "@/models/SelfPacedCourse";

import Certificate from "@/models/Certificate";

// ============================================================
// HELPERS
// ============================================================

function sumAmounts(
  records: any[],
  field: string
) {
  return records.reduce(
    (
      sum,
      record
    ) =>
      sum +
      Number(
        record?.[
          field
        ] || 0
      ),
    0
  );
}

function getTimeAgo(
  date: Date,
  now: Date
) {
  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          now.getTime() -
          new Date(
            date
          ).getTime()
        ) /
          1000
      )
    );

  const intervals: [
    string,
    number,
  ][] = [
    [
      "year",
      31536000,
    ],
    [
      "month",
      2592000,
    ],
    [
      "week",
      604800,
    ],
    [
      "day",
      86400,
    ],
    [
      "hour",
      3600,
    ],
    [
      "minute",
      60,
    ],
  ];

  for (
    const [
      unit,
      secondsInUnit,
    ] of intervals
  ) {
    const interval =
      Math.floor(
        seconds /
          secondsInUnit
      );

    if (
      interval >= 1
    ) {
      return `${interval} ${unit}${
        interval === 1
          ? ""
          : "s"
      } ago`;
    }
  }

  return "just now";
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
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

    const now =
      new Date();

    const fiveDaysFromNow =
      new Date(
        now.getTime() +
          5 *
            24 *
            60 *
            60 *
            1000
      );

    const thirtyDaysAgo =
      new Date(
        now.getTime() -
          30 *
            24 *
            60 *
            60 *
            1000
      );

    const sixtyDaysAgo =
      new Date(
        now.getTime() -
          60 *
            24 *
            60 *
            60 *
            1000
      );

    // ========================================================
    // COUNTS
    // ========================================================

    const [
      liveStudents,
      selfPacedStudents,
      totalTutors,
      pendingTutors,
      activeEnrollments,
      expiringEnrollments,
      selfPacedEnrollments,
      totalLiveCourses,
      totalSelfPacedCourses,
      pendingPayments,
      certificatesIssued,
      lessonNotePurchases,
    ] =
      await Promise.all([
        Student.countDocuments(),

        SelfPacedStudent.countDocuments(),

        Tutor.countDocuments({
          status:
            "approved",
        }),

        Tutor.countDocuments({
          status:
            "pending",
        }),

        Enrollment.countDocuments({
          status:
            "active",
        }),

        Enrollment.countDocuments({
          status:
            "active",

          endDate: {
            $gte: now,
            $lte:
              fiveDaysFromNow,
          },
        }),

        SelfPacedEnrollment.countDocuments(),

        Course.countDocuments({
          isActive:
            true,
        }),

        SelfPacedCourse.countDocuments(),

        Payment.countDocuments({
          status:
            "pending",
        }),

        Certificate.countDocuments().catch(
          () => 0
        ),

        LessonNotePurchase.countDocuments(),
      ]);

    const totalStudents =
      liveStudents +
      selfPacedStudents;

    const totalCourses =
      totalLiveCourses +
      totalSelfPacedCourses;

    // ========================================================
    // REVENUE
    // ========================================================

    const [
      livePayments,
      selfPacedPayments,
      notePayments,
    ] =
      await Promise.all([
        Payment.find({
          status:
            "success",
        })
          .select(
            "amount paidAt createdAt"
          )
          .lean(),

        SelfPacedEnrollment.find()
          .select(
            "amountPaid createdAt"
          )
          .lean(),

        LessonNotePurchase.find()
          .select(
            "amountPaid createdAt"
          )
          .lean(),
      ]);

    const liveRevenue =
      sumAmounts(
        livePayments,
        "amount"
      );

    const selfPacedRevenue =
      sumAmounts(
        selfPacedPayments,
        "amountPaid"
      );

    const lessonNoteRevenue =
      sumAmounts(
        notePayments,
        "amountPaid"
      );

    const totalRevenue =
      liveRevenue +
      selfPacedRevenue +
      lessonNoteRevenue;

    // ========================================================
    // 30-DAY REVENUE CHANGE
    // Across all three payment products
    // ========================================================

    const isWithin = (
      rawDate: any,
      start: Date,
      end?: Date
    ) => {
      if (!rawDate) {
        return false;
      }

      const date =
        new Date(rawDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return false;
      }

      if (
        date < start
      ) {
        return false;
      }

      if (
        end &&
        date >= end
      ) {
        return false;
      }

      return true;
    };

    const currentLiveRevenue =
      livePayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.paidAt ||
                payment.createdAt,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amount ||
                0
            ),
          0
        );

    const previousLiveRevenue =
      livePayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.paidAt ||
                payment.createdAt,
              sixtyDaysAgo,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amount ||
                0
            ),
          0
        );

    const currentSelfPacedRevenue =
      selfPacedPayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.createdAt,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amountPaid ||
                0
            ),
          0
        );

    const previousSelfPacedRevenue =
      selfPacedPayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.createdAt,
              sixtyDaysAgo,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amountPaid ||
                0
            ),
          0
        );

    const currentLessonNoteRevenue =
      notePayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.createdAt,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amountPaid ||
                0
            ),
          0
        );

    const previousLessonNoteRevenue =
      notePayments
        .filter(
          (
            payment: any
          ) =>
            isWithin(
              payment.createdAt,
              sixtyDaysAgo,
              thirtyDaysAgo
            )
        )
        .reduce(
          (
            sum: number,
            payment: any
          ) =>
            sum +
            Number(
              payment.amountPaid ||
                0
            ),
          0
        );

    const recentRevenue =
      currentLiveRevenue +
      currentSelfPacedRevenue +
      currentLessonNoteRevenue;

    const previousRevenue =
      previousLiveRevenue +
      previousSelfPacedRevenue +
      previousLessonNoteRevenue;

    let revenueChange =
      0;

    if (
      previousRevenue >
      0
    ) {
      revenueChange =
        Math.round(
          (
            (
              recentRevenue -
              previousRevenue
            ) /
            previousRevenue
          ) *
            100
        );
    } else if (
      recentRevenue >
      0
    ) {
      revenueChange =
        100;
    }

    // ========================================================
    // RECENT ACTIVITY
    // ========================================================

    const [
      recentTutors,
      recentLiveEnrollments,
      recentSelfPacedEnrollments,
      recentLessonNotePurchases,
    ] =
      await Promise.all([
        Tutor.find({
          status: {
            $in: [
              "approved",
              "disapproved",
            ],
          },
        })
          .sort({
            updatedAt:
              -1,
          })
          .limit(8)
          .lean(),

        Enrollment.find()
          .sort({
            createdAt:
              -1,
          })
          .limit(8)
          .populate(
            "studentId",
            "firstName lastName"
          )
          .populate(
            "courseId",
            "name"
          )
          .lean(),

        SelfPacedEnrollment.find()
          .sort({
            createdAt:
              -1,
          })
          .limit(8)
          .populate(
            "selfPacedStudentId",
            "firstName lastName"
          )
          .populate(
            "courseId",
            "title"
          )
          .lean(),

        LessonNotePurchase.find()
          .sort({
            createdAt:
              -1,
          })
          .limit(8)
          .populate(
            "lessonNoteId",
            "title"
          )
          .lean(),
      ]);

    type Activity = {
      type: string;
      message: string;
      date: Date;
    };

    const activities: Activity[] =
      [];

    for (
      const tutor of recentTutors as any[]
    ) {
      activities.push({
        type:
          tutor.status ===
          "approved"
            ? "tutor_approved"
            : "tutor_rejected",

        message:
          `Tutor application ${
            tutor.status ===
            "approved"
              ? "approved"
              : "rejected"
          }: ${
            tutor.firstName
          } ${
            tutor.lastName
          }`,

        date:
          tutor.updatedAt,
      });
    }

    for (
      const enrollment of recentLiveEnrollments as any[]
    ) {
      const studentName =
        enrollment.studentId
          ? `${enrollment.studentId.firstName} ${enrollment.studentId.lastName}`
          : "A student";

      const courseName =
        enrollment.courseId
          ?.name ||
        "a course";

      activities.push({
        type:
          "new_enrollment",

        message:
          `${studentName} enrolled in ${courseName}`,

        date:
          enrollment.createdAt,
      });
    }

    for (
      const enrollment of recentSelfPacedEnrollments as any[]
    ) {
      const studentName =
        enrollment.selfPacedStudentId
          ? `${enrollment.selfPacedStudentId.firstName} ${enrollment.selfPacedStudentId.lastName}`
          : "A learner";

      const courseName =
        enrollment.courseId
          ?.title ||
        "a self-paced course";

      activities.push({
        type:
          "self_paced_purchase",

        message:
          `${studentName} purchased ${courseName}`,

        date:
          enrollment.createdAt,
      });
    }

    for (
      const purchase of recentLessonNotePurchases as any[]
    ) {
      const buyer =
        purchase.buyerName ||
        purchase.buyerEmail ||
        "A learner";

      const noteTitle =
        purchase.lessonNoteId
          ?.title ||
        "a lesson note";

      activities.push({
        type:
          "lesson_note_purchase",

        message:
          `${buyer} purchased ${noteTitle}`,

        date:
          purchase.createdAt,
      });
    }

    activities.sort(
      (
        a,
        b
      ) =>
        new Date(
          b.date
        ).getTime() -
        new Date(
          a.date
        ).getTime()
    );

    const recentActivities =
      activities
        .slice(
          0,
          12
        )
        .map(
          (
            activity
          ) => ({
            type:
              activity.type,

            message:
              activity.message,

            timeAgo:
              getTimeAgo(
                activity.date,
                now
              ),
          })
        );

    return NextResponse.json({
      totalStudents,

      liveStudents,

      selfPacedStudents,

      totalTutors,

      pendingTutors,

      activeEnrollments,

      expiringEnrollments,

      selfPacedEnrollments,

      totalCourses,

      totalLiveCourses,

      totalSelfPacedCourses,

      pendingPayments,

      certificatesIssued,

      lessonNotePurchases,

      totalRevenue,

      liveRevenue,

      selfPacedRevenue,

      lessonNoteRevenue,

      recentRevenue,

      revenueChange,

      recentActivities,
    });
  } catch (
    error: any
  ) {
    console.error(
      "Admin overview error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load admin overview",
      },
      {
        status: 500,
      }
    );
  }
}
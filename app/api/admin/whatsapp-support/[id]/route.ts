// app/api/admin/whatsapp-support/[id]/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getToken,
} from "next-auth/jwt";

import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import {
  sendWhatsAppText,
} from "@/lib/whatsapp";

import Admin from "@/models/Admin";
import SelfPacedStudent from "@/models/SelfPacedStudent";
import SelfPacedCourse from "@/models/SelfPacedCourse";
import SelfPacedMentorEscalation from "@/models/SelfPacedMentorEscalation";
import SelfPacedMentorMessage from "@/models/SelfPacedMentorMessage";

// ============================================================
// TYPES
// ============================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type EscalationStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

// ============================================================
// HELPERS
// ============================================================

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

function cleanMessage(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .replace(
      /\r\n/g,
      "\n"
    )
    .trim();
}

// ============================================================
// REQUIRE ACTIVE ADMIN
// ============================================================

async function requireActiveAdmin(
  req: NextRequest
) {
  const token =
    await getToken({
      req,
    });

  if (
    !token ||
    token.role !== "admin"
  ) {
    return {
      ok: false as const,

      response:
        NextResponse.json(
          {
            error:
              "Unauthorized",
          },
          {
            status: 401,
          }
        ),
    };
  }

  await connectDB();

  const admin =
    await Admin.findOne({
      userId:
        token.id,
    })
      .select(
        "_id userId isActive"
      )
      .lean();

  if (
    !admin ||
    !admin.isActive
  ) {
    return {
      ok: false as const,

      response:
        NextResponse.json(
          {
            error:
              "Admin account deactivated",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    ok: true as const,

    token,

    admin,
  };
}

// ============================================================
// BUILD ESCALATION DTO
// ============================================================

async function buildEscalationDTO(
  escalation: any
) {
  const [
    student,
    course,
  ] =
    await Promise.all([
      SelfPacedStudent
        .findById(
          escalation
            .selfPacedStudentId
        )
        .select(
          "_id firstName lastName phone userId"
        )
        .populate(
          "userId",
          "email"
        )
        .lean(),

      escalation.courseId
        ? SelfPacedCourse
            .findById(
              escalation
                .courseId
            )
            .select(
              "_id title category"
            )
            .lean()
        : Promise.resolve(
            null
          ),
    ]);

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

    assignedTo:
      escalation
        .assignedTo
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
        (student as any)
          ?.firstName ||
        "",

      lastName:
        (student as any)
          ?.lastName ||
        "",

      name:
        [
          (student as any)
            ?.firstName,

          (student as any)
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
        (student as any)
          ?.userId
          ?.email ||
        "",

      registeredPhone:
        (student as any)
          ?.phone ||
        "",
    },

    course:
      course
        ? {
            _id:
              (course as any)
                ._id
                .toString(),

            title:
              (course as any)
                .title,

            category:
              (course as any)
                .category ||
              "",
          }
        : null,
  };
}

// ============================================================
// GET ONE SUPPORT CASE + CONVERSATION
// ============================================================

export async function GET(
  req: NextRequest,
  {
    params,
  }: RouteContext
) {
  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

    const auth =
      await requireActiveAdmin(
        req
      );

    if (!auth.ok) {
      return auth.response;
    }

    // ========================================================
    // 2. ESCALATION ID
    // ========================================================

    const {
      id,
    } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid support request ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. FIND ESCALATION
    // ========================================================

    const escalation =
      await SelfPacedMentorEscalation
        .findById(
          id
        )
        .lean();

    if (!escalation) {
      return NextResponse.json(
        {
          error:
            "Support request not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 4. LOAD WHATSAPP CONVERSATION
    // ========================================================

    /*
     * Conversation is based on the student rather than only the
     * enrollment because human support should be able to see the
     * surrounding conversation that caused the escalation.
     *
     * We cap the response to the most recent 200 messages.
     */

    const messages =
      await SelfPacedMentorMessage
        .find({
          selfPacedStudentId:
            escalation
              .selfPacedStudentId,
        })
        .sort({
          createdAt: -1,
        })
        .limit(
          200
        )
        .lean();

    /*
     * Query newest-first for efficiency, then reverse it for
     * chronological chat display.
     */

    messages.reverse();

    // ========================================================
    // 5. RESPONSE
    // ========================================================

    const escalationDTO =
      await buildEscalationDTO(
        escalation
      );

    const conversation =
      messages.map(
        (
          message: any
        ) => ({
          _id:
            message
              ._id
              .toString(),

          direction:
            message
              .direction,

          type:
            message
              .type,

          phone:
            message
              .phone,

          message:
            message
              .message,

          status:
            message
              .status,

          whatsappMessageId:
            message
              .whatsappMessageId ||
            null,

          enrollmentId:
            message
              .enrollmentId
              ?.toString() ||
            null,

          courseId:
            message
              .courseId
              ?.toString() ||
            null,

          errorMessage:
            message
              .errorMessage ||
            null,

          sentAt:
            serializeDate(
              message
                .sentAt
            ),

          deliveredAt:
            serializeDate(
              message
                .deliveredAt
            ),

          readAt:
            serializeDate(
              message
                .readAt
            ),

          receivedAt:
            serializeDate(
              message
                .receivedAt
            ),

          createdAt:
            serializeDate(
              message
                .createdAt
            ),

          metadata:
            message
              .metadata ||
            null,
        })
      );

    return NextResponse.json({
      escalation:
        escalationDTO,

      conversation,
    });
  } catch (
    error: any
  ) {
    console.error(
      "Admin WhatsApp support detail error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load WhatsApp support request.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PATCH SUPPORT CASE
// ============================================================

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: RouteContext
) {
  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

    const auth =
      await requireActiveAdmin(
        req
      );

    if (!auth.ok) {
      return auth.response;
    }

    // ========================================================
    // 2. ESCALATION ID
    // ========================================================

    const {
      id,
    } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid support request ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. BODY
    // ========================================================

    let body: {
      action?:
        | "reply"
        | "status";

      message?: string;

      status?:
        EscalationStatus;
    };

    try {
      body =
        await req.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. FIND ESCALATION
    // ========================================================

    const escalation =
      await SelfPacedMentorEscalation
        .findById(
          id
        );

    if (!escalation) {
      return NextResponse.json(
        {
          error:
            "Support request not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 5. MANUAL WHATSAPP REPLY
    // ========================================================

    if (
      body.action ===
      "reply"
    ) {
      const message =
        cleanMessage(
          body.message
        );

      if (!message) {
        return NextResponse.json(
          {
            error:
              "Reply message is required.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Keep manual support messages reasonably bounded.
       *
       * WhatsApp itself has message limits, but this also
       * prevents accidentally submitting extremely large text
       * from the admin UI.
       */
      if (
        message.length >
        4000
      ) {
        return NextResponse.json(
          {
            error:
              "Reply is too long. Please keep it below 4,000 characters.",
          },
          {
            status: 400,
          }
        );
      }

      const phone =
        String(
          escalation.phone ||
          ""
        ).trim();

      if (!phone) {
        return NextResponse.json(
          {
            error:
              "This support request does not have a WhatsApp phone number.",
          },
          {
            status: 400,
          }
        );
      }

      // ======================================================
      // SEND THROUGH META WHATSAPP
      // ======================================================

      const sendResult =
        await sendWhatsAppText(
          phone,
          message
        );

      // ======================================================
      // LOG MANUAL MESSAGE
      // ======================================================

      const now =
        new Date();

      const loggedMessage =
        await SelfPacedMentorMessage
          .create({
            selfPacedStudentId:
              escalation
                .selfPacedStudentId,

            enrollmentId:
              escalation
                .enrollmentId,

            courseId:
              escalation
                .courseId,

            direction:
              "outbound",

            type:
              "manual",

            phone,

            message,

            whatsappMessageId:
              sendResult
                .messageId,

            status:
              sendResult.success
                ? "sent"
                : "failed",

            errorMessage:
              sendResult.success
                ? undefined
                : sendResult
                    .error ||
                  "WhatsApp send failed.",

            sentAt:
              sendResult.success
                ? now
                : undefined,

            metadata: {
              purpose:
                "admin_human_support_reply",

              escalationId:
                escalation
                  ._id
                  .toString(),

              adminId:
                auth.admin
                  ._id
                  .toString(),

              adminUserId:
                String(
                  auth.admin
                    .userId ||
                  auth.token
                    .id ||
                  ""
                ),
            },
          });

      // ======================================================
      // SEND FAILED
      // ======================================================

      if (
        !sendResult.success
      ) {
        return NextResponse.json(
          {
            error:
              sendResult.error ||
              "WhatsApp message could not be sent.",

            message:
              {
                _id:
                  loggedMessage
                    ._id
                    .toString(),

                status:
                  "failed",
              },
          },
          {
            status: 502,
          }
        );
      }

      // ======================================================
      // CLAIM CASE + MARK IN PROGRESS
      // ======================================================

      escalation.assignedTo =
        auth.admin.userId as any;

      /*
       * Sending a human response means someone is actively
       * handling the escalation.
       *
       * A resolved/closed case is reopened to in_progress if an
       * admin intentionally sends another reply from the case.
       */
      escalation.status =
        "in_progress";

      escalation.humanResponse =
        message;

      escalation.resolvedAt =
        undefined;

      await escalation.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return NextResponse.json({
        success:
          true,

        message:
          "WhatsApp reply sent.",

        sentMessage: {
          _id:
            loggedMessage
              ._id
              .toString(),

          direction:
            loggedMessage
              .direction,

          type:
            loggedMessage
              .type,

          phone:
            loggedMessage
              .phone,

          message:
            loggedMessage
              .message,

          status:
            loggedMessage
              .status,

          whatsappMessageId:
            loggedMessage
              .whatsappMessageId ||
            null,

          enrollmentId:
            loggedMessage
              .enrollmentId
              ?.toString() ||
            null,

          courseId:
            loggedMessage
              .courseId
              ?.toString() ||
            null,

          errorMessage:
            loggedMessage
              .errorMessage ||
            null,

          sentAt:
            serializeDate(
              loggedMessage
                .sentAt
            ),

          deliveredAt:
            serializeDate(
              loggedMessage
                .deliveredAt
            ),

          readAt:
            serializeDate(
              loggedMessage
                .readAt
            ),

          receivedAt:
            serializeDate(
              loggedMessage
                .receivedAt
            ),

          createdAt:
            serializeDate(
              loggedMessage
                .createdAt
            ),

          metadata:
            loggedMessage
              .metadata ||
            null,
        },

        escalation:
          await buildEscalationDTO(
            escalation.toObject()
          ),
      });
    }

    // ========================================================
    // 6. CHANGE SUPPORT STATUS
    // ========================================================

    if (
      body.action ===
      "status"
    ) {
      const allowedStatuses =
        new Set<
          EscalationStatus
        >([
          "open",
          "in_progress",
          "resolved",
          "closed",
        ]);

      if (
        !body.status ||
        !allowedStatuses.has(
          body.status
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

      const newStatus =
        body.status;

      escalation.status =
        newStatus;

      // ======================================================
      // ASSIGN ACTIVE CASE TO CURRENT ADMIN
      // ======================================================

      if (
        newStatus ===
          "in_progress" ||
        newStatus ===
          "resolved"
      ) {
        escalation.assignedTo =
          auth.admin
            .userId as any;
      }

      // ======================================================
      // RESOLVED TIMESTAMP
      // ======================================================

      if (
        newStatus ===
          "resolved" ||
        newStatus ===
          "closed"
      ) {
        escalation.resolvedAt =
          new Date();
      } else {
        escalation.resolvedAt =
          undefined;
      }

      await escalation.save();

      return NextResponse.json({
        success:
          true,

        message:
          "Support status updated.",

        escalation:
          await buildEscalationDTO(
            escalation.toObject()
          ),
      });
    }

    // ========================================================
    // 7. UNKNOWN ACTION
    // ========================================================

    return NextResponse.json(
      {
        error:
          "Invalid action.",
      },
      {
        status: 400,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "Admin WhatsApp support action error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to update WhatsApp support request.",
      },
      {
        status: 500,
      }
    );
  }
}
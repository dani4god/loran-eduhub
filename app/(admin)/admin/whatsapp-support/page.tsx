// app/(admin)/admin/whatsapp-support/page.tsx

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  User,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import AdminLayout from "@/components/admin/AdminLayout";

// ============================================================
// TYPES
// ============================================================

type SupportStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

type EscalationReason =
  | "student_requested_human"
  | "ai_cannot_answer"
  | "account_issue"
  | "payment_issue"
  | "technical_issue"
  | "course_access_issue"
  | "other";

interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  registeredPhone: string;
}

interface CourseInfo {
  _id: string;
  title: string;
  category: string;
}

interface LatestMessage {
  direction: "inbound" | "outbound";
  type: string;
  message: string;
  createdAt: string | null;
}

interface Escalation {
  _id: string;

  status:
    SupportStatus;

  reason:
    EscalationReason;

  phone: string;

  studentMessage:
    string;

  aiSummary:
    string | null;

  humanResponse:
    string | null;

  createdAt:
    string | null;

  updatedAt:
    string | null;

  resolvedAt:
    string | null;

  sourceMessageId:
    string | null;

  enrollmentId:
    string | null;

  courseId:
    string | null;

  assignedTo?:
    string | null;

  student:
    StudentInfo;

  course:
    CourseInfo | null;

  latestMessage?:
    LatestMessage | null;
}

interface ConversationMessage {
  _id: string;

  direction:
    "inbound" |
    "outbound";

  type:
    string;

  phone:
    string;

  message:
    string;

  status:
    string;

  whatsappMessageId:
    string | null;

  enrollmentId:
    string | null;

  courseId:
    string | null;

  errorMessage:
    string | null;

  sentAt:
    string | null;

  deliveredAt:
    string | null;

  readAt:
    string | null;

  receivedAt:
    string | null;

  createdAt:
    string | null;

  metadata:
    Record<
      string,
      unknown
    > | null;
}

interface StatusCounts {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface ListResponse {
  escalations:
    Escalation[];

  total: number;

  page: number;

  pages: number;

  statusCounts:
    StatusCounts;

  error?: string;
}

interface DetailResponse {
  escalation:
    Escalation;

  conversation:
    ConversationMessage[];

  error?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_TABS: {
  value:
    "all" |
    SupportStatus;

  label: string;
}[] = [
  {
    value: "open",
    label: "Open",
  },
  {
    value:
      "in_progress",
    label:
      "In Progress",
  },
  {
    value:
      "resolved",
    label:
      "Resolved",
  },
  {
    value:
      "closed",
    label:
      "Closed",
  },
  {
    value:
      "all",
    label:
      "All",
  },
];

const REASON_LABELS:
  Record<
    EscalationReason,
    string
  > = {
    student_requested_human:
      "Student requested human",

    ai_cannot_answer:
      "AI could not answer",

    account_issue:
      "Account issue",

    payment_issue:
      "Payment issue",

    technical_issue:
      "Technical issue",

    course_access_issue:
      "Course access issue",

    other:
      "Other",
  };

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  value:
    string |
    null |
    undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-NG",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function formatTime(
  value:
    string |
    null |
    undefined
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-NG",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function statusLabel(
  status:
    SupportStatus
) {
  switch (status) {
    case "in_progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    case "closed":
      return "Closed";

    default:
      return "Open";
  }
}

function statusClasses(
  status:
    SupportStatus
) {
  switch (status) {
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function messageStatusIcon(
  message:
    ConversationMessage
) {
  if (
    message.direction !==
    "outbound"
  ) {
    return null;
  }

  if (
    message.status ===
    "read"
  ) {
    return (
      <CheckCheck
        size={13}
        className="text-blue-500"
      />
    );
  }

  if (
    message.status ===
    "delivered"
  ) {
    return (
      <CheckCheck
        size={13}
        className="text-slate-400"
      />
    );
  }

  if (
    message.status ===
    "failed"
  ) {
    return (
      <XCircle
        size={13}
        className="text-red-500"
      />
    );
  }

  return (
    <Check
      size={13}
      className="text-slate-400"
    />
  );
}

// ============================================================
// PAGE
// ============================================================

export default function WhatsAppSupportPage() {
  const [
    escalations,
    setEscalations,
  ] =
    useState<
      Escalation[]
    >([]);

  const [
    statusCounts,
    setStatusCounts,
  ] =
    useState<
      StatusCounts
    >({
      all: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    });

  const [
    activeStatus,
    setActiveStatus,
  ] =
    useState<
      "all" |
      SupportStatus
    >(
      "open"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    pages,
    setPages,
  ] =
    useState(1);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    selected,
    setSelected,
  ] =
    useState<
      Escalation |
      null
    >(null);

  const [
    conversation,
    setConversation,
  ] =
    useState<
      ConversationMessage[]
    >([]);

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    reply,
    setReply,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    changingStatus,
    setChangingStatus,
  ] =
    useState<
      SupportStatus |
      null
    >(null);

  const conversationEndRef =
    useRef<
      HTMLDivElement |
      null
    >(null);

  // ==========================================================
  // SEARCH DEBOUNCE
  // ==========================================================

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        400
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    search,
  ]);

  // ==========================================================
  // LOAD SUPPORT LIST
  // ==========================================================

  const loadEscalations =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (!silent) {
            setLoading(
              true
            );
          }

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            "20"
          );

          params.set(
            "status",
            activeStatus
          );

          if (
            debouncedSearch
          ) {
            params.set(
              "search",
              debouncedSearch
            );
          }

          const response =
            await fetch(
              `/api/admin/whatsapp-support?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json() as
              ListResponse;

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
              "Failed to load WhatsApp support requests."
            );
          }

          setEscalations(
            data.escalations ||
            []
          );

          setStatusCounts(
            data.statusCounts ||
            {
              all: 0,
              open: 0,
              in_progress: 0,
              resolved: 0,
              closed: 0,
            }
          );

          setPages(
            data.pages ||
            1
          );

          setTotal(
            data.total ||
            0
          );

          /*
           * Keep the selected case synchronized with the
           * refreshed list if it still appears in the current
           * filter.
           */
          if (
            selected
          ) {
            const updated =
              (
                data.escalations ||
                []
              ).find(
                (
                  item
                ) =>
                  item._id ===
                  selected._id
              );

            if (
              updated
            ) {
              setSelected(
                (
                  current
                ) =>
                  current
                    ? {
                        ...current,
                        ...updated,
                      }
                    : updated
              );
            }
          }
        } catch (
          error
        ) {
          console.error(
            error
          );

          if (!silent) {
            toast.error(
              error instanceof
                Error
                ? error.message
                : "Failed to load support requests."
            );
          }
        } finally {
          if (!silent) {
            setLoading(
              false
            );
          }
        }
      },
      [
        activeStatus,
        debouncedSearch,
        page,
        selected,
      ]
    );

  useEffect(() => {
    void loadEscalations();
  }, [
    loadEscalations,
  ]);

  // ==========================================================
  // LOAD ONE CASE
  // ==========================================================

  const openCase =
    async (
      item:
        Escalation
    ) => {
      try {
        setSelected(
          item
        );

        setConversation(
          []
        );

        setDetailLoading(
          true
        );

        const response =
          await fetch(
            `/api/admin/whatsapp-support/${item._id}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json() as
            DetailResponse;

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
            "Failed to load conversation."
          );
        }

        setSelected(
          data.escalation
        );

        setConversation(
          data.conversation ||
          []
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Failed to load conversation."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ==========================================================
  // SCROLL CHAT
  // ==========================================================

  useEffect(() => {
    if (
      !detailLoading &&
      conversation.length >
        0
    ) {
      window.setTimeout(
        () => {
          conversationEndRef
            .current
            ?.scrollIntoView({
              behavior:
                "smooth",
            });
        },
        100
      );
    }
  }, [
    conversation,
    detailLoading,
  ]);

  // ==========================================================
  // SEND HUMAN REPLY
  // ==========================================================

  const sendReply =
    async () => {
      if (
        !selected
      ) {
        return;
      }

      const cleanReply =
        reply.trim();

      if (!cleanReply) {
        toast.error(
          "Enter a reply first."
        );

        return;
      }

      if (
        cleanReply.length >
        4000
      ) {
        toast.error(
          "Reply must be below 4,000 characters."
        );

        return;
      }

      try {
        setSending(
          true
        );

        const response =
          await fetch(
            `/api/admin/whatsapp-support/${selected._id}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  action:
                    "reply",

                  message:
                    cleanReply,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
            "Failed to send WhatsApp reply."
          );
        }

        if (
          data.sentMessage
        ) {
          setConversation(
            (
              current
            ) => [
              ...current,
              data.sentMessage,
            ]
          );
        }

        if (
          data.escalation
        ) {
          setSelected(
            data.escalation
          );
        }

        setReply("");

        toast.success(
          "WhatsApp reply sent."
        );

        await loadEscalations(
          true
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Failed to send reply."
        );
      } finally {
        setSending(
          false
        );
      }
    };

  // ==========================================================
  // CHANGE CASE STATUS
  // ==========================================================

  const updateStatus =
    async (
      newStatus:
        SupportStatus
    ) => {
      if (
        !selected
      ) {
        return;
      }

      try {
        setChangingStatus(
          newStatus
        );

        const response =
          await fetch(
            `/api/admin/whatsapp-support/${selected._id}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  action:
                    "status",

                  status:
                    newStatus,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
            "Failed to update support status."
          );
        }

        if (
          data.escalation
        ) {
          setSelected(
            data.escalation
          );
        }

        toast.success(
          `Case marked ${statusLabel(
            newStatus
          ).toLowerCase()}.`
        );

        await loadEscalations(
          true
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        toast.error(
          error instanceof
            Error
            ? error.message
            : "Failed to update case."
        );
      } finally {
        setChangingStatus(
          null
        );
      }
    };

  // ==========================================================
  // KEYBOARD SEND
  // ==========================================================

  const handleReplyKeyDown =
    (
      event:
        React.KeyboardEvent<
          HTMLTextAreaElement
        >
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (
          !sending &&
          reply.trim()
        ) {
          void sendReply();
        }
      }
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50">
        {/* ===================================================
            PAGE HEADER
        ==================================================== */}

        <div className="border-b border-slate-200 bg-white">
          <div className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                    <MessageCircle className="h-5 w-5 text-emerald-700" />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      WhatsApp Mentor Support
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      Handle conversations referred by the self-paced AI mentor.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadEscalations()
                }
                disabled={
                  loading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6 lg:p-8">
          {/* =================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Open
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {
                      statusCounts.open
                    }
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    In Progress
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {
                      statusCounts.in_progress
                    }
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Resolved
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {
                      statusCounts.resolved
                    }
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {
                      statusCounts.all
                    }
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                {STATUS_TABS.map(
                  (
                    item
                  ) => {
                    const count =
                      statusCounts[
                        item.value
                      ];

                    const active =
                      activeStatus ===
                      item.value;

                    return (
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        onClick={() => {
                          setActiveStatus(
                            item.value
                          );

                          setPage(
                            1
                          );
                        }}
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {
                          item.label
                        }

                        <span
                          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                            active
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-200/70 text-slate-500"
                          }`}
                        >
                          {
                            count
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="relative w-full xl:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search student, phone, course..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch(
                        ""
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              MAIN SUPPORT AREA
          ================================================== */}

          <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[380px_minmax(0,1fr)]">
            {/* ===============================================
                CASE LIST
            ================================================ */}

            <div
              className={`border-r border-slate-200 ${
                selected
                  ? "hidden xl:block"
                  : "block"
              }`}
            >
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">
                    Support Requests
                  </p>

                  <span className="text-xs text-slate-400">
                    {
                      total
                    }{" "}
                    case
                    {
                      total ===
                      1
                        ? ""
                        : "s"
                    }
                  </span>
                </div>
              </div>

              <div className="h-[620px] overflow-y-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-red-600" />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading support requests...
                      </p>
                    </div>
                  </div>
                ) : escalations.length ===
                  0 ? (
                  <div className="flex h-full items-center justify-center px-8 text-center">
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <MessageCircle className="h-6 w-6 text-slate-400" />
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No support requests
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        There are no cases matching this filter.
                      </p>
                    </div>
                  </div>
                ) : (
                  escalations.map(
                    (
                      item
                    ) => {
                      const active =
                        selected?._id ===
                        item._id;

                      return (
                        <button
                          key={
                            item._id
                          }
                          type="button"
                          onClick={() =>
                            void openCase(
                              item
                            )
                          }
                          className={`w-full border-b border-slate-100 p-4 text-left transition ${
                            active
                              ? "bg-red-50/70"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                              {item.student.firstName
                                ?.charAt(
                                  0
                                )
                                .toUpperCase() ||
                                "S"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {
                                    item.student.name
                                  }
                                </p>

                                <span className="shrink-0 text-[10px] text-slate-400">
                                  {formatTime(
                                    item.updatedAt ||
                                      item.createdAt
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {item.course?.title ||
                                  "General support"}
                              </p>

                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                                {item.latestMessage?.message ||
                                  item.studentMessage}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClasses(
                                    item.status
                                  )}`}
                                >
                                  {statusLabel(
                                    item.status
                                  )}
                                </span>

                                <span className="truncate text-[10px] font-medium text-slate-400">
                                  {REASON_LABELS[
                                    item.reason
                                  ] ||
                                    item.reason}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )
                )}
              </div>

              {/* =============================================
                  PAGINATION
              ============================================== */}

              <div className="flex h-[59px] items-center justify-between border-t border-slate-200 px-4">
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          1,
                          current -
                            1
                        )
                    )
                  }
                  disabled={
                    page <=
                      1 ||
                    loading
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <span className="text-xs font-medium text-slate-500">
                  Page{" "}
                  {
                    page
                  }{" "}
                  of{" "}
                  {
                    pages
                  }
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.min(
                          pages,
                          current +
                            1
                        )
                    )
                  }
                  disabled={
                    page >=
                      pages ||
                    loading
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>

            {/* ===============================================
                CHAT AREA
            ================================================ */}

            <div
              className={`min-w-0 ${
                selected
                  ? "block"
                  : "hidden xl:block"
              }`}
            >
              {!selected ? (
                <div className="flex h-full min-h-[680px] items-center justify-center bg-slate-50/50 px-8 text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                      <MessageCircle className="h-7 w-7 text-emerald-700" />
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-slate-800">
                      Select a support request
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Open a case to view the student's WhatsApp conversation and respond as a human support agent.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-[680px] flex-col">
                  {/* =========================================
                      CHAT HEADER
                  ========================================== */}

                  <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(
                            null
                          );

                          setConversation(
                            []
                          );
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 xl:hidden"
                      >
                        <ChevronLeft
                          size={19}
                        />
                      </button>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {selected.student.firstName
                          ?.charAt(
                            0
                          )
                          .toUpperCase() ||
                          "S"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                            {
                              selected.student.name
                            }
                          </h2>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClasses(
                              selected.status
                            )}`}
                          >
                            {statusLabel(
                              selected.status
                            )}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone
                              size={11}
                            />

                            {
                              selected.phone
                            }
                          </span>

                          {selected.course && (
                            <span>
                              {
                                selected.course.title
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =========================================
                      CASE INFO
                  ========================================== */}

                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <UserRound
                            size={14}
                          />

                          Referral reason
                        </div>

                        <p className="mt-1.5 text-xs font-bold text-slate-800">
                          {REASON_LABELS[
                            selected.reason
                          ] ||
                            selected.reason}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Clock3
                            size={14}
                          />

                          Referred
                        </div>

                        <p className="mt-1.5 text-xs font-bold text-slate-800">
                          {formatDate(
                            selected.createdAt
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Mail
                            size={14}
                          />

                          Student email
                        </div>

                        <p className="mt-1.5 truncate text-xs font-bold text-slate-800">
                          {selected.student.email ||
                            "Not available"}
                        </p>
                      </div>
                    </div>

                    {selected.aiSummary && (
                      <div className="mt-3 flex gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5">
                        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                            AI handover summary
                          </p>

                          <p className="mt-1 text-xs leading-5 text-violet-900">
                            {
                              selected.aiSummary
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =========================================
                      CONVERSATION
                  ========================================== */}

                  <div className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-3 py-5 sm:px-6">
                    {detailLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-2xl bg-white/90 px-5 py-4 text-center shadow-sm">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />

                          <p className="mt-2 text-xs text-slate-500">
                            Loading conversation...
                          </p>
                        </div>
                      </div>
                    ) : conversation.length ===
                      0 ? (
                      <div className="flex h-full items-center justify-center text-center">
                        <div className="rounded-2xl bg-white/90 px-6 py-5 shadow-sm">
                          <MessageCircle className="mx-auto h-6 w-6 text-slate-400" />

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            No messages found
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-4xl space-y-2">
                        {conversation.map(
                          (
                            message
                          ) => {
                            const outbound =
                              message.direction ===
                              "outbound";

                            const human =
                              message.type ===
                              "manual";

                            return (
                              <div
                                key={
                                  message._id
                                }
                                className={`flex ${
                                  outbound
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm sm:max-w-[72%] ${
                                    outbound
                                      ? human
                                        ? "bg-[#d9fdd3]"
                                        : "bg-[#e7f7ff]"
                                      : "bg-white"
                                  }`}
                                >
                                  {outbound && (
                                    <div className="mb-1 flex items-center gap-1">
                                      {human ? (
                                        <User
                                          size={11}
                                          className="text-emerald-700"
                                        />
                                      ) : (
                                        <Bot
                                          size={11}
                                          className="text-blue-600"
                                        />
                                      )}

                                      <span
                                        className={`text-[9px] font-bold uppercase tracking-wider ${
                                          human
                                            ? "text-emerald-700"
                                            : "text-blue-600"
                                        }`}
                                      >
                                        {human
                                          ? "Human Support"
                                          : "AI Mentor"}
                                      </span>
                                    </div>
                                  )}

                                  <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-800">
                                    {
                                      message.message
                                    }
                                  </p>

                                  <div className="mt-1 flex items-center justify-end gap-1">
                                    <span className="text-[9px] text-slate-400">
                                      {formatTime(
                                        message.createdAt
                                      )}
                                    </span>

                                    {messageStatusIcon(
                                      message
                                    )}
                                  </div>

                                  {message.status ===
                                    "failed" &&
                                    message.errorMessage && (
                                      <p className="mt-1 text-[10px] text-red-600">
                                        {
                                          message.errorMessage
                                        }
                                      </p>
                                    )}
                                </div>
                              </div>
                            );
                          }
                        )}

                        <div
                          ref={
                            conversationEndRef
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* =========================================
                      ACTIONS + REPLY
                  ========================================== */}

                  <div className="border-t border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                      {selected.status !==
                        "in_progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              "in_progress"
                            )
                          }
                          disabled={
                            changingStatus !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          {changingStatus ===
                          "in_progress" ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Clock3
                              size={13}
                            />
                          )}

                          Mark In Progress
                        </button>
                      )}

                      {selected.status !==
                        "resolved" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              "resolved"
                            )
                          }
                          disabled={
                            changingStatus !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {changingStatus ===
                          "resolved" ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={13}
                            />
                          )}

                          Resolve
                        </button>
                      )}

                      {selected.status !==
                        "closed" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              "closed"
                            )
                          }
                          disabled={
                            changingStatus !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          {changingStatus ===
                          "closed" ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Circle
                              size={13}
                            />
                          )}

                          Close Case
                        </button>
                      )}

                      {(selected.status ===
                        "resolved" ||
                        selected.status ===
                          "closed") && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              "open"
                            )
                          }
                          disabled={
                            changingStatus !==
                            null
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {changingStatus ===
                          "open" ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <AlertCircle
                              size={13}
                            />
                          )}

                          Reopen
                        </button>
                      )}
                    </div>

                    <div className="flex items-end gap-2 p-3 sm:p-4">
                      <textarea
                        value={
                          reply
                        }
                        onChange={(
                          event
                        ) =>
                          setReply(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={
                          handleReplyKeyDown
                        }
                        rows={2}
                        maxLength={
                          4000
                        }
                        placeholder="Type a WhatsApp reply... Press Enter to send, Shift + Enter for a new line."
                        className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void sendReply()
                        }
                        disabled={
                          sending ||
                          !reply.trim()
                        }
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Send WhatsApp reply"
                      >
                        {sending ? (
                          <Loader2
                            size={19}
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            size={18}
                          />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between px-4 pb-3 text-[10px] text-slate-400">
                      <span>
                        Replying to{" "}
                        {
                          selected.phone
                        }
                      </span>

                      <span>
                        {
                          reply.length
                        }
                        /4000
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
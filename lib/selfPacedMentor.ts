// lib/selfPacedMentor.ts

import mongoose from 'mongoose'

import SelfPacedEnrollment, {
  ISelfPacedEnrollment,
  IPageProgress,
  IWeekProgress,
} from '@/models/SelfPacedEnrollment'

import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedMentorPreference from '@/models/SelfPacedMentorPreference'
import SelfPacedMentorState, {
  MentorAction,
} from '@/models/SelfPacedMentorState'

// ============================================================
// CONSTANTS
// ============================================================

export const MENTOR_MIN_HOURS_BETWEEN_MESSAGES = 24

export const MENTOR_MAX_AUTOMATED_MESSAGES_PER_7_DAYS = 3

export const MENTOR_INITIAL_CHECKIN_HOURS = 48

export const MENTOR_INACTIVITY_DAYS = 3

export const MENTOR_FEEDBACK_PROGRESS_PERCENT = 50

/**
 * The scheduler can run hourly.
 *
 * A message is considered due when the current local time is
 * within this many minutes of the student's preferred time.
 */
export const MENTOR_PREFERRED_TIME_WINDOW_MINUTES = 60

// ============================================================
// TYPES
// ============================================================

export type MentorDecisionAction =
  | 'welcome'
  | 'study_checkin'
  | 'inactivity'
  | 'week_passed'
  | 'assessment_support'
  | 'feedback_request'
  | 'completion'

export interface MentorDecisionMetadata {
  lastActivityAt?: string

  examPercentage?: number
  attemptsUsed?: number

  assessmentWeek?: number
  celebratedWeek?: number

  progressPercentage?: number

  completedWeeks?: number
  totalWeeks?: number

  latestPageId?: string
  latestPageTitle?: string
}

export interface MentorDecision {
  action: MentorDecisionAction

  selfPacedStudentId: string
  enrollmentId: string
  courseId: string

  phone: string

  firstName: string
  courseTitle: string

  currentWeek: number

  reason: string

  templateName: string

  templateValues: string[]

  metadata: MentorDecisionMetadata
}

export interface MentorEvaluationResult {
  decision: MentorDecision | null
  reason?: string
}

// ============================================================
// INTERNAL TYPES
// ============================================================

interface CoursePageLike {
  _id?: mongoose.Types.ObjectId
  title?: string
}

interface CourseWeekLike {
  weekNumber?: number
  title?: string
  pages?: CoursePageLike[]
}

interface CourseLike {
  _id: mongoose.Types.ObjectId
  title: string
  weeks?: CourseWeekLike[]
}

interface StudentLike {
  _id: mongoose.Types.ObjectId
  firstName?: string
}

// ============================================================
// DATE HELPERS
// ============================================================

function hoursBetween(
  earlier: Date,
  later: Date
): number {
  return (
    later.getTime() -
    earlier.getTime()
  ) / 3_600_000
}

function daysBetween(
  earlier: Date,
  later: Date
): number {
  return (
    later.getTime() -
    earlier.getTime()
  ) / 86_400_000
}

// ============================================================
// WEEK HELPERS
// ============================================================

function getPassedWeekNumbers(
  enrollment: ISelfPacedEnrollment
): number[] {
  return enrollment.weekProgress
    .filter(
      (progress) =>
        progress.passed
    )
    .map(
      (progress) =>
        progress.weekNumber
    )
}

// ============================================================
// CURRENT WEEK
// ============================================================

function getCurrentWeekNumber(
  enrollment: ISelfPacedEnrollment,
  totalWeeks: number
): number {
  if (totalWeeks <= 0) {
    return 1
  }

  const passedWeeks =
    new Set(
      getPassedWeekNumbers(
        enrollment
      )
    )

  for (
    let weekNumber = 1;
    weekNumber <= totalWeeks;
    weekNumber++
  ) {
    if (
      !passedWeeks.has(
        weekNumber
      )
    ) {
      return weekNumber
    }
  }

  return totalWeeks
}

// ============================================================
// LATEST WEEK PROGRESS
// ============================================================

function getLatestWeekProgress(
  enrollment: ISelfPacedEnrollment
): IWeekProgress | null {
  if (
    enrollment.weekProgress.length ===
    0
  ) {
    return null
  }

  return [
    ...enrollment.weekProgress,
  ].sort(
    (a, b) =>
      new Date(
        b.attemptedAt
      ).getTime() -
      new Date(
        a.attemptedAt
      ).getTime()
  )[0]
}

// ============================================================
// LATEST PAGE PROGRESS
// ============================================================

function getLatestPageProgress(
  enrollment: ISelfPacedEnrollment
): IPageProgress | null {
  if (
    enrollment.pageProgress.length ===
    0
  ) {
    return null
  }

  return [
    ...enrollment.pageProgress,
  ].sort(
    (a, b) =>
      new Date(
        b.lastViewedAt
      ).getTime() -
      new Date(
        a.lastViewedAt
      ).getTime()
  )[0]
}

// ============================================================
// COMPLETED PAGE COUNT
// ============================================================

function getCompletedPageCount(
  enrollment: ISelfPacedEnrollment
): number {
  return enrollment.pageProgress.filter(
    (page) => page.completed
  ).length
}

// ============================================================
// COURSE TOTAL PAGE COUNT
// ============================================================

function getCourseTotalPageCount(
  course: CourseLike
): number {
  return (
    course.weeks?.reduce(
      (
        total,
        week
      ) =>
        total +
        (
          week.pages?.length ||
          0
        ),
      0
    ) || 0
  )
}

// ============================================================
// COURSE PROGRESS PERCENTAGE
// ============================================================

function getCourseProgressPercentage(
  enrollment: ISelfPacedEnrollment,
  course: CourseLike
): number {
  const totalPages =
    getCourseTotalPageCount(
      course
    )

  if (totalPages <= 0) {
    return 0
  }

  const completedPages =
    getCompletedPageCount(
      enrollment
    )

  const percentage =
    Math.round(
      (
        completedPages /
        totalPages
      ) * 100
    )

  return Math.max(
    0,
    Math.min(
      100,
      percentage
    )
  )
}

// ============================================================
// FIND PAGE TITLE
// ============================================================

function findPageTitle(
  course: CourseLike,
  pageId?: mongoose.Types.ObjectId
): string | undefined {
  if (!pageId) {
    return undefined
  }

  const targetId =
    pageId.toString()

  for (
    const week of
    course.weeks || []
  ) {
    for (
      const page of
      week.pages || []
    ) {
      if (
        page._id?.toString() ===
        targetId
      ) {
        return page.title
      }
    }
  }

  return undefined
}

// ============================================================
// MESSAGE COOLDOWN
// ============================================================

function isInsideMessageCooldown(
  lastMentorMessageAt:
    | Date
    | undefined,
  now: Date
): boolean {
  if (!lastMentorMessageAt) {
    return false
  }

  return (
    hoursBetween(
      new Date(
        lastMentorMessageAt
      ),
      now
    ) <
    MENTOR_MIN_HOURS_BETWEEN_MESSAGES
  )
}

// ============================================================
// 7-DAY MESSAGE WINDOW
// ============================================================

function getMessageWindowState(
  state: {
    automatedMessagesLast7Days:
      number

    messageWindowStartedAt?:
      Date
  },
  now: Date
): {
  count: number
  windowStartedAt: Date
} {
  if (
    !state.messageWindowStartedAt
  ) {
    return {
      count: 0,
      windowStartedAt: now,
    }
  }

  const windowStartedAt =
    new Date(
      state.messageWindowStartedAt
    )

  const ageDays =
    daysBetween(
      windowStartedAt,
      now
    )

  if (
    ageDays >= 7 ||
    ageDays < 0
  ) {
    return {
      count: 0,
      windowStartedAt: now,
    }
  }

  return {
    count:
      state
        .automatedMessagesLast7Days ||
      0,

    windowStartedAt,
  }
}

// ============================================================
// PREFERRED TIME
// ============================================================

function isNearPreferredTime(
  preferredTime: string,
  timezone: string,
  now: Date
): boolean {
  try {
    const [
      preferredHour,
      preferredMinute,
    ] =
      preferredTime
        .split(':')
        .map(Number)

    if (
      !Number.isInteger(
        preferredHour
      ) ||
      !Number.isInteger(
        preferredMinute
      ) ||
      preferredHour < 0 ||
      preferredHour > 23 ||
      preferredMinute < 0 ||
      preferredMinute > 59
    ) {
      return false
    }

    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          hourCycle: 'h23',
        }
      ).formatToParts(
        now
      )

    const hourPart =
      parts.find(
        (part) =>
          part.type === 'hour'
      )

    const minutePart =
      parts.find(
        (part) =>
          part.type === 'minute'
      )

    if (
      !hourPart ||
      !minutePart
    ) {
      return false
    }

    const currentHour =
      Number(
        hourPart.value
      )

    const currentMinute =
      Number(
        minutePart.value
      )

    if (
      !Number.isFinite(
        currentHour
      ) ||
      !Number.isFinite(
        currentMinute
      )
    ) {
      return false
    }

    const currentMinutes =
      currentHour * 60 +
      currentMinute

    const targetMinutes =
      preferredHour * 60 +
      preferredMinute

    const directDifference =
      Math.abs(
        currentMinutes -
        targetMinutes
      )

    /*
     * Handles times that cross midnight.
     *
     * Example:
     * 23:50 and 00:10 should be treated as 20 minutes
     * apart rather than 1,420 minutes apart.
     */
    const wrappedDifference =
      Math.min(
        directDifference,
        1440 -
          directDifference
      )

    return (
      wrappedDifference <
      MENTOR_PREFERRED_TIME_WINDOW_MINUTES
    )
  } catch {
    return false
  }
}

// ============================================================
// CREATE DECISION
// ============================================================

function createDecision({
  action,
  student,
  enrollment,
  course,
  phone,
  currentWeek,
  reason,
  templateName,
  templateValues,
  metadata = {},
}: {
  action: MentorDecisionAction

  student: StudentLike

  enrollment:
    ISelfPacedEnrollment

  course: CourseLike

  phone: string

  currentWeek: number

  reason: string

  templateName: string

  templateValues: string[]

  metadata?:
    MentorDecisionMetadata
}): MentorDecision {
  return {
    action,

    selfPacedStudentId:
      student._id.toString(),

    enrollmentId:
      enrollment._id.toString(),

    courseId:
      enrollment.courseId.toString(),

    phone,

    firstName:
      student.firstName ||
      'Student',

    courseTitle:
      course.title,

    currentWeek,

    reason,

    templateName,

    templateValues,

    metadata,
  }
}

// ============================================================
// MAIN DECISION ENGINE
// ============================================================

export async function determineMentorAction(
  enrollmentId:
    | string
    | mongoose.Types.ObjectId,
  now = new Date()
): Promise<MentorEvaluationResult> {
  // ----------------------------------------------------------
  // ENROLLMENT
  // ----------------------------------------------------------

  const enrollment =
    await SelfPacedEnrollment.findById(
      enrollmentId
    )

  if (!enrollment) {
    return {
      decision: null,
      reason:
        'Enrollment not found.',
    }
  }

  // ----------------------------------------------------------
  // LOCKED ENROLLMENT
  // ----------------------------------------------------------

  if (enrollment.locked) {
    return {
      decision: null,
      reason:
        'Enrollment is locked.',
    }
  }

  // ----------------------------------------------------------
  // STUDENT
  // ----------------------------------------------------------

  const student =
    await SelfPacedStudent.findById(
      enrollment.selfPacedStudentId
    )

  if (!student) {
    return {
      decision: null,
      reason:
        'Student not found.',
    }
  }

  // ----------------------------------------------------------
  // COURSE
  // ----------------------------------------------------------

  const course =
    await SelfPacedCourse.findById(
      enrollment.courseId
    )

  if (!course) {
    return {
      decision: null,
      reason:
        'Course not found.',
    }
  }

  // ----------------------------------------------------------
  // MENTOR PREFERENCE
  // ----------------------------------------------------------

  const preference =
    await SelfPacedMentorPreference.findOne({
      selfPacedStudentId:
        student._id,
    })

  if (!preference) {
    return {
      decision: null,
      reason:
        'Student has not configured WhatsApp mentoring.',
    }
  }

  if (
    !preference.enabled ||
    !preference.consentGiven
  ) {
    return {
      decision: null,
      reason:
        'WhatsApp mentoring is disabled.',
    }
  }

  if (
    !preference.whatsappPhone
  ) {
    return {
      decision: null,
      reason:
        'No WhatsApp number configured.',
    }
  }

  // ----------------------------------------------------------
  // MENTOR STATE
  // ----------------------------------------------------------

  let state =
    await SelfPacedMentorState.findOne({
      enrollmentId:
        enrollment._id,
    })

  if (!state) {
    /*
     * Creating the state itself is safe during evaluation.
     *
     * We are NOT marking any mentor event as sent here.
     */
    state =
      await SelfPacedMentorState.create({
        selfPacedStudentId:
          student._id,

        enrollmentId:
          enrollment._id,

        courseId:
          course._id,

        status:
          enrollment.completedAt
            ? 'completed'
            : 'active',

        currentWeek: 1,

        automatedMessagesLast7Days:
          0,

        welcomeSent:
          false,

        completionMessageSent:
          false,

        feedbackRequested:
          false,
      })
  }

  // ----------------------------------------------------------
  // PAUSED STATE
  // ----------------------------------------------------------

  if (
    state.status === 'paused'
  ) {
    return {
      decision: null,
      reason:
        'Mentoring is paused for this course.',
    }
  }

  // ----------------------------------------------------------
  // COURSE INFORMATION
  // ----------------------------------------------------------

  const typedCourse =
    course as unknown as CourseLike

  const typedStudent =
    student as unknown as StudentLike

  const totalWeeks =
    typedCourse.weeks?.length ||
    0

  const currentWeek =
    getCurrentWeekNumber(
      enrollment,
      totalWeeks
    )

  const passedWeekNumbers =
    getPassedWeekNumbers(
      enrollment
    )

  const completedWeeks =
    passedWeekNumbers.length

  const latestWeekProgress =
    getLatestWeekProgress(
      enrollment
    )

  const latestPageProgress =
    getLatestPageProgress(
      enrollment
    )

  const progressPercentage =
    getCourseProgressPercentage(
      enrollment,
      typedCourse
    )

  const latestPageTitle =
    findPageTitle(
      typedCourse,
      latestPageProgress?.pageId
    )

  // ----------------------------------------------------------
  // SNAPSHOT METADATA
  // ----------------------------------------------------------

  const commonMetadata:
    MentorDecisionMetadata = {
      progressPercentage,

      completedWeeks,

      totalWeeks,
  }

  if (
    enrollment.lastActivityAt
  ) {
    commonMetadata.lastActivityAt =
      new Date(
        enrollment.lastActivityAt
      ).toISOString()
  }

  if (
    latestPageProgress
  ) {
    commonMetadata.latestPageId =
      latestPageProgress
        .pageId
        .toString()

    if (latestPageTitle) {
      commonMetadata.latestPageTitle =
        latestPageTitle
    }
  }

  // ----------------------------------------------------------
  // MESSAGE WINDOW SNAPSHOT
  // ----------------------------------------------------------

  /*
   * This does not mutate the state.
   *
   * The actual message counter/window is only updated
   * after WhatsApp successfully accepts the message.
   */
  const messageWindow =
    getMessageWindowState(
      state,
      now
    )

  // ----------------------------------------------------------
  // COMPLETION
  // ----------------------------------------------------------

  /*
   * Completion is a one-time milestone and has the highest
   * priority.
   *
   * We return the decision without setting
   * completionMessageSent.
   *
   * recordMentorActionSent() does that only after the
   * WhatsApp send succeeds.
   */
  if (
    enrollment.completedAt &&
    !state.completionMessageSent &&
    preference.progressMessages
  ) {
    return {
      decision:
        createDecision({
          action:
            'completion',

          student:
            typedStudent,

          enrollment,

          course:
            typedCourse,

          phone:
            preference.whatsappPhone,

          currentWeek,

          reason:
            'Student completed the course.',

          templateName:
            'loran_course_completed',

          templateValues: [
            typedStudent.firstName ||
              'Student',

            typedCourse.title,
          ],

          metadata: {
            ...commonMetadata,

            progressPercentage:
              100,
          },
        }),
    }
  }

  // ----------------------------------------------------------
  // WELCOME
  // ----------------------------------------------------------

  /*
   * Welcome is also one-time.
   *
   * It is intentionally evaluated before the normal
   * preferred-time/cooldown checks so a newly opted-in
   * student can receive the initial course welcome.
   *
   * The sender may still choose when to dispatch it.
   */
  if (
    !state.welcomeSent
  ) {
    return {
      decision:
        createDecision({
          action:
            'welcome',

          student:
            typedStudent,

          enrollment,

          course:
            typedCourse,

          phone:
            preference.whatsappPhone,

          currentWeek,

          reason:
            'Student has enabled mentoring and has not received the course welcome message.',

          templateName:
            'loran_course_welcome',

          templateValues: [
            typedStudent.firstName ||
              'Student',

            typedCourse.title,
          ],

          metadata:
            commonMetadata,
        }),
    }
  }

  // ----------------------------------------------------------
  // WEEKLY MESSAGE LIMIT
  // ----------------------------------------------------------

  if (
    messageWindow.count >=
    MENTOR_MAX_AUTOMATED_MESSAGES_PER_7_DAYS
  ) {
    return {
      decision: null,
      reason:
        'Weekly automated-message limit reached.',
    }
  }

  // ----------------------------------------------------------
  // COOLDOWN
  // ----------------------------------------------------------

  if (
    isInsideMessageCooldown(
      state.lastMentorMessageAt,
      now
    )
  ) {
    return {
      decision: null,
      reason:
        'Mentor message cooldown is active.',
    }
  }

  // ----------------------------------------------------------
  // PREFERRED TIME
  // ----------------------------------------------------------

  if (
    !isNearPreferredTime(
      preference.preferredTime,
      preference.timezone,
      now
    )
  ) {
    return {
      decision: null,
      reason:
        'Outside the student preferred messaging window.',
    }
  }

  // ----------------------------------------------------------
  // FAILED ASSESSMENT SUPPORT
  // ----------------------------------------------------------

  if (
    preference.assessmentSupport &&
    latestWeekProgress &&
    !latestWeekProgress.passed
  ) {
    /*
     * An assessment event is identified by:
     *
     * weekNumber + attemptsUsed
     *
     * Example:
     *
     * Week 3 attempt 1 failed
     * -> support sent
     *
     * Week 3 attempt 1 still latest
     * -> do not send again
     *
     * Week 3 attempt 2 failed
     * -> new event, support can be sent
     */
    const alreadyHandled =
      state.lastHandledAssessmentWeek ===
        latestWeekProgress.weekNumber &&
      state.lastHandledAssessmentAttempts ===
        latestWeekProgress.attemptsUsed

    if (!alreadyHandled) {
      return {
        decision:
          createDecision({
            action:
              'assessment_support',

            student:
              typedStudent,

            enrollment,

            course:
              typedCourse,

            phone:
              preference.whatsappPhone,

            currentWeek:
              latestWeekProgress.weekNumber,

            reason:
              `Student did not pass Week ${latestWeekProgress.weekNumber}.`,

            templateName:
              'loran_assessment_support',

            templateValues: [
              typedStudent.firstName ||
                'Student',

              typedCourse.title,

              String(
                latestWeekProgress.weekNumber
              ),

              String(
                Math.round(
                  latestWeekProgress.examPercentage
                )
              ),
            ],

            metadata: {
              ...commonMetadata,

              assessmentWeek:
                latestWeekProgress.weekNumber,

              examPercentage:
                latestWeekProgress.examPercentage,

              attemptsUsed:
                latestWeekProgress.attemptsUsed,
            },
          }),
      }
    }
  }

  // ----------------------------------------------------------
  // INACTIVITY
  // ----------------------------------------------------------

  if (
    preference.studyReminders &&
    enrollment.lastActivityAt
  ) {
    const lastActivityAt =
      new Date(
        enrollment.lastActivityAt
      )

    const inactiveDays =
      daysBetween(
        lastActivityAt,
        now
      )

    if (
      inactiveDays >=
      MENTOR_INACTIVITY_DAYS
    ) {
      /*
       * If the last mentor action was already an inactivity
       * reminder, only send another inactivity intervention
       * after the student has returned and generated newer
       * learning activity.
       */
      const activityAfterLastMessage =
        !state.lastMentorMessageAt ||
        lastActivityAt.getTime() >
          new Date(
            state.lastMentorMessageAt
          ).getTime()

      const alreadySentForCurrentInactivity =
        state.lastAction ===
          'inactivity' &&
        !activityAfterLastMessage

      if (
        !alreadySentForCurrentInactivity
      ) {
        return {
          decision:
            createDecision({
              action:
                'inactivity',

              student:
                typedStudent,

              enrollment,

              course:
                typedCourse,

              phone:
                preference.whatsappPhone,

              currentWeek,

              reason:
                `No meaningful course activity for ${Math.floor(
                  inactiveDays
                )} days.`,

              templateName:
                'loran_inactivity_reminder',

              templateValues: [
                typedStudent.firstName ||
                  'Student',

                typedCourse.title,

                String(
                  currentWeek
                ),
              ],

              metadata:
                commonMetadata,
            }),
        }
      }
    }
  }

  // ----------------------------------------------------------
  // WEEK PASSED
  // ----------------------------------------------------------

  if (
    preference.progressMessages &&
    latestWeekProgress?.passed
  ) {
    const passedWeek =
      latestWeekProgress.weekNumber

    const alreadyCelebrated =
      state.lastCelebratedWeek ===
      passedWeek

    if (
      !alreadyCelebrated
    ) {
      return {
        decision:
          createDecision({
            action:
              'week_passed',

            student:
              typedStudent,

            enrollment,

            course:
              typedCourse,

            phone:
              preference.whatsappPhone,

            /*
             * The action concerns the week that was passed,
             * not the newly unlocked next week.
             */
            currentWeek:
              passedWeek,

            reason:
              `Student passed Week ${passedWeek}.`,

            templateName:
              'loran_week_completed',

            templateValues: [
              typedStudent.firstName ||
                'Student',

              typedCourse.title,

              String(
                passedWeek
              ),

              String(
                Math.round(
                  latestWeekProgress.examPercentage
                )
              ),
            ],

            metadata: {
              ...commonMetadata,

              celebratedWeek:
                passedWeek,

              examPercentage:
                latestWeekProgress.examPercentage,

              attemptsUsed:
                latestWeekProgress.attemptsUsed,
            },
          }),
      }
    }
  }

  // ----------------------------------------------------------
  // MID-COURSE FEEDBACK
  // ----------------------------------------------------------

  if (
    preference.feedbackRequests &&
    !state.feedbackRequested &&
    progressPercentage >=
      MENTOR_FEEDBACK_PROGRESS_PERCENT &&
    progressPercentage < 100
  ) {
    return {
      decision:
        createDecision({
          action:
            'feedback_request',

          student:
            typedStudent,

          enrollment,

          course:
            typedCourse,

          phone:
            preference.whatsappPhone,

          currentWeek,

          reason:
            'Student has reached the mid-course feedback milestone.',

          templateName:
            'loran_course_feedback',

          templateValues: [
            typedStudent.firstName ||
              'Student',

            typedCourse.title,
          ],

          metadata:
            commonMetadata,
        }),
    }
  }

  // ----------------------------------------------------------
  // INITIAL STUDY CHECK-IN
  // ----------------------------------------------------------

  if (
    preference.studyReminders &&
    enrollment.createdAt
  ) {
    const enrollmentAgeHours =
      hoursBetween(
        new Date(
          enrollment.createdAt
        ),
        now
      )

    const noRealProgress =
      enrollment.pageProgress.length ===
        0 &&
      enrollment.weekProgress.length ===
        0

    /*
     * Once study_checkin is successfully sent,
     * lastAction becomes study_checkin.
     *
     * If sending fails, recordMentorActionSent() is not
     * called, so this intervention remains eligible for a
     * later retry.
     */
    const alreadyCheckedIn =
      state.lastAction ===
      'study_checkin'

    if (
      enrollmentAgeHours >=
        MENTOR_INITIAL_CHECKIN_HOURS &&
      noRealProgress &&
      !alreadyCheckedIn
    ) {
      return {
        decision:
          createDecision({
            action:
              'study_checkin',

            student:
              typedStudent,

            enrollment,

            course:
              typedCourse,

            phone:
              preference.whatsappPhone,

            currentWeek,

            reason:
              'Student has not started meaningful course activity after the initial enrollment period.',

            templateName:
              'loran_study_checkin',

            templateValues: [
              typedStudent.firstName ||
                'Student',

              typedCourse.title,

              String(
                currentWeek
              ),
            ],

            metadata:
              commonMetadata,
          }),
      }
    }
  }

  // ----------------------------------------------------------
  // NOTHING TO SEND
  // ----------------------------------------------------------

  return {
    decision: null,
    reason:
      'No mentoring intervention is currently required.',
  }
}

// ============================================================
// RECORD SUCCESSFUL MENTOR ACTION
// ============================================================

export async function recordMentorActionSent(
  decision: MentorDecision,
  sentAt = new Date()
): Promise<void> {
  const state =
    await SelfPacedMentorState.findOne({
      enrollmentId:
        decision.enrollmentId,
    })

  if (!state) {
    throw new Error(
      'Mentor state not found.'
    )
  }

  // ----------------------------------------------------------
  // MESSAGE WINDOW
  // ----------------------------------------------------------

  const messageWindow =
    getMessageWindowState(
      state,
      sentAt
    )

  state.messageWindowStartedAt =
    messageWindow.windowStartedAt

  state.automatedMessagesLast7Days =
    messageWindow.count + 1

  // ----------------------------------------------------------
  // GENERAL MESSAGE STATE
  // ----------------------------------------------------------

  state.lastMentorMessageAt =
    sentAt

  state.lastAction =
    decision.action as MentorAction

  /*
   * For week_passed, decision.currentWeek is intentionally
   * the week that was completed.
   *
   * For all other actions it represents the relevant
   * current/intervention week.
   */
  state.currentWeek =
    Math.max(
      1,
      decision.currentWeek
    )

  // ----------------------------------------------------------
  // COURSE CONTEXT SNAPSHOT
  // ----------------------------------------------------------

  if (
    decision.metadata
      .latestPageId &&
    mongoose.Types.ObjectId.isValid(
      decision.metadata
        .latestPageId
    )
  ) {
    state.lastKnownPageId =
      new mongoose.Types.ObjectId(
        decision.metadata
          .latestPageId
      )
  }

  if (
    decision.metadata
      .latestPageTitle
  ) {
    state.lastKnownPageTitle =
      decision.metadata
        .latestPageTitle
  }

  if (
    decision.metadata
      .examPercentage !==
    undefined
  ) {
    state.lastKnownExamPercentage =
      decision.metadata
        .examPercentage
  }

  if (
    decision.metadata
      .attemptsUsed !==
    undefined
  ) {
    state.lastKnownAttemptsUsed =
      decision.metadata
        .attemptsUsed
  }

  // ----------------------------------------------------------
  // WELCOME
  // ----------------------------------------------------------

  if (
    decision.action ===
    'welcome'
  ) {
    state.welcomeSent =
      true
  }

  // ----------------------------------------------------------
  // ASSESSMENT EVENT
  // ----------------------------------------------------------

  if (
    decision.action ===
    'assessment_support'
  ) {
    state.lastHandledAssessmentWeek =
      decision.metadata
        .assessmentWeek ??
      decision.currentWeek

    if (
      decision.metadata
        .attemptsUsed !==
      undefined
    ) {
      state.lastHandledAssessmentAttempts =
        decision.metadata
          .attemptsUsed
    }
  }

  // ----------------------------------------------------------
  // WEEK CELEBRATION
  // ----------------------------------------------------------

  if (
    decision.action ===
    'week_passed'
  ) {
    state.lastCelebratedWeek =
      decision.metadata
        .celebratedWeek ??
      decision.currentWeek
  }

  // ----------------------------------------------------------
  // FEEDBACK
  // ----------------------------------------------------------

  if (
    decision.action ===
    'feedback_request'
  ) {
    state.feedbackRequested =
      true
  }

  // ----------------------------------------------------------
  // COMPLETION
  // ----------------------------------------------------------

  if (
    decision.action ===
    'completion'
  ) {
    state.completionMessageSent =
      true

    state.status =
      'completed'
  }

  // ----------------------------------------------------------
  // NEXT CHECK
  // ----------------------------------------------------------

  /*
   * This value is informational/useful for future optimized
   * queries. The cron job may still scan eligible enrollments.
   */
  state.nextMentorCheckAt =
    new Date(
      sentAt.getTime() +
        MENTOR_MIN_HOURS_BETWEEN_MESSAGES *
          60 *
          60 *
          1000
    )

  await state.save()
}

// ============================================================
// RECORD OBSERVED COURSE CONTEXT
// ============================================================

/**
 * This helper updates the mentor's understanding of the
 * student's course position without recording any message as
 * sent.
 *
 * It is deliberately separate from determineMentorAction()
 * so evaluation itself does not mutate milestone flags.
 */
export async function syncMentorCourseContext(
  enrollmentId:
    | string
    | mongoose.Types.ObjectId
): Promise<void> {
  const enrollment =
    await SelfPacedEnrollment.findById(
      enrollmentId
    )

  if (!enrollment) {
    return
  }

  const state =
    await SelfPacedMentorState.findOne({
      enrollmentId:
        enrollment._id,
    })

  if (!state) {
    return
  }

  const course =
    await SelfPacedCourse.findById(
      enrollment.courseId
    )

  if (!course) {
    return
  }

  const typedCourse =
    course as unknown as CourseLike

  const totalWeeks =
    typedCourse.weeks?.length ||
    0

  const currentWeek =
    getCurrentWeekNumber(
      enrollment,
      totalWeeks
    )

  const latestPageProgress =
    getLatestPageProgress(
      enrollment
    )

  const latestWeekProgress =
    getLatestWeekProgress(
      enrollment
    )

  state.currentWeek =
    currentWeek

  if (
    latestPageProgress
  ) {
    state.lastKnownPageId =
      latestPageProgress.pageId

    const pageTitle =
      findPageTitle(
        typedCourse,
        latestPageProgress.pageId
      )

    if (pageTitle) {
      state.lastKnownPageTitle =
        pageTitle
    }
  }

  if (
    latestWeekProgress
  ) {
    state.lastKnownExamPercentage =
      latestWeekProgress.examPercentage

    state.lastKnownAttemptsUsed =
      latestWeekProgress.attemptsUsed
  }

  if (
    enrollment.completedAt &&
    state.completionMessageSent
  ) {
    state.status =
      'completed'
  }

  await state.save()
}

// ============================================================
// GET ELIGIBLE ENROLLMENTS
// ============================================================

export async function getMentorEligibleEnrollments() {
  /*
   * Completed enrollments are deliberately included.
   *
   * A completed enrollment may still need its one-time
   * completion WhatsApp message.
   *
   * Locked enrollments are excluded because mentoring should
   * not encourage students to continue a course they cannot
   * currently access.
   */
  return SelfPacedEnrollment.find({
    locked: false,
  })
    .select(
      [
        '_id',
        'selfPacedStudentId',
        'courseId',
        'lastActivityAt',
        'completedAt',
        'createdAt',
      ].join(' ')
    )
    .lean()
}
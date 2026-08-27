// app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import CoachingBooking from '@/models/CoachingBooking'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'
import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'
import Payment from '@/models/Payment'
import Enrollment from '@/models/Enrollment'
import { addDays } from 'date-fns'
import { PLAN_DURATIONS, PlanType } from '@/lib/constants'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    const expectedSig = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSig) {
      console.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log(`Paystack webhook received: ${event.event}`)

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true })
    }

    await connectDB()

    const reference = event.data.reference
    const metadata = event.data.metadata || {}
    const amountPaid = event.data.amount / 100

    // ── 1. Self-paced course purchase (new account OR add-on) ──
    if (metadata.type === 'self_paced_purchase' || metadata.type === 'self_paced_course') {
      const { courseId, firstName, lastName, email, phone, password } = metadata

      if (!courseId || !email) {
        console.error('Missing required metadata for self-paced purchase', { metadata })
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
      }

      let user = await User.findOne({ email: email.toLowerCase().trim() })
      let student

      if (user) {
        student = await SelfPacedStudent.findOne({ userId: user._id })
      } else {
        if (!password) {
          console.error('Password required for new self-paced student')
          return NextResponse.json({ error: 'Password required' }, { status: 400 })
        }
        user = await User.create({
          email: email.toLowerCase().trim(),
          password,
          role: 'selfpaced_student',
          isActive: true,
        })
        student = await SelfPacedStudent.create({
          userId: user._id,
          firstName: firstName?.trim() || 'Student',
          lastName: lastName?.trim() || '',
          phone: phone?.trim() || '',
        })
      }

      if (student) {
        const existing = await SelfPacedEnrollment.findOne({
          selfPacedStudentId: student._id,
          courseId,
        })
        if (!existing) {
          const course = await SelfPacedCourse.findById(courseId)
          if (course && Math.abs(course.price - amountPaid) <= 1) {
            await SelfPacedEnrollment.create({
              selfPacedStudentId: student._id,
              courseId,
              tutorId: course.tutorId,
              amountPaid,
              paystackReference: reference,
              weekProgress: [],
            })
            if (student.discordId) {
              await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
            }
            console.log(`Self-paced enrollment created for ${email} in course ${courseId}`)
          } else {
            console.error('Price mismatch for self-paced course', { courseId, expected: course?.price, received: amountPaid })
          }
        } else {
          console.log(`Self-paced enrollment already exists for ${email} in course ${courseId}`)
        }
      }
    }

    // ── 2. Self-paced add-on purchase (existing logged-in student) ──
    if (metadata.type === 'self_paced_addon') {
      const { courseId, selfPacedStudentId } = metadata

      if (!courseId || !selfPacedStudentId) {
        console.error('Missing required metadata for self-paced addon', { metadata })
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
      }

      const existing = await SelfPacedEnrollment.findOne({ selfPacedStudentId, courseId })
      if (!existing) {
        const course = await SelfPacedCourse.findById(courseId)
        if (course && Math.abs(course.price - amountPaid) <= 1) {
          await SelfPacedEnrollment.create({
            selfPacedStudentId,
            courseId,
            tutorId: course.tutorId,
            amountPaid,
            paystackReference: reference,
            weekProgress: [],
          })
          const student = await SelfPacedStudent.findById(selfPacedStudentId)
          if (student?.discordId) {
            await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
          }
          console.log(`Self-paced addon enrollment created for student ${selfPacedStudentId} in course ${courseId}`)
        }
      }
    }

    // ── 3. Coaching booking ──
    if (metadata.type === 'coaching_booking') {
      const { slotId } = metadata

      if (!slotId) {
        console.error('Missing slotId for coaching booking', { metadata })
        return NextResponse.json({ error: 'Missing slotId' }, { status: 400 })
      }

      const booking = await CoachingBooking.findOne({ paystackReference: reference })
      if (booking && booking.status !== 'confirmed') {
        const slot = await TutorAvailabilitySlot.findById(slotId)
        if (slot && !slot.isBooked) {
          slot.isBooked = true
          await slot.save()
          booking.status = 'confirmed'
          await booking.save()
          console.log(`Coaching booking confirmed for slot ${slotId}`)
        }
      }
    }

    // ── 4. Lesson note purchase ──
    if (metadata.type === 'lesson_note_purchase') {
      const { lessonNoteId, buyerName, buyerEmail } = metadata

      if (!lessonNoteId) {
        console.error('Missing lessonNoteId for lesson note purchase', { metadata })
        return NextResponse.json({ error: 'Missing lessonNoteId' }, { status: 400 })
      }

      const existing = await LessonNotePurchase.findOne({ paystackReference: reference })
      if (!existing) {
        const note = await LessonNote.findById(lessonNoteId)
        if (note && Math.abs(note.price - amountPaid) <= 1) {
          await LessonNotePurchase.create({
            lessonNoteId,
            tutorId: note.tutorId,
            buyerEmail: buyerEmail || 'anonymous@example.com',
            buyerName: buyerName || 'Anonymous Buyer',
            amountPaid,
            paystackReference: reference,
          })
          note.purchaseCount += 1
          await note.save()
          console.log(`Lesson note purchase created for ${lessonNoteId}`)
        } else {
          console.error('Price mismatch for lesson note', { lessonNoteId, expected: note?.price, received: amountPaid })
        }
      }
    }

    // ── 5. Normal enrollment renewal ──
    if (metadata.type === 'renewal') {
      const { enrollmentId, newPlan } = metadata

      if (!enrollmentId || !newPlan) {
        console.error('Missing renewal metadata', { metadata })
        return NextResponse.json({ error: 'Missing renewal metadata' }, { status: 400 })
      }

      const existingPayment = await Payment.findOne({ paystackReference: reference })
      if (existingPayment && existingPayment.status !== 'success') {
        const enrollment = await Enrollment.findById(enrollmentId)
        if (enrollment) {
          const durationDays = PLAN_DURATIONS[newPlan as PlanType]
          const now = new Date()
          const stillActive = enrollment.status === 'active' && enrollment.endDate && enrollment.endDate > now
          const baseDate = stillActive ? enrollment.endDate : now

          enrollment.plan = newPlan
          enrollment.status = 'active'
          enrollment.endDate = addDays(baseDate, durationDays)
          enrollment.paymentId = existingPayment._id
          if (enrollment.pausedAt) enrollment.pausedAt = undefined
          if (enrollment.pausedBy) enrollment.pausedBy = undefined
          await enrollment.save()

          await Payment.findByIdAndUpdate(existingPayment._id, {
            status: 'success',
            paidAt: new Date(),
          })
          console.log(`Renewal processed for enrollment ${enrollmentId}`)
        }
      }
    }

    // ── 6. Normal enrollment payment status update ──
    // This handles the case where the webhook receives a payment before the GET /payments/verify
    // For new registrations, the actual account creation happens via GET /payments/verify
    // The webhook just marks the payment as success
    if (!metadata.type || metadata.type === 'registration') {
      const existingPayment = await Payment.findOne({ paystackReference: reference })
      if (existingPayment && existingPayment.status !== 'success') {
        await Payment.findByIdAndUpdate(existingPayment._id, {
          status: 'success',
          paidAt: new Date(),
        })
        console.log(`Payment ${reference} marked as success via webhook`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
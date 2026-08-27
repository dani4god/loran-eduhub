// app/api/lesson-notes/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

  await connectDB()
  const existing = await LessonNotePurchase.findOne({ paystackReference: reference })
  if (existing) return NextResponse.json({ success: true, alreadyProcessed: true })

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const v = await verifyRes.json()
  if (!v.data || v.data.status !== 'success') return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })

  const note = await LessonNote.findById(id)
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const amountPaid = v.data.amount / 100
  if (Math.abs(note.price - amountPaid) > 1) return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })

  const { buyerName, buyerEmail } = v.data.metadata || {}
  await LessonNotePurchase.create({ lessonNoteId: id, tutorId: note.tutorId, buyerEmail, buyerName, amountPaid, paystackReference: reference })
  note.purchaseCount += 1
  await note.save()

  return NextResponse.json({ success: true, alreadyProcessed: false })
}
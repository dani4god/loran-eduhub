// app/api/lesson-notes/[id]/purchase/route.ts — guest checkout, no account needed
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, email } = await req.json()
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  await connectDB()
  const note = await LessonNote.findById(id)
  if (!note || note.status !== 'published') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (note.price === 0) {
    note.purchaseCount += 1
    await note.save()
    return NextResponse.json({ success: true, isFree: true, requiresPayment: false })
  }

  const reference = `LN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, amount: Math.round(note.price * 100), reference, currency: 'NGN',
      callback_url: `${process.env.NEXTAUTH_URL}/lesson-notes/${id}/download`,
      metadata: { type: 'lesson_note_purchase', lessonNoteId: id, buyerName: name, buyerEmail: email },
    }),
  })
  const data = await paystackRes.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })

  return NextResponse.json({ success: true, requiresPayment: true, accessCode: data.data.access_code, reference: data.data.reference, publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, amount: note.price, email })
}
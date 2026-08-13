// app/api/admin/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'
import User from '@/models/User'
import Newsletter from '@/models/Newsletter'
import { buildNewsletterHtml } from '@/lib/newsletter'
import { sendNewsletterBatch } from '@/lib/email'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const newsletters = await Newsletter.find().sort({ sentAt: -1 }).limit(50)

  return NextResponse.json({
    newsletters: newsletters.map((n: any) => ({
      _id: n._id.toString(),
      subject: n.subject,
      heading: n.heading,
      audience: n.audience,
      recipientCount: n.recipientCount,
      sentAt: n.sentAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const admin = await Admin.findOne({ userId: token.id })
  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: 'Admin account deactivated' }, { status: 403 })
  }

  const { subject, heading, bodyHtml, imageUrl, links, audience } = await req.json()

  if (!subject?.trim() || !heading?.trim() || !bodyHtml?.trim()) {
    return NextResponse.json({ error: 'Subject, heading, and body are required' }, { status: 400 })
  }
  if (!['all', 'students', 'tutors', 'admins'].includes(audience)) {
    return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
  }

  const roleFilter: any = audience === 'all' ? {} : { role: audience.slice(0, -1) } // 'students' -> 'student', etc.
  const users = await User.find({ ...roleFilter, isActive: true }).select('email')
  const recipients = users.map((u: any) => u.email).filter((e: string) => !e.endsWith('@loraneduhub.invalid'))

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No active recipients found for this audience' }, { status: 400 })
  }

  const validLinks = (links || []).filter((l: any) => l.label?.trim() && l.url?.trim())
    .map((l: any) => ({ label: l.label.trim(), url: l.url.trim() }))

  const html = buildNewsletterHtml({
    heading: heading.trim(),
    bodyHtml: bodyHtml.trim(),
    imageUrl: imageUrl || undefined,
    links: validLinks,
  })

  const { sent, failed } = await sendNewsletterBatch(recipients, subject.trim(), html)

  await Newsletter.create({
    subject: subject.trim(),
    heading: heading.trim(),
    bodyHtml: bodyHtml.trim(),
    imageUrl: imageUrl || undefined,
    links: validLinks,
    audience,
    recipientCount: recipients.length,
    sentByAdminId: admin._id,
  })

  return NextResponse.json({ success: true, sent, failed, totalRecipients: recipients.length })
}
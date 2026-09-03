// app/(public)/exam-prep/discord/page.tsx

import {
  redirect,
} from 'next/navigation'

export default function ExamPrepDiscordRedirectPage() {
  redirect(
    '/exam-prep/dashboard/discord'
  )
}
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Loran EduHub — Learn From The Best',
  description: 'Connect with expert tutors, take courses, and track your progress on Loran EduHub.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
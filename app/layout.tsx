import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import ThemeProvider from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'Loran EduHub — Learn From The Best',
  description:
    'Connect with expert tutors, take courses, and track your progress on Loran EduHub.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
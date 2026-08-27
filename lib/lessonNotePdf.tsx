// lib/lessonNotePdf.tsx
import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, Link, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 40, fontSize: 10, lineHeight: 1.5, color: '#1f2937' },
  coverTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  coverMeta: { fontSize: 10, color: '#6b7280', marginBottom: 16 },
  weekTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 8, color: '#111827' },
  pageTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 6 },
  videoLine: { fontSize: 9, color: '#2563eb', marginBottom: 8 },
  image: { width: 260, marginVertical: 8, borderRadius: 4 },
  footerAdBox: { marginTop: 30, padding: 14, backgroundColor: '#eff6ff', borderRadius: 8 },
  footerAdTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#111827' },
  footerAdText: { fontSize: 8.5, color: '#374151', lineHeight: 1.5, marginBottom: 4 },
  discordBox: { marginTop: 10, padding: 14, backgroundColor: '#4338ca', borderRadius: 8, textAlign: 'center' },
  discordText: { fontSize: 8.5, color: '#e0e7ff', marginBottom: 4 },
  discordLink: { fontSize: 9, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  copyright: { fontSize: 7.5, color: '#9ca3af', textAlign: 'center', marginTop: 10 },
})

interface Block { type: 'text' | 'image' | 'video'; content: string }

// Very light HTML → block parser: strips tags for text, extracts <img src>
// and video-embed iframe src as separate blocks so the PDF can render a
// clickable "Watch Video" line instead of an unusable static iframe.
function parseContentToBlocks(html: string): Block[] {
  const blocks: Block[] = []
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g
  const videoRegex = /data-video-embed[^>]*>[\s\S]*?<iframe[^>]+src="([^"]+)"/g

  let working = html
  let match

  while ((match = videoRegex.exec(html)) !== null) {
    blocks.push({ type: 'video', content: match[1] })
    working = working.replace(match[0], '')
  }
  while ((match = imgRegex.exec(working)) !== null) {
    blocks.push({ type: 'image', content: match[1] })
  }

  const textOnly = working
    .replace(/<img[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (textOnly) blocks.unshift({ type: 'text', content: textOnly })
  return blocks
}

interface Props {
  title: string
  subject: string
  studentClass: string
  tutorName: string
  weeks: { weekNumber: number; title: string; pages: { title: string; content: string }[] }[]
}

function LessonNoteDoc({ title, subject, studentClass, tutorName, weeks }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>{title}</Text>
        <Text style={styles.coverMeta}>{subject} · {studentClass.toUpperCase()} · by {tutorName}</Text>

        {weeks.map((week) => (
          <View key={week.weekNumber} wrap>
            <Text style={styles.weekTitle}>Week {week.weekNumber}: {week.title}</Text>
            {week.pages.map((page, pi) => {
              const blocks = parseContentToBlocks(page.content)
              return (
                <View key={pi}>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  {blocks.map((b, bi) => {
                    if (b.type === 'text') return <Text key={bi} style={styles.paragraph}>{b.content}</Text>
                    if (b.type === 'image') return <Image key={bi} src={b.content} style={styles.image} />
                    if (b.type === 'video') return (
                      <Link key={bi} src={b.content} style={styles.videoLine}>▶ Watch Video: {b.content}</Link>
                    )
                    return null
                  })}
                </View>
              )
            })}
          </View>
        ))}

        <View style={styles.footerAdBox} wrap={false}>
          <Text style={styles.footerAdTitle}>More from Loran EduHub</Text>
          <Text style={styles.footerAdText}>
            We organize free monthly workshops for tutors to stay current with the latest trends in
            education and learn how to bring tech tools into their teaching. We also offer self-paced
            courses to help you gain or sharpen a skill, and courses to learn new languages.
          </Text>
          <Link src="https://loran-eduhub.com/about" style={styles.videoLine}>Learn more about us →</Link>
        </View>

        <View style={styles.discordBox} wrap={false}>
          <Text style={styles.discordText}>
            Join our Discord community: download the Discord app on your phone or PC, create a free
            account, log in, then click below to join our server.
          </Text>
          <Link src="https://discord.gg/wxV7UfE45V" style={styles.discordLink}>discord.gg/wxV7UfE45V</Link>
        </View>

        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Loran EduHub. All rights reserved. This material is the property of Loran EduHub and its tutors.
        </Text>
      </Page>
    </Document>
  )
}

export async function renderLessonNotePdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<LessonNoteDoc {...props} />)
}
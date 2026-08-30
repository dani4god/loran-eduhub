// lib/lessonNotePdf.tsx

import React from 'react'

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Link,
  renderToBuffer,
} from '@react-pdf/renderer'

// ============================================================
// TYPES
// ============================================================

interface LessonPage {
  title: string
  content: string
}

interface LessonWeek {
  weekNumber: number
  title: string
  pages: LessonPage[]
}

interface Props {
  title: string
  subject: string
  studentClass: string
  tutorName: string
  weeks: LessonWeek[]
}

type ContentBlock =
  | {
      type: 'heading'
      content: string
      level: number
    }
  | {
      type: 'paragraph'
      content: string
    }
  | {
      type: 'bullet'
      content: string
    }
  | {
      type: 'numbered'
      content: string
      number: number
    }
  | {
      type: 'image'
      content: string
    }
  | {
      type: 'video'
      content: string
    }
  | {
      type: 'blockquote'
      content: string
    }

// ============================================================
// BRAND
// ============================================================

const COLORS = {
  navy: '#122C4A',
  blue: '#2563EB',
  purple: '#7C3AED',
  gold: '#B8860B',

  text: '#1F2937',
  muted: '#64748B',

  lightBlue: '#EFF6FF',
  lightGold: '#FFFBEB',
  lightGray: '#F8FAFC',

  border: '#E2E8F0',
  white: '#FFFFFF',
}

// ============================================================
// PDF STYLES
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.55,

    color: COLORS.text,

    paddingTop: 70,
    paddingBottom: 62,
    paddingHorizontal: 48,

    backgroundColor: COLORS.white,
  },

  // ----------------------------------------------------------
  // COVER
  // ----------------------------------------------------------

  coverPage: {
    fontFamily: 'Helvetica',

    paddingHorizontal: 58,
    paddingVertical: 64,

    backgroundColor: COLORS.white,
  },

  coverTopLine: {
    width: 78,
    height: 5,

    backgroundColor: COLORS.gold,

    marginBottom: 30,
  },

  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,

    color: COLORS.blue,

    marginBottom: 50,
  },

  coverLabel: {
    fontFamily: 'Helvetica-Bold',

    fontSize: 10,

    color: COLORS.gold,

    letterSpacing: 1.1,

    marginBottom: 12,
  },

  coverTitle: {
    fontFamily: 'Helvetica-Bold',

    fontSize: 30,

    lineHeight: 1.15,

    color: COLORS.navy,

    marginBottom: 18,
  },

  coverDescription: {
    fontSize: 13,

    color: COLORS.muted,

    lineHeight: 1.6,

    marginBottom: 36,
  },

  coverInfoBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,

    paddingVertical: 18,

    marginTop: 12,
  },

  coverInfoRow: {
    flexDirection: 'row',

    marginBottom: 8,
  },

  coverInfoLabel: {
    width: 95,

    fontFamily: 'Helvetica-Bold',

    fontSize: 10,

    color: COLORS.navy,
  },

  coverInfoValue: {
    flex: 1,

    fontSize: 10,

    color: COLORS.text,
  },

  coverFooter: {
    position: 'absolute',

    left: 58,
    right: 58,
    bottom: 50,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    paddingTop: 15,
  },

  coverFooterText: {
    fontSize: 8.5,

    color: COLORS.muted,

    lineHeight: 1.5,
  },

  // ----------------------------------------------------------
  // FIXED PAGE HEADER
  // ----------------------------------------------------------

  header: {
    position: 'absolute',

    top: 24,
    left: 48,
    right: 48,

    height: 28,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerBrand: {
    fontSize: 8.5,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.blue,
  },

  headerCourse: {
    fontSize: 7.5,

    color: COLORS.muted,

    maxWidth: 280,

    textAlign: 'right',
  },

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    position: 'absolute',

    left: 48,
    right: 48,
    bottom: 22,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    paddingTop: 8,

    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 7,

    color: '#94A3B8',
  },

  pageNumber: {
    fontSize: 7.5,

    color: COLORS.muted,
  },

  // ----------------------------------------------------------
  // WEEK
  // ----------------------------------------------------------

  weekBanner: {
    backgroundColor: COLORS.navy,

    borderRadius: 6,

    paddingVertical: 15,
    paddingHorizontal: 18,

    marginBottom: 22,
  },

  weekNumber: {
    fontSize: 8,

    fontFamily: 'Helvetica-Bold',

    color: '#CBD5E1',

    letterSpacing: 1.2,

    marginBottom: 5,
  },

  weekTitle: {
    fontSize: 19,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.white,

    lineHeight: 1.3,
  },

  // ----------------------------------------------------------
  // CONTENT PAGE TITLE
  // ----------------------------------------------------------

  contentPage: {
    marginBottom: 20,
  },

  pageTitleContainer: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,

    paddingLeft: 12,

    marginTop: 5,
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 14,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.navy,

    lineHeight: 1.3,
  },

  // ----------------------------------------------------------
  // CONTENT HEADINGS
  // ----------------------------------------------------------

  heading1: {
    fontSize: 14,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.navy,

    marginTop: 18,
    marginBottom: 8,

    paddingBottom: 4,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  heading2: {
    fontSize: 11.5,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.navy,

    marginTop: 16,
    marginBottom: 7,
  },

  heading3: {
    fontSize: 10.5,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.blue,

    marginTop: 12,
    marginBottom: 6,
  },

  specialSectionHeading: {
    fontSize: 10.5,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.navy,

    backgroundColor: COLORS.lightBlue,

    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,

    paddingVertical: 7,
    paddingHorizontal: 9,

    marginTop: 16,
    marginBottom: 9,
  },

  // ----------------------------------------------------------
  // PARAGRAPH
  // ----------------------------------------------------------

  paragraph: {
    fontSize: 10,

    lineHeight: 1.62,

    marginBottom: 9,

    color: COLORS.text,

    textAlign: 'justify',
  },

  // ----------------------------------------------------------
  // LISTS
  // ----------------------------------------------------------

  listRow: {
    flexDirection: 'row',

    marginBottom: 6,

    paddingRight: 4,
  },

  bulletSymbol: {
    width: 18,

    fontSize: 10,

    color: COLORS.blue,

    fontFamily: 'Helvetica-Bold',
  },

  numberSymbol: {
    width: 24,

    fontSize: 9.5,

    color: COLORS.blue,

    fontFamily: 'Helvetica-Bold',
  },

  listText: {
    flex: 1,

    fontSize: 10,

    lineHeight: 1.55,

    color: COLORS.text,
  },

  // ----------------------------------------------------------
  // BLOCKQUOTE
  // ----------------------------------------------------------

  blockquote: {
    backgroundColor: COLORS.lightGray,

    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,

    paddingVertical: 9,
    paddingHorizontal: 12,

    marginVertical: 8,
  },

  blockquoteText: {
    fontSize: 9.5,

    color: COLORS.text,

    lineHeight: 1.55,
  },

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  imageBox: {
    alignItems: 'center',

    marginVertical: 12,
  },

  image: {
    maxWidth: 430,

    maxHeight: 330,

    objectFit: 'contain',
  },

  // ----------------------------------------------------------
  // VIDEO
  // ----------------------------------------------------------

  videoBox: {
    backgroundColor: COLORS.lightBlue,

    borderWidth: 1,
    borderColor: '#BFDBFE',

    borderRadius: 5,

    padding: 11,

    marginVertical: 9,
  },

  videoTitle: {
    fontFamily: 'Helvetica-Bold',

    fontSize: 9.5,

    color: COLORS.navy,

    marginBottom: 4,
  },

  videoLink: {
    fontSize: 8.5,

    color: COLORS.blue,

    textDecoration: 'none',
  },

  // ----------------------------------------------------------
  // FINAL AD
  // ----------------------------------------------------------

  finalSection: {
    marginTop: 26,

    paddingTop: 18,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  promoBox: {
    padding: 16,

    backgroundColor: COLORS.lightBlue,

    borderRadius: 6,

    marginBottom: 12,
  },

  promoTitle: {
    fontSize: 12,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.navy,

    marginBottom: 7,
  },

  promoText: {
    fontSize: 9,

    lineHeight: 1.55,

    color: COLORS.text,

    marginBottom: 8,
  },

  promoLink: {
    fontSize: 9,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.blue,
  },

  discordBox: {
    padding: 15,

    backgroundColor: COLORS.purple,

    borderRadius: 6,
  },

  discordTitle: {
    fontSize: 11,

    fontFamily: 'Helvetica-Bold',

    color: COLORS.white,

    marginBottom: 6,
  },

  discordText: {
    fontSize: 8.5,

    lineHeight: 1.5,

    color: '#EDE9FE',

    marginBottom: 7,
  },

  discordLink: {
    fontSize: 9,

    color: COLORS.white,

    fontFamily: 'Helvetica-Bold',
  },
})

// ============================================================
// HTML HELPERS
// ============================================================

function decodeHtmlEntities(value: string): string {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '…')
    .replace(/&bull;/gi, '•')
    .replace(/&rarr;/gi, '→')
    .replace(/&#(\d+);/g, (_, num) => {
      try {
        return String.fromCharCode(Number(num))
      } catch {
        return ''
      }
    })
}

function cleanPlainText(value: string): string {
  return decodeHtmlEntities(
    String(value || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
  )
    // Common corrupted bullet character from copied content
    .replace(/(^|\s)Ï(?=\s)/g, '$1•')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ============================================================
// KNOWN EDUCATIONAL SECTION HEADINGS
// ============================================================

const SECTION_HEADINGS = [
  'lesson note',
  'behavioural objectives',
  'behavioral objectives',
  'learning objectives',
  'previous knowledge',
  'entry behaviour',
  'entry behavior',
  'introduction',
  'presentation',
  "pupils' activities",
  'pupils’ activities',
  'students activities',
  "students' activities",
  'teacher activities',
  "teacher's activities",
  'evaluation',
  'assessment',
  'conclusion',
  'conclusion / summary',
  'summary',
  'assignment',
  'homework',
  'chalkboard summary',
  'board summary',
  'reference materials',
  'instructional materials',
]

function isSpecialHeading(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[:\-–—]+$/g, '')
    .trim()

  return SECTION_HEADINGS.includes(normalized)
}

// ============================================================
// HTML → STRUCTURED BLOCK PARSER
// ============================================================

function parseContentToBlocks(html: string): ContentBlock[] {
  if (!html) return []

  let working = String(html)

  // ----------------------------------------------------------
  // VIDEOS
  // ----------------------------------------------------------

  working = working.replace(
    /<[^>]*data-video-embed[^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>[\s\S]*?<\/[^>]+>/gi,
    (_, url) => `\n[[VIDEO:${url}]]\n`
  )

  // Any standalone iframe
  working = working.replace(
    /<iframe[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (_, url) => `\n[[VIDEO:${url}]]\n`
  )

  // ----------------------------------------------------------
  // IMAGES
  // ----------------------------------------------------------

  working = working.replace(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    (_, url) => `\n[[IMAGE:${url}]]\n`
  )

  // ----------------------------------------------------------
  // HEADINGS
  // ----------------------------------------------------------

  working = working.replace(
    /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
    (_, content) =>
      `\n[[H1:${cleanPlainText(content)}]]\n`
  )

  working = working.replace(
    /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    (_, content) =>
      `\n[[H2:${cleanPlainText(content)}]]\n`
  )

  working = working.replace(
    /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
    (_, content) =>
      `\n[[H3:${cleanPlainText(content)}]]\n`
  )

  working = working.replace(
    /<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi,
    (_, content) =>
      `\n[[H3:${cleanPlainText(content)}]]\n`
  )

  // ----------------------------------------------------------
  // ORDERED LISTS
  // ----------------------------------------------------------

  working = working.replace(
    /<ol[^>]*>([\s\S]*?)<\/ol>/gi,
    (_, listContent) => {
      let number = 1

      return listContent.replace(
        /<li[^>]*>([\s\S]*?)<\/li>/gi,
        (_liMatch: string, liContent: string) => {
          const text =
            cleanPlainText(liContent)

          const marker =
            `\n[[OL:${number}:${text}]]\n`

          number += 1

          return marker
        }
      )
    }
  )

  // ----------------------------------------------------------
  // UNORDERED LISTS
  // ----------------------------------------------------------

  working = working.replace(
    /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    (_, listContent) => {
      return listContent.replace(
        /<li[^>]*>([\s\S]*?)<\/li>/gi,
        (_liMatch: string, liContent: string) =>
          `\n[[UL:${cleanPlainText(liContent)}]]\n`
      )
    }
  )

  // Any remaining LI
  working = working.replace(
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    (_, content) =>
      `\n[[UL:${cleanPlainText(content)}]]\n`
  )

  // ----------------------------------------------------------
  // BLOCKQUOTES
  // ----------------------------------------------------------

  working = working.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_, content) =>
      `\n[[QUOTE:${cleanPlainText(content)}]]\n`
  )

  // ----------------------------------------------------------
  // PARAGRAPHS
  // ----------------------------------------------------------

  working = working.replace(
    /<p[^>]*>([\s\S]*?)<\/p>/gi,
    (_, content) =>
      `\n[[P:${cleanPlainText(content)}]]\n`
  )

  // ----------------------------------------------------------
  // DIVS / SECTIONS
  // ----------------------------------------------------------

  working = working
    .replace(
      /<(div|section|article)[^>]*>/gi,
      '\n'
    )
    .replace(
      /<\/(div|section|article)>/gi,
      '\n'
    )

  // ----------------------------------------------------------
  // BREAKS
  // ----------------------------------------------------------

  working = working.replace(
    /<br\s*\/?>/gi,
    '\n'
  )

  // ----------------------------------------------------------
  // REMOVE REMAINING TAGS
  // ----------------------------------------------------------

  working = working.replace(
    /<[^>]+>/g,
    ''
  )

  working =
    decodeHtmlEntities(working)

  // ==========================================================
  // TOKENIZE
  // ==========================================================

  const blocks: ContentBlock[] = []

  const tokenRegex =
    /\[\[(VIDEO|IMAGE|H1|H2|H3|UL|QUOTE|P):([\s\S]*?)\]\]|\[\[OL:(\d+):([\s\S]*?)\]\]/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  const pushParagraph =
    (raw: string) => {
      const lines =
        cleanPlainText(raw)
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)

      for (const line of lines) {
        if (isSpecialHeading(line)) {
          blocks.push({
            type: 'heading',
            content: line,
            level: 2,
          })
        } else {
          blocks.push({
            type: 'paragraph',
            content: line,
          })
        }
      }
    }

  while (
    (match =
      tokenRegex.exec(working)) !== null
  ) {
    const before =
      working.slice(
        lastIndex,
        match.index
      )

    if (before.trim()) {
      pushParagraph(before)
    }

    // OL
    if (match[3]) {
      const number =
        Number(match[3])

      const content =
        cleanPlainText(match[4])

      if (content) {
        blocks.push({
          type: 'numbered',
          number,
          content,
        })
      }
    } else {
      const token =
        match[1]

      const raw =
        match[2] || ''

      const content =
        cleanPlainText(raw)

      if (token === 'VIDEO') {
        blocks.push({
          type: 'video',
          content: raw.trim(),
        })
      }

      if (token === 'IMAGE') {
        blocks.push({
          type: 'image',
          content: raw.trim(),
        })
      }

      if (
        token === 'H1' ||
        token === 'H2' ||
        token === 'H3'
      ) {
        blocks.push({
          type: 'heading',

          content,

          level:
            token === 'H1'
              ? 1
              : token === 'H2'
                ? 2
                : 3,
        })
      }

      if (token === 'UL') {
        blocks.push({
          type: 'bullet',
          content,
        })
      }

      if (token === 'QUOTE') {
        blocks.push({
          type: 'blockquote',
          content,
        })
      }

      if (token === 'P') {
        if (isSpecialHeading(content)) {
          blocks.push({
            type: 'heading',
            content,
            level: 2,
          })
        } else if (content) {
          blocks.push({
            type: 'paragraph',
            content,
          })
        }
      }
    }

    lastIndex =
      tokenRegex.lastIndex
  }

  const remainder =
    working.slice(lastIndex)

  if (remainder.trim()) {
    pushParagraph(remainder)
  }

  return blocks
}

// ============================================================
// CONTENT BLOCK RENDERER
// ============================================================

function ContentBlockRenderer({
  block,
  index,
}: {
  block: ContentBlock
  index: number
}) {
  if (block.type === 'heading') {
    const special =
      isSpecialHeading(block.content)

    if (special) {
      return (
        <Text
          key={index}
          style={
            styles.specialSectionHeading
          }
          minPresenceAhead={30}
        >
          {block.content}
        </Text>
      )
    }

    const headingStyle =
      block.level === 1
        ? styles.heading1
        : block.level === 2
          ? styles.heading2
          : styles.heading3

    return (
      <Text
        key={index}
        style={headingStyle}
        minPresenceAhead={30}
      >
        {block.content}
      </Text>
    )
  }

  if (block.type === 'paragraph') {
    return (
      <Text
        key={index}
        style={styles.paragraph}
        orphans={2}
        widows={2}
      >
        {block.content}
      </Text>
    )
  }

  if (block.type === 'bullet') {
    return (
      <View
        key={index}
        style={styles.listRow}
      >
        <Text
          style={
            styles.bulletSymbol
          }
        >
          •
        </Text>

        <Text
          style={styles.listText}
          orphans={2}
          widows={2}
        >
          {block.content}
        </Text>
      </View>
    )
  }

  if (block.type === 'numbered') {
    return (
      <View
        key={index}
        style={styles.listRow}
      >
        <Text
          style={
            styles.numberSymbol
          }
        >
          {block.number}.
        </Text>

        <Text
          style={styles.listText}
          orphans={2}
          widows={2}
        >
          {block.content}
        </Text>
      </View>
    )
  }

  if (block.type === 'blockquote') {
    return (
      <View
        key={index}
        style={styles.blockquote}
        wrap={false}
      >
        <Text
          style={
            styles.blockquoteText
          }
        >
          {block.content}
        </Text>
      </View>
    )
  }

  if (block.type === 'image') {
    return (
      <View
        key={index}
        style={styles.imageBox}
      >
        <Image
          src={block.content}
          style={styles.image}
        />
      </View>
    )
  }

  if (block.type === 'video') {
    return (
      <View
        key={index}
        style={styles.videoBox}
        wrap={false}
      >
        <Text
          style={styles.videoTitle}
        >
          Video Resource
        </Text>

        <Link
          src={block.content}
          style={styles.videoLink}
        >
          Watch video online →
        </Link>
      </View>
    )
  }

  return null
}

// ============================================================
// FIXED HEADER
// ============================================================

function PdfHeader({
  title,
}: {
  title: string
}) {
  return (
    <View
      style={styles.header}
      fixed
    >
      <Text
        style={styles.headerBrand}
      >
        LORAN EDUHUB
      </Text>

      <Text
        style={styles.headerCourse}
      >
        {title}
      </Text>
    </View>
  )
}

// ============================================================
// FIXED FOOTER
// ============================================================

function PdfFooter() {
  return (
    <View
      style={styles.footer}
      fixed
    >
      <Text
        style={styles.footerText}
      >
        © {new Date().getFullYear()}{' '}
        Loran EduHub · Educational
        Material
      </Text>

      <Text
        style={styles.pageNumber}
        render={({
          pageNumber,
          totalPages,
        }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

// ============================================================
// DOCUMENT
// ============================================================

function LessonNoteDoc({
  title,
  subject,
  studentClass,
  tutorName,
  weeks,
}: Props) {
  return (
    <Document
      title={title}
      author={tutorName}
      subject={`${subject} lesson note`}
      creator="Loran EduHub"
      producer="Loran EduHub"
    >
      {/* =====================================================
          COVER PAGE
      ===================================================== */}

      <Page
        size="A4"
        style={styles.coverPage}
      >
        <View
          style={styles.coverTopLine}
        />

        <Text
          style={styles.brandName}
        >
          LORAN EDUHUB
        </Text>

        <Text
          style={styles.coverLabel}
        >
          PROFESSIONAL LESSON NOTE
        </Text>

        <Text
          style={styles.coverTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.coverDescription
          }
        >
          A structured instructional
          lesson note prepared for
          classroom teaching and
          learning.
        </Text>

        <View
          style={styles.coverInfoBox}
        >
          <View
            style={
              styles.coverInfoRow
            }
          >
            <Text
              style={
                styles.coverInfoLabel
              }
            >
              Subject
            </Text>

            <Text
              style={
                styles.coverInfoValue
              }
            >
              {subject}
            </Text>
          </View>

          <View
            style={
              styles.coverInfoRow
            }
          >
            <Text
              style={
                styles.coverInfoLabel
              }
            >
              Class
            </Text>

            <Text
              style={
                styles.coverInfoValue
              }
            >
              {studentClass.toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.coverInfoRow
            }
          >
            <Text
              style={
                styles.coverInfoLabel
              }
            >
              Prepared by
            </Text>

            <Text
              style={
                styles.coverInfoValue
              }
            >
              {tutorName}
            </Text>
          </View>

          <View
            style={
              styles.coverInfoRow
            }
          >
            <Text
              style={
                styles.coverInfoLabel
              }
            >
              Weeks
            </Text>

            <Text
              style={
                styles.coverInfoValue
              }
            >
              {weeks.length}
            </Text>
          </View>
        </View>

        <View
          style={styles.coverFooter}
        >
          <Text
            style={
              styles.coverFooterText
            }
          >
            This educational material
            is distributed through
            Loran EduHub and remains
            the intellectual property
            of Loran EduHub and its
            contributing tutor.
          </Text>
        </View>
      </Page>

      {/* =====================================================
          WEEK PAGES
      ===================================================== */}

      {weeks.map(
        (week, weekIndex) => {
          const isLastWeek =
            weekIndex ===
            weeks.length - 1

          return (
            <Page
              key={
                week.weekNumber
              }
              size="A4"
              style={styles.page}
              wrap
            >
              <PdfHeader
                title={title}
              />

              <PdfFooter />

              {/* WEEK BANNER */}

              <View
                style={
                  styles.weekBanner
                }
                wrap={false}
              >
                <Text
                  style={
                    styles.weekNumber
                  }
                >
                  WEEK{' '}
                  {week.weekNumber}
                </Text>

                <Text
                  style={
                    styles.weekTitle
                  }
                >
                  {week.title ||
                    `Week ${week.weekNumber}`}
                </Text>
              </View>

              {/* WEEK CONTENT */}

              {week.pages.map(
                (
                  lessonPage,
                  pageIndex
                ) => {
                  const blocks =
                    parseContentToBlocks(
                      lessonPage.content
                    )

                  return (
                    <View
                      key={
                        pageIndex
                      }
                      style={
                        styles.contentPage
                      }
                    >
                      {lessonPage.title &&
                        lessonPage.title.trim() && (
                          <View
                            style={
                              styles.pageTitleContainer
                            }
                            wrap={
                              false
                            }
                          >
                            <Text
                              style={
                                styles.pageTitle
                              }
                            >
                              {
                                lessonPage.title
                              }
                            </Text>
                          </View>
                        )}

                      {blocks.map(
                        (
                          block,
                          blockIndex
                        ) => (
                          <ContentBlockRenderer
                            key={
                              blockIndex
                            }
                            block={
                              block
                            }
                            index={
                              blockIndex
                            }
                          />
                        )
                      )}
                    </View>
                  )
                }
              )}

              {/* =============================================
                  ONLY AFTER FINAL WEEK
              ============================================= */}

              {isLastWeek && (
                <View
                  style={
                    styles.finalSection
                  }
                >
                  <View
                    style={
                      styles.promoBox
                    }
                    wrap={false}
                  >
                    <Text
                      style={
                        styles.promoTitle
                      }
                    >
                      More from Loran
                      EduHub
                    </Text>

                    <Text
                      style={
                        styles.promoText
                      }
                    >
                      We organize free
                      monthly workshops
                      for tutors to stay
                      current with the
                      latest trends in
                      education and
                      learn how to
                      integrate digital
                      tools effectively
                      into teaching.
                      Loran EduHub also
                      offers self-paced
                      courses,
                      professional
                      learning
                      resources and
                      language courses.
                    </Text>

                    <Link
                      src="https://www.loran-eduhub.com/about"
                      style={
                        styles.promoLink
                      }
                    >
                      Learn more about
                      Loran EduHub →
                    </Link>
                  </View>

                  <View
                    style={
                      styles.discordBox
                    }
                    wrap={false}
                  >
                    <Text
                      style={
                        styles.discordTitle
                      }
                    >
                      Join our learning
                      community
                    </Text>

                    <Text
                      style={
                        styles.discordText
                      }
                    >
                      Connect with
                      tutors, learners
                      and education
                      professionals in
                      the Loran EduHub
                      Discord
                      community.
                    </Text>

                    <Link
                      src="https://discord.gg/wxV7UfE45V"
                      style={
                        styles.discordLink
                      }
                    >
                      discord.gg/wxV7UfE45V
                    </Link>
                  </View>
                </View>
              )}
            </Page>
          )
        }
      )}
    </Document>
  )
}

// ============================================================
// EXPORT
// ============================================================

export async function renderLessonNotePdf(
  props: Props
): Promise<Buffer> {
  return renderToBuffer(
    <LessonNoteDoc {...props} />
  )
}
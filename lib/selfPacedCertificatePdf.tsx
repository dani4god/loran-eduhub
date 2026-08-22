// lib/selfPacedCertificatePdf.tsx
import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { formatCertificateDate } from '@/lib/dateSpell'

const styles = StyleSheet.create({
  page: { fontFamily: 'Times-Roman', padding: 50, backgroundColor: '#ffffff' },
  logo: { width: 70, height: 70, alignSelf: 'center', marginBottom: 18, objectFit: 'contain' },
  title: { fontSize: 34, letterSpacing: 8, textAlign: 'center', marginBottom: 26, color: '#111827' },
  paragraph: { fontSize: 11, textAlign: 'center', color: '#374151', lineHeight: 1.6, marginBottom: 18, paddingHorizontal: 20 },
  studentName: { fontSize: 22, textAlign: 'center', color: '#111827', marginBottom: 14, fontFamily: 'Times-Bold' },
  smallLabel: { fontSize: 10, textAlign: 'center', color: '#6b7280', marginBottom: 6 },
  courseName: { fontSize: 20, textAlign: 'center', color: '#111827', marginBottom: 16, fontFamily: 'Times-Bold' },
  honorsLine: { fontSize: 10.5, textAlign: 'center', color: '#374151', marginBottom: 14 },
  dateGiven: { fontSize: 8.5, textAlign: 'center', color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.5, marginBottom: 22 },
  classificationBadge: { fontSize: 10.5, textAlign: 'center', color: '#B8860B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 22, fontFamily: 'Times-Bold' },
  outcomesHeader: { fontSize: 12, letterSpacing: 3, textAlign: 'center', color: '#111827', marginBottom: 12, textTransform: 'uppercase' },
  outcomesList: { paddingHorizontal: 30, marginBottom: 24 },
  outcomeRow: { flexDirection: 'row', marginBottom: 6 },
  bullet: { fontSize: 10, width: 12, color: '#374151' },
  outcomeText: { fontSize: 10, color: '#374151', flex: 1, lineHeight: 1.4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
  sigBlock: { alignItems: 'center', width: 160 },
  sigImage: { width: 100, height: 34, objectFit: 'contain', marginBottom: 4 },
  sigLine: { borderTopWidth: 1, borderTopColor: '#9ca3af', width: 140, paddingTop: 4, alignItems: 'center' },
  sigName: { fontSize: 9, fontFamily: 'Times-Bold', color: '#111827' },
  sigTitle: { fontSize: 7.5, color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },
  metaBlock: { alignItems: 'flex-end', width: 160 },
  metaText: { fontSize: 7.5, color: '#9ca3af', marginBottom: 2 },
})

interface Props {
  studentName: string
  courseName: string
  learningOutcomes: string[]
  logoUrl: string
  signatureUrl: string
  signatoryName: string
  signatoryTitle: string
  classification: 'distinction' | 'credit' | 'pass'
  certificateNumber: string
  issuedAt: Date
}

function ClassificationLabel({ value }: { value: string }) {
  const map: Record<string, string> = { distinction: 'Distinction', credit: 'Credit', pass: 'Pass' }
  return <Text style={styles.classificationBadge}>Awarded with {map[value] || value}</Text>
}

function CertDoc({
  studentName, courseName, learningOutcomes, logoUrl, signatureUrl,
  signatoryName, signatoryTitle, classification, certificateNumber, issuedAt,
}: Props) {
  const { day, month, year } = formatCertificateDate(issuedAt)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}

        <Text style={styles.title}>CERTIFICATE</Text>

        <Text style={styles.paragraph}>
          On recommendation of the Institution Faculty and on authorization of the Director of
          Academics and the Board of Trustees, Loran EduHub has awarded
        </Text>

        <Text style={styles.studentName}>{studentName}</Text>

        <Text style={styles.smallLabel}>this certificate in</Text>
        <Text style={styles.courseName}>{courseName}</Text>

        <Text style={styles.honorsLine}>
          Together with the honors, rights, privileges, and responsibilities pertaining thereto.
        </Text>

        <Text style={styles.dateGiven}>
          Given at Loran EduHub on the {day} Day of {month}{'\n'}in the Year {year}
        </Text>

        <ClassificationLabel value={classification} />

        {learningOutcomes.length > 0 && (
          <>
            <Text style={styles.outcomesHeader}>Certificate Learning Outcomes</Text>
            <View style={styles.outcomesList}>
              {learningOutcomes.map((o, i) => (
                <View key={i} style={styles.outcomeRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.outcomeText}>{o}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.sigBlock}>
            {signatureUrl && <Image src={signatureUrl} style={styles.sigImage} />}
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>{signatoryName}</Text>
              <Text style={styles.sigTitle}>{signatoryTitle}</Text>
            </View>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>Certificate No: {certificateNumber}</Text>
            <Text style={styles.metaText}>Issued: {month} {day.replace(/(st|nd|rd|th)$/, '')}, {issuedAt.getFullYear()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function renderSelfPacedCertificatePdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<CertDoc {...props} />)
}
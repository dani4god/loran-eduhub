// lib/certificatePdf.tsx
import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { ICertificate } from '@/models/Certificate'
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS, formatDurationRange } from '@/lib/certificate'

const NAVY = '#122C4A'
const GOLD = '#B8860B'
const CREAM = '#FBF8F1'

const styles = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    padding: 0,
    fontFamily: 'Times-Roman',
  },
  outerBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: GOLD,
  },
  innerBorder: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    borderWidth: 1,
    borderColor: NAVY,
  },
  watermarkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  watermarkText: {
    position: 'absolute',
    fontSize: 26,
    color: NAVY,
    opacity: 0.06,
    fontFamily: 'Times-Bold',
    transform: 'rotate(-30deg)',
  },
  content: {
    position: 'absolute',
    top: 50,
    left: 60,
    right: 60,
    bottom: 50,
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 8,
    objectFit: 'contain',
  },
  schoolName: {
    fontSize: 26,
    fontFamily: 'Times-Bold',
    color: NAVY,
    letterSpacing: 2,
  },
  schoolSub: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 3,
    marginTop: 2,
    marginBottom: 14,
  },
  certTitle: {
    fontSize: 15,
    fontFamily: 'Times-Bold',
    color: GOLD,
    letterSpacing: 4,
    marginBottom: 18,
  },
  bodyText: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 6,
  },
  studentName: {
    fontSize: 28,
    fontFamily: 'Times-BoldItalic',
    color: NAVY,
    marginTop: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  courseName: {
    fontSize: 15,
    fontFamily: 'Times-Bold',
    color: NAVY,
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  classificationBadge: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 3,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 10,
  },
  detailRow: {
    fontSize: 9.5,
    color: '#555555',
    marginTop: 2,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 50,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBlock: {
    alignItems: 'center',
    width: 170,
  },
  signatureImg: {
    width: 100,
    height: 38,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#999999',
    width: 150,
    marginTop: 2,
    paddingTop: 4,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: NAVY,
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 7.5,
    color: '#666666',
    textAlign: 'center',
    marginTop: 1,
  },
  qrBlock: {
    alignItems: 'center',
    width: 100,
  },
  qrImg: {
    width: 56,
    height: 56,
  },
  qrLabel: {
    fontSize: 6.5,
    color: '#777777',
    textAlign: 'center',
    marginTop: 3,
  },
  certNumberBlock: {
    alignItems: 'flex-end',
    width: 170,
  },
  certNumber: {
    fontSize: 8.5,
    color: '#666666',
  },
  issueDate: {
    fontSize: 8.5,
    color: '#666666',
    marginTop: 2,
  },
})

function Watermark() {
  const rows = 5
  const cols = 4
  const items: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push(
        <Text
          key={`${r}-${c}`}
          style={[
            styles.watermarkText,
            { top: r * 130 - 20, left: c * 230 - 40 },
          ]}
        >
          LORAN EDUHUB
        </Text>
      )
    }
  }
  return <View style={styles.watermarkLayer}>{items}</View>
}

interface CertificateDocProps {
  certificate: ICertificate
  qrDataUrl: string
}

function CertificateDocument({ certificate: cert, qrDataUrl }: CertificateDocProps) {
  const classLabel = CLASSIFICATION_LABELS[cert.classification]
  const classColor = CLASSIFICATION_COLORS[cert.classification]
  const duration = formatDurationRange(new Date(cert.durationStart), new Date(cert.durationEnd))
  const issueDateStr = new Date(cert.issuedAt).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Watermark />
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {cert.logoUrl && <Image src={cert.logoUrl} style={styles.logo} />}
          <Text style={styles.schoolName}>LORAN EDUHUB</Text>
          <Text style={styles.schoolSub}>EXCELLENCE IN LEARNING</Text>

          <Text style={styles.certTitle}>CERTIFICATE OF COMPLETION</Text>

          <Text style={styles.bodyText}>This is to certify that</Text>
          <Text style={styles.studentName}>{cert.studentName}</Text>
          <Text style={styles.bodyText}>has successfully completed the course</Text>
          <Text style={styles.courseName}>{cert.courseName}</Text>

          <Text style={[styles.classificationBadge, { backgroundColor: classColor }]}>
            {classLabel.toUpperCase()}
          </Text>

          <Text style={styles.detailRow}>Average Score: {cert.averageScore.toFixed(1)}%</Text>
          <Text style={styles.detailRow}>Duration of Study: {duration}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.signatureBlock}>
            {cert.signatureUrl && <Image src={cert.signatureUrl} style={styles.signatureImg} />}
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{cert.tutorName}</Text>
              <Text style={styles.signatureRole}>Director of Learning, Loran EduHub</Text>
            </View>
          </View>

          <View style={styles.qrBlock}>
            <Image src={qrDataUrl} style={styles.qrImg} />
            <Text style={styles.qrLabel}>Scan to verify authenticity</Text>
          </View>

          <View style={styles.certNumberBlock}>
            <Text style={styles.certNumber}>Certificate No: {cert.certificateNumber}</Text>
            <Text style={styles.issueDate}>Issued: {issueDateStr}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function renderCertificatePdf(certificate: ICertificate): Promise<Buffer> {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/certificates/verify/${certificate.certificateNumber}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 })

  return renderToBuffer(<CertificateDocument certificate={certificate} qrDataUrl={qrDataUrl} />)
}
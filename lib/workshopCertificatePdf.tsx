// lib/workshopCertificatePdf.tsx
import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Times-Roman' },
  themeImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    top: '30%',
    left: 60,
    right: 60,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 36,
    alignItems: 'center',
  },
  logo: { width: 48, height: 48, marginBottom: 10, objectFit: 'contain' },
  certTitle: { fontSize: 13, fontFamily: 'Times-Bold', color: '#B8860B', letterSpacing: 3, marginBottom: 14 },
  bodyText: { fontSize: 11, color: '#333', marginBottom: 4 },
  name: {
    fontSize: 24,
    fontFamily: 'Times-BoldItalic',
    color: '#122C4A',
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#B8860B',
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  workshopTitle: { fontSize: 13, fontFamily: 'Times-Bold', color: '#122C4A', marginTop: 6, marginBottom: 10, textAlign: 'center' },
  certNumber: { fontSize: 8, color: '#666', marginTop: 12 },
  date: { fontSize: 8, color: '#666' },
})

interface Props {
  fullName: string
  workshopTitle: string
  themeImageUrl: string
  logoUrl: string
  certificateNumber: string
  issuedAt: Date
}

function WorkshopCertDoc({ fullName, workshopTitle, themeImageUrl, logoUrl, certificateNumber, issuedAt }: Props) {
  const dateStr = issuedAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Image src={themeImageUrl} style={styles.themeImage} />
        <View style={styles.overlay}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <Text style={styles.certTitle}>CERTIFICATE OF PARTICIPATION</Text>
          <Text style={styles.bodyText}>This certifies that</Text>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.bodyText}>participated in</Text>
          <Text style={styles.workshopTitle}>{workshopTitle}</Text>
          <Text style={styles.certNumber}>Certificate No: {certificateNumber}</Text>
          <Text style={styles.date}>Issued: {dateStr}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderWorkshopCertificatePdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<WorkshopCertDoc {...props} />)
}
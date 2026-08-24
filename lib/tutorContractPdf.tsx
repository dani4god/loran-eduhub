// lib/tutorContractPdf.tsx
import React from 'react'
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Times-Roman', padding: 48, fontSize: 10.5, lineHeight: 1.5, color: '#1f2937' },
  title: { fontSize: 18, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontFamily: 'Times-Bold', marginTop: 16, marginBottom: 6 },
  paragraph: { marginBottom: 8, textAlign: 'justify' },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bullet: { width: 12 },
  bulletText: { flex: 1 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  sigBlock: { width: '45%' },
  sigLine: { borderTopWidth: 1, borderTopColor: '#374151', marginTop: 30, paddingTop: 4 },
  sigLabel: { fontSize: 9, color: '#6b7280' },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>
}
function H({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

function ContractDoc() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>LORAN EDUHUB — TUTOR AGREEMENT</Text>
        <Text style={styles.subtitle}>Independent Contractor Agreement for Tutoring Services</Text>

        <P>
          This Tutor Agreement ("Agreement") governs the relationship between Loran EduHub ("the
          Platform," "we," "us") and any individual approved to teach on the Platform ("the Tutor,"
          "you"). By registering as a tutor and continuing to use the Platform after approval, you
          agree to the terms below.
        </P>

        <H>1. Nature of the Relationship</H>
        <P>
          You are engaged as an independent contractor, not an employee, agent, or partner of Loran
          EduHub. Nothing in this Agreement creates an employment relationship, partnership, or joint
          venture. You are solely responsible for your own tax obligations arising from income earned
          through the Platform.
        </P>

        <H>2. Scope of Services</H>
        <Bullet>You will deliver tutoring services in the course(s) assigned to you following your application review.</Bullet>
        <Bullet>You are responsible for the quality, accuracy, and professionalism of the instruction you provide.</Bullet>
        <Bullet>You will conduct sessions, respond to students, and manage course material in a timely and professional manner.</Bullet>

        <H>3. Pricing & Payment</H>
        <Bullet>You set your own pricing for each subscription plan (monthly, 3, 6, and 12-month) within the tools provided on your dashboard.</Bullet>
        <Bullet>Payouts are calculated as the student's payment minus the Platform's service fee, at the rate in effect at the time of payment.</Bullet>
        <Bullet>Payouts are made to the bank account you provide and confirm, verified by email authentication before any change takes effect.</Bullet>
        <Bullet>Loran EduHub reserves the right to adjust its service fee rate for future transactions, with reasonable notice provided to tutors.</Bullet>

        <H>4. Code of Conduct</H>
        <Bullet>You will treat all students, staff, and fellow tutors with respect and professionalism at all times.</Bullet>
        <Bullet>You will not solicit students to transact outside the Platform in a manner that circumvents the Platform's payment and service fee structure.</Bullet>
        <Bullet>You will not share your account access with any other individual.</Bullet>
        <Bullet>You will maintain the confidentiality of any student information you access in the course of tutoring.</Bullet>

        <H>5. Content Ownership</H>
        <P>
          You retain ownership of original course material you create. By publishing content on the
          Platform, you grant Loran EduHub a non-exclusive license to host, display, and deliver that
          content to enrolled students for as long as your course remains active on the Platform.
        </P>

        <H>6. Discord Community</H>
        <P>
          Teaching activity, including live sessions and student communication, is conducted through
          the official Loran EduHub Discord server. You agree to conduct yourself professionally within
          this community and to use it as intended for course delivery and support.
        </P>

        <H>7. Termination</H>
        <Bullet>You may stop teaching on the Platform at any time by contacting our team; outstanding obligations to enrolled students should be settled first.</Bullet>
        <Bullet>Loran EduHub may suspend or terminate your account for violation of this Agreement, the Platform's Terms of Service, or conduct that harms students or the Platform's reputation.</Bullet>

        <H>8. Limitation of Liability</H>
        <P>
          Loran EduHub is not liable for indirect, incidental, or consequential damages arising from
          your use of the Platform. The Platform is provided as a marketplace connecting tutors and
          students; it does not guarantee any specific volume of students or earnings.
        </P>

        <H>9. Governing Terms</H>
        <P>
          This Agreement supplements and should be read alongside the Platform's general Terms of
          Service and Privacy Policy, available on the Loran EduHub website. In the event of conflict,
          the specific terms of this Agreement govern the tutoring relationship.
        </P>

        <View style={styles.sigRow}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Tutor Signature & Date</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Print Full Name</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Loran EduHub Tutor Agreement — please sign, scan or photograph clearly, and submit to our team via Discord (file size under 4MB).
        </Text>
      </Page>
    </Document>
  )
}

export async function renderTutorContractPdf(): Promise<Buffer> {
  return renderToBuffer(<ContractDoc />)
}
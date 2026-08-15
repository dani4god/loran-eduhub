import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-7 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>By registering for or using Loran EduHub ("the Platform"), whether as a student, tutor, or visitor, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. What Loran EduHub Is</h2>
              <p>Loran EduHub is a marketplace connecting independent tutors with students for tech, language, and exam-preparation courses. Tutors are independent educators, not employees of Loran EduHub. Each tutor sets their own pricing. Actual teaching and communication take place primarily on Discord.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. Accounts & Eligibility</h2>
              <p>You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Tutor applications are subject to review and approval by our admin team before access to teach is granted.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. Payments & Subscriptions</h2>
              <p>Payments are processed securely via Paystack. Subscription plans (trial, monthly, 3, 6, or 12 months) are set individually by each tutor. Renewing before expiry adds the new period on top of any remaining time. Fees paid are generally non-refundable except at Loran EduHub's discretion or as required by law.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Withdrawal from a Course</h2>
              <p>Students may withdraw from a course at any time from their dashboard. Withdrawal ends access to that course immediately. No refund is issued for the remaining subscription period.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. Tutor Earnings & Payouts</h2>
              <p>Tutors receive payment for enrollments minus a platform service fee, the rate of which may be adjusted by Loran EduHub from time to time. Payouts are processed to the bank details a tutor provides and confirms via our platform. Loran EduHub is not liable for payouts sent to incorrect bank details supplied by the tutor.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Referral Program</h2>
              <p>Users who participate in our referral program earn a commission as described on the Refer & Earn page at the time of referral. Loran EduHub reserves the right to modify, suspend, or terminate the referral program, or to withhold commissions in cases of suspected fraud or abuse (including self-referral).</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Conduct</h2>
              <p>You agree not to misuse the Platform, including but not limited to: harassment of other users, sharing account access, circumventing payment systems, or posting false information. Violations may result in suspension or termination of your account.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Certificates</h2>
              <p>Certificates issued through the Platform (course completion or workshop participation) reflect performance data as recorded on the Platform. Loran EduHub makes no representation as to the recognition of these certificates by third parties, institutions, or employers.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">10. Limitation of Liability</h2>
              <p>Loran EduHub is provided "as is." We do not guarantee specific academic outcomes, exam results, or employment outcomes. To the fullest extent permitted by law, Loran EduHub shall not be liable for indirect, incidental, or consequential damages arising from use of the Platform.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">11. Changes to These Terms</h2>
              <p>We may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">12. Contact</h2>
              <p>Questions about these Terms can be directed to us via the Contact page or our Discord community.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
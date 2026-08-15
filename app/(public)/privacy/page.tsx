import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-7 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Information We Collect</h2>
              <p>We collect information you provide directly, including your name, email, phone number, and (for tutors) qualifications, bio, and bank details. We also collect information generated through your use of the Platform, such as enrollment history, grades, exam results, and payment records.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. Discord Integration</h2>
              <p>If you connect your Discord account, we store your Discord ID and username to manage server access and role assignment. We do not access your private Discord messages or servers unrelated to Loran EduHub.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
              <p>We use your information to operate the Platform — creating and managing your account, processing payments, connecting students with tutors, issuing certificates, sending important notifications (renewals, announcements, newsletters you can opt out of), and improving our services.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. Payment Information</h2>
              <p>Payments are processed by Paystack. We do not store your full card details on our servers. Tutor bank details provided for payouts are stored securely and protected by an email verification step before any changes take effect.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Information Sharing</h2>
              <p>We do not sell your personal information. Information is shared only: between a student and their chosen tutor (as necessary for teaching), with Paystack for payment processing, with Discord for server/role management, and where required by law.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. Reviews</h2>
              <p>When you leave a tutor review, your name is displayed in a privacy-conscious format (first name and last initial) alongside your rating and comment, publicly visible on that tutor's profile.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Data Retention</h2>
              <p>We retain your information for as long as your account is active and as needed to comply with legal obligations. If you delete your account, personal identifiers are anonymized; historical records tied to payments and enrollments may be retained for accounting purposes.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Your Rights</h2>
              <p>You may access, update, or delete your account information from your dashboard Settings at any time. You may also contact us to request a copy of your data or to raise privacy concerns.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Cookies</h2>
              <p>We use essential cookies to keep you logged in and, where applicable, to attribute referral sign-ups to the referrer who shared your invite link. We do not use cookies for third-party advertising.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Material changes will be communicated via the Platform or by email.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">11. Contact</h2>
              <p>For privacy-related questions or requests, please reach us via the Contact page or our Discord community.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FaqAccordion from '@/components/shared/FaqAccordion'

const CATEGORIES = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is Loran EduHub?',
        answer: 'Loran EduHub is a tutoring marketplace where verified tutors teach tech, languages, and exam-prep courses (WAEC, JAMB, NECO, IGCSE, IELTS, and more). Instead of fixed platform pricing, each tutor sets their own rates, and students choose the tutor that fits their budget and learning style. All actual teaching happens on Discord.',
      },
      {
        question: 'How do I register as a student?',
        answer: 'Click "Get Started" or "Register as Student," select the course(s) you want, choose a tutor for each one, then complete your details and pick a plan — trial, monthly, 3, 6, or 12 months. If you choose the free trial, your account activates immediately. Paid plans redirect you to secure Paystack checkout, and your account is created the moment payment is confirmed.',
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes — a 7-day free trial is available so you can experience a tutor\'s teaching before committing to a paid plan. Free trial access still includes course materials, joining the Discord server, and taking any available exams for that course.',
      },
      {
        question: 'How do I apply to become a tutor?',
        answer: 'Go to "Apply as a Tutor," fill in your professional bio, qualifications, a short video introduction, and select the courses you can teach. You\'ll also set your own pricing for monthly, 3, 6, and 12-month plans at this stage. Our admin team reviews every application — typically within 3-5 business days — before you can start teaching.',
      },
    ],
  },
  {
    title: 'Choosing a Tutor & Pricing',
    items: [
      {
        question: 'How is pricing determined?',
        answer: 'There is no fixed catalog price. Each approved tutor independently sets what they charge for monthly, 3-month, 6-month, and 1-year plans. When you\'re selecting a tutor for a course, you\'ll see their specific pricing and student reviews before choosing.',
      },
      {
        question: 'Can I enroll with different tutors for different courses?',
        answer: 'Yes. You can select a different tutor for each course you take, and pay for them together in one checkout, or enroll in an additional course later from the "Enroll & Withdraw" tab in your dashboard.',
      },
      {
        question: 'If my tutor changes their pricing, does it affect me?',
        answer: 'No. Whatever price you paid at enrollment is locked in for your current plan period. Pricing changes only affect new enrollments going forward.',
      },
      {
        question: 'Can I leave a review for my tutor?',
        answer: 'Yes — once you\'ve enrolled in a course (trial or paid), you can leave a star rating and written review from the "Reviews" tab in your student dashboard. Reviews appear publicly on that tutor\'s profile and course listings.',
      },
    ],
  },
  {
    title: 'Discord & Community',
    items: [
      {
        question: 'Why is Discord required?',
        answer: 'All live teaching, class discussions, assignments, and announcements happen inside your tutor\'s private Discord server. Connecting your Discord account is required to receive your course roles and access these channels.',
      },
      {
        question: 'What happens to my Discord roles when I enroll or my plan changes?',
        answer: 'Your Discord roles are synced automatically based on your active enrollments — course role, plan-tier role, and a general "Paid" role for paid plans. This updates automatically when you renew, and also runs on a daily check that catches expired subscriptions and removes access accordingly.',
      },
      {
        question: 'What happens to my Discord access if my subscription expires?',
        answer: 'Once your subscription end date passes, your course-specific role is automatically removed and replaced with an "Expired" role, cutting off access to that course\'s private channels — this happens without you needing to do anything.',
      },
      {
        question: 'I need help — how do I contact support?',
        answer: 'The fastest way is our Discord server\'s support ticket system — click "Open a Ticket," choose a category, and a private channel is created for you and our team. You can also reach us by email or phone from the Contact page.',
      },
    ],
  },
  {
    title: 'Courses, Exams & Certificates',
    items: [
      {
        question: 'How are exams graded?',
        answer: 'Multiple-choice, true/false, and fill-in-the-gap exam questions are graded instantly the moment you submit. Assignments that require manual review are graded by your tutor and appear in your Scores page once graded.',
      },
      {
        question: 'What is the Course Library?',
        answer: 'Tutors can build structured, chapter-by-chapter course material with rich text, links, and revision questions. Content unlocks sequentially as you progress, and your tutor can see how far you\'ve gotten.',
      },
      {
        question: 'How do certificates work?',
        answer: 'Once you have graded exams or assignments for a course, your tutor can issue a certificate of completion. Your classification — Distinction (80%+), Credit (60-79%), or Pass (45-59%) — is calculated automatically from your combined exam and assignment average. You can review and correct your name on the certificate once before downloading it.',
      },
      {
        question: 'Can I withdraw from a course?',
        answer: 'Yes, from the "Enroll & Withdraw" tab. Withdrawing ends your access to that course immediately and there\'s no refund for remaining time, but you\'ll be asked for a reason and optional feedback, which your tutor receives.',
      },
      {
        question: 'How does renewing my subscription work?',
        answer: 'From the "Renew Subscription" action on your dashboard, you can renew any course before or after it expires. If you renew while still active, the new period is added on top of your remaining days — you never lose time you\'ve already paid for.',
      },
    ],
  },
  {
    title: 'For Tutors',
    items: [
      {
        question: 'How do I get paid as a tutor?',
        answer: 'Set your bank account details from your dashboard\'s Payment Settings (protected by an email verification code for security). When a student pays, that amount — minus a platform service fee — is logged as a payout owed to you, which our admin team processes and confirms directly to your bank account.',
      },
      {
        question: 'Can I change my pricing after being approved?',
        answer: 'Yes, anytime from your dashboard Settings. Changes only apply to new enrollments — students already enrolled keep the price they originally signed up at.',
      },
      {
        question: 'Can I teach more than one course?',
        answer: 'Yes. You can add or remove courses you teach at any time from Settings, as long as you\'re teaching at least one course.',
      },
      {
        question: 'How do I create exams, assignments, and certificates?',
        answer: 'All of this is available from your tutor dashboard — create exams with multiple question types, post assignments for manual grading, post announcements and class schedules, and issue certificates once a student has enough graded work.',
      },
    ],
  },
  {
    title: 'Account & Settings',
    items: [
      {
        question: 'Can I switch to dark mode?',
        answer: 'Yes — both student and tutor dashboards have a theme toggle (Light / Dark / System) in Settings.',
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, from the "Danger Zone" section in Settings. This requires your password to confirm and cannot be undone. Any active enrollments are withdrawn as part of the deletion process.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Everything about registering, choosing a tutor, Discord, exams, certificates, and more.
            </p>
          </div>

          <div className="space-y-8">
            {CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">{cat.title}</h2>
                <FaqAccordion items={cat.items} />
              </div>
            ))}
          </div>

          <div className="mt-10 text-center bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-3">Still have questions?</p>
            <a href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
              Contact us or join our Discord →
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
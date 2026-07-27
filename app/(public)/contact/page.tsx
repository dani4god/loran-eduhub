// app/(public)/contact/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Mail, Phone, MessageSquare, Clock, ArrowRight } from 'lucide-react'

const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK || '#'

// TODO: replace with your real support email and phone number
const SUPPORT_EMAIL = 'support@loraneduhub.com'
const SUPPORT_PHONE = '+234 800 000 0000'

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-blue-950 to-purple-950 pt-32 pb-16 sm:pb-20">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-heading font-bold text-3xl sm:text-5xl text-white leading-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Questions about enrolling, becoming a tutor, or anything else? We're here to help —
              and our Discord community is the fastest place to reach us.
            </p>
          </div>
        </section>

        {/* ── CONTACT CARDS ── */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              {/* Email */}
              <div className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-student-light text-student flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-brand-dark text-base mb-1.5">Email Us</h3>
                <p className="text-gray-500 text-sm mb-4">We reply within 1–2 business days.</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-primary font-semibold text-sm hover:underline break-all">
                  {SUPPORT_EMAIL}
                </a>
              </div>

              {/* Phone */}
              <div className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-tutor-light text-tutor flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-brand-dark text-base mb-1.5">Call Us</h3>
                <p className="text-gray-500 text-sm mb-4">Mon–Fri, 9am–5pm WAT.</p>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-brand-primary font-semibold text-sm hover:underline">
                  {SUPPORT_PHONE}
                </a>
              </div>

              {/* Discord */}
              <div className="p-6 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-brand-dark text-base mb-1.5">Join Our Discord</h3>
                <p className="text-gray-500 text-sm mb-4">The fastest way to reach our team and community.</p>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-sm hover:underline">
                  Join the server <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Response time note */}
            <div className="mt-10 flex items-center justify-center gap-2.5 text-gray-500 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Fastest response: post your question in our Discord's support channel.</span>
            </div>
          </div>
        </section>

        {/* ── DISCORD CTA BANNER ── */}
        <section className="pb-16 sm:pb-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 sm:p-10 lg:p-14 text-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-xl sm:text-3xl text-white mb-3">
                  Prefer to Talk in Real Time?
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base max-w-lg mx-auto mb-7">
                  Join the Loran EduHub Discord server — connect directly with our team, other
                  students, and tutors.
                </p>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all hover:scale-105">
                  Join Our Discord Server
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
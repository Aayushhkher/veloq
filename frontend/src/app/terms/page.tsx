'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, TrendingUp, ChevronRight, RefreshCw } from 'lucide-react'
import SiteFooter from '@/components/layout/SiteFooter'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-black" /></div>
          <span className="font-bold text-[var(--text-primary)]">VeLOQ</span>
        </Link>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-secondary)]">Terms of Service</span>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-400" /></div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
              <p className="text-sm text-[var(--text-secondary)]">Last updated: 1 January 2025 · Version 1.0</p>
            </div>
          </div>
          <div className="space-y-8">
            {[
              { title: '1. Acceptance of Terms', content: 'By registering on VeLOQ, you agree to these Terms of Service, our Privacy Policy, and Refund Policy. You must be at least 18 years old and a resident of India to use this platform.' },
              { title: '2. User Obligations', content: 'You agree to provide accurate information, including your real PAN number for KYC purposes. You must not submit fraudulent survey responses, create multiple accounts, or attempt to manipulate the reward system. Violation results in immediate account suspension and forfeiture of earnings.' },
              { title: '3. Survey Rewards & Payments', content: 'Rewards are credited to your wallet upon successful survey submission. Withdrawals require KYC verification. TDS will be deducted as per Section 194-O of the Income Tax Act when applicable. VeLOQ reserves the right to withhold rewards if fraud is detected.' },
              { title: '4. Company Obligations', content: 'Companies posting surveys must provide accurate descriptions and pay the full budgeted amount upfront. VeLOQ charges a platform commission (displayed at checkout). Companies must not collect prohibited data categories including political opinions, religious beliefs, or biometric data.' },
              { title: '5. Content & Reviews', content: 'Survey responses and reviews must be genuine. Fake, incentivized, or misleading reviews violate IS 19000 standards and are prohibited. VeLOQ may remove non-compliant content and will retain records for 180 days per regulatory requirements.' },
              { title: '6. Limitation of Liability', content: 'VeLOQ is not liable for: delays in payment due to banking system failures; survey data quality issues caused by fraudulent respondents; tax implications beyond disclosed TDS obligations; or third-party service outages.' },
              { title: '7. Governing Law', content: 'These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka. Disputes under ₹1,00,000 shall be resolved via online dispute resolution per the Consumer Protection (E-Commerce) Rules 2020.' },
            ].map(s => (
              <section key={s.title}>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">{s.title}</h2>
                <div className="glass rounded-xl p-5 text-sm text-[var(--text-secondary)] leading-relaxed">{s.content}</div>
              </section>
            ))}
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}

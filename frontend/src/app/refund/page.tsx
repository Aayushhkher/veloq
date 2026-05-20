'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp, ChevronRight } from 'lucide-react'
import SiteFooter from '@/components/layout/SiteFooter'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-black" /></div>
          <span className="font-bold text-[var(--text-primary)]">VeLOQ</span>
        </Link>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-secondary)]">Refund & Withdrawal Policy</span>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-violet-400" /></div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Refund & Withdrawal Policy</h1>
              <p className="text-sm text-[var(--text-secondary)]">Last updated: 1 January 2025</p>
            </div>
          </div>
          <div className="space-y-8">
            {[
              { title: 'User Withdrawals', content: 'Users can request withdrawals once their wallet balance reaches ₹50 (minimum). KYC verification (PAN) is mandatory for withdrawals above ₹10,000. Withdrawals are processed within 3–5 business days via UPI. TDS is deducted per Section 194-O when applicable. Withdrawals cannot be cancelled once approved.' },
              { title: 'Company Refunds', content: 'Companies receive a refund of unspent survey budget if: (a) a survey is rejected by admin, or (b) a survey is cancelled before reaching 50% of target responses. The platform commission is non-refundable once a survey goes live. Refunds are credited to the company wallet within 2 business days.' },
              { title: 'TDS on Withdrawals', content: 'TDS at 10% is deducted when your annual income on the platform exceeds ₹30,000 (Section 194-O, Income Tax Act). A Form 16A (TDS certificate) is generated automatically and available for download in your account. TDS amounts are remitted to the Income Tax Department on your behalf.' },
              { title: 'Disputes & Escalation', content: 'Withdrawal disputes must be raised within 7 days of the transaction. Submit a grievance at our Grievance Redressal Portal. If unresolved, you may escalate to the Consumer Forum as per Consumer Protection Act 2019. All dispute resolutions are final within 30 days of complaint registration.' },
              { title: 'Payment Gateway Failures', content: 'In case of payment gateway failure, the amount will be reversed to your wallet within 24 hours. Contact support@veloq.in with your transaction ID for expedited resolution.' },
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

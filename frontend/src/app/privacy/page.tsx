'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ChevronRight, TrendingUp, Lock, Eye, Database, UserX, Bell, HelpCircle } from 'lucide-react'
import SiteFooter from '@/components/layout/SiteFooter'

export default function PrivacyPage() {
  const sections = [
    { id: 'collection', title: 'Data We Collect', icon: Database },
    { id: 'use', title: 'How We Use Your Data', icon: Eye },
    { id: 'rights', title: 'Your Rights (DPDP Act 2023)', icon: Shield },
    { id: 'retention', title: 'Data Retention', icon: Lock },
    { id: 'disclosure', title: 'Disclosure to Third Parties', icon: UserX },
    { id: 'contact', title: 'Contact & Grievance Officer', icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-black" /></div>
          <span className="font-bold text-[var(--text-primary)]">VeLOQ</span>
        </Link>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-secondary)]">Privacy Policy</span>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
              <p className="text-sm text-[var(--text-secondary)]">Last updated: 1 January 2025 · Version 1.0</p>
            </div>
          </div>

          <div className="p-4 glass rounded-xl border border-emerald-500/20 mb-8">
            <p className="text-sm text-[var(--text-secondary)]">This policy complies with the <strong className="text-[var(--text-primary)]">Digital Personal Data Protection (DPDP) Act 2023</strong> and the <strong className="text-[var(--text-primary)]">Information Technology Act 2000</strong>. VeLOQ Platform Pvt Ltd is the <strong className="text-[var(--text-primary)]">Data Fiduciary</strong> responsible for your personal data.</p>
          </div>

          <div className="space-y-8">
            <section id="collection">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">1. Data We Collect</h2>
              <div className="glass rounded-xl p-5 space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                <p><strong className="text-[var(--text-primary)]">Account Data:</strong> Name, email address, phone number, and profile photo when you register.</p>
                <p><strong className="text-[var(--text-primary)]">Financial Data:</strong> UPI ID, PAN number (for KYC/TDS compliance), wallet transactions, and withdrawal history.</p>
                <p><strong className="text-[var(--text-primary)]">Survey Data:</strong> Your responses to surveys, time taken, and rewards earned.</p>
                <p><strong className="text-[var(--text-primary)]">Device & Usage Data:</strong> IP address, browser type, and pages visited — for security and fraud prevention only.</p>
                <p><strong className="text-[var(--text-primary)]">Consent Records:</strong> A record of every consent you grant or withdraw, with timestamp and IP, as required by the DPDP Act.</p>
              </div>
            </section>

            <section id="use">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">2. How We Use Your Data</h2>
              <div className="glass rounded-xl p-5 space-y-2 text-sm text-[var(--text-secondary)]">
                {['Process survey responses and reward payments', 'Verify identity for KYC/PAN (PMLA 2002 compliance)', 'Calculate and deduct TDS (Section 194-O, Income Tax Act)', 'Generate audit trails for regulatory compliance', 'Detect fraud and ensure platform security', 'Send service notifications (not marketing, unless you opt in)', 'Resolve grievances and complaints'].map(item => (
                  <div key={item} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>{item}</span></div>
                ))}
                <p className="pt-2 border-t border-[var(--border)]"><strong className="text-[var(--text-primary)]">We never sell your personal data to third parties.</strong></p>
              </div>
            </section>

            <section id="rights">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">3. Your Rights Under DPDP Act 2023</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'Right to Access', desc: 'Request a copy of all personal data we hold about you.' },
                  { title: 'Right to Correction', desc: 'Correct inaccurate or incomplete personal data in your profile.' },
                  { title: 'Right to Erasure', desc: 'Delete your account and personal data permanently (Section 12).' },
                  { title: 'Right to Data Portability', desc: 'Download all your data as a structured JSON file.' },
                  { title: 'Right to Withdraw Consent', desc: 'Withdraw marketing or optional processing consent at any time.' },
                  { title: 'Right to Grievance Redressal', desc: 'File a complaint with our Grievance Officer within 30 days.' },
                ].map(r => (
                  <div key={r.title} className="glass rounded-xl p-4">
                    <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">{r.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{r.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-4">Exercise these rights via your <Link href="/dashboard/profile" className="text-emerald-400 hover:underline">Privacy Portal</Link> or email <a href="mailto:privacy@veloq.in" className="text-emerald-400 hover:underline">privacy@veloq.in</a>.</p>
            </section>

            <section id="retention">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">4. Data Retention</h2>
              <div className="glass rounded-xl p-5 text-sm text-[var(--text-secondary)] space-y-2">
                <p>• Account data: Retained until account deletion + 30 days for recovery.</p>
                <p>• Financial/TDS records: 7 years (statutory requirement under Income Tax Act).</p>
                <p>• Removed reviews: 180 days (IS 19000 requirement).</p>
                <p>• Breach logs: 5 years (DPDP Act requirement).</p>
                <p>• Consent records: Life of the account + 3 years.</p>
              </div>
            </section>

            <section id="contact">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">6. Grievance Officer</h2>
              <div className="glass rounded-xl p-5 text-sm text-[var(--text-secondary)] space-y-2">
                <p><strong className="text-[var(--text-primary)]">Name:</strong> Rajesh Kumar Sharma</p>
                <p><strong className="text-[var(--text-primary)]">Designation:</strong> Grievance & Compliance Officer</p>
                <p><strong className="text-[var(--text-primary)]">Email:</strong> <a href="mailto:grievance@veloq.in" className="text-emerald-400 hover:underline">grievance@veloq.in</a></p>
                <p><strong className="text-[var(--text-primary)]">Address:</strong> WeWork Galaxy, Residency Road, Bengaluru, Karnataka — 560025</p>
                <p><strong className="text-[var(--text-primary)]">Phone:</strong> +91 80 4567 8902</p>
                <p className="pt-2 border-t border-[var(--border)]">Grievances will be acknowledged within 48 hours and resolved within 30 days per IT Act 2000.</p>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}

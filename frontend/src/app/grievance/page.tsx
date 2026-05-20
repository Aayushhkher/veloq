'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HelpCircle, TrendingUp, ChevronRight, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import SiteFooter from '@/components/layout/SiteFooter'
import toast from 'react-hot-toast'

const CATEGORIES = ['payment', 'survey', 'account', 'privacy', 'fraud', 'other']

export default function GrievancePage() {
  const [form, setForm] = useState({ category: 'payment', subject: '', description: '', name: '', email: '' })
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.subject || !form.description) { toast.error('Please fill all required fields'); return }
    setLoading(true)
    try {
      const r = await api.post('/compliance/grievance', { category: form.category, subject: form.subject, description: form.description })
      setSubmitted(r.data.ticket_number)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to submit grievance')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-black" /></div>
          <span className="font-bold text-[var(--text-primary)]">VeLOQ</span>
        </Link>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-secondary)]">Grievance Redressal</span>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-amber-400" /></div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Grievance Redressal</h1>
              <p className="text-sm text-[var(--text-secondary)]">Consumer Protection Act 2019 · IT Act 2000</p>
            </div>
          </div>

          {/* Grievance Officer info */}
          <div className="glass rounded-2xl p-5 mb-8 border border-amber-500/10">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3">Grievance Officer</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1 text-[var(--text-secondary)]">
                <p><strong className="text-[var(--text-primary)]">Name:</strong> Rajesh Kumar Sharma</p>
                <p><strong className="text-[var(--text-primary)]">Designation:</strong> Grievance & Compliance Officer</p>
                <p><strong className="text-[var(--text-primary)]">Email:</strong> <a href="mailto:grievance@veloq.in" className="text-emerald-400 hover:underline">grievance@veloq.in</a></p>
              </div>
              <div className="space-y-1 text-[var(--text-secondary)]">
                <p><strong className="text-[var(--text-primary)]">Phone:</strong> +91 80 4567 8902</p>
                <p><strong className="text-[var(--text-primary)]">Address:</strong> WeWork Galaxy, Residency Road, Bengaluru — 560025</p>
                <p><strong className="text-[var(--text-primary)]">Response Time:</strong> Within 30 days</p>
              </div>
            </div>
          </div>

          {submitted ? (
            <motion.div className="glass rounded-2xl p-10 text-center border border-emerald-500/20" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">Grievance Registered</h2>
              <p className="text-[var(--text-secondary)] mb-4">Your unique registration number is:</p>
              <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-3 mb-6">
                <span className="font-mono text-lg font-bold text-emerald-400">{submitted}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Save this number. You will receive a response within <strong className="text-[var(--text-primary)]">30 days</strong> as required by the IT Act 2000.</p>
              <button onClick={() => setSubmitted(null)} className="mt-6 px-5 py-2.5 glass rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Submit Another</button>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-display font-semibold text-[var(--text-primary)]">File a Complaint</h2>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60 transition-all capitalize">
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Subject *</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue"
                  className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60 transition-all" />
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={5}
                  placeholder="Describe your complaint in detail. Include transaction IDs, dates, and any relevant information..."
                  className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60 transition-all resize-none" />
              </div>

              <div className="flex items-start gap-2 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-secondary)]">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>You must be logged in to track your complaint status. You will receive a Unique Registration Number upon submission.</span>
              </div>

              <button onClick={handleSubmit} disabled={loading || !form.subject || !form.description}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all">
                {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Submit Grievance</>}
              </button>
            </div>
          )}
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}

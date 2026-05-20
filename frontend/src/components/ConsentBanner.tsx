'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Eye, Bell } from 'lucide-react'
import { api } from '@/lib/api'

export default function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const given = localStorage.getItem('consent_given')
    if (!given) setTimeout(() => setShow(true), 800)
  }, [])

  const handleAccept = async (acceptAll: boolean) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await api.post('/compliance/consent/grant', {
          terms: true, privacy: true,
          marketing: acceptAll || marketing,
          data_processing: true, version: '1.0',
        })
      }
    } catch {}
    localStorage.setItem('consent_given', '1')
    setSaving(false)
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-8 pointer-events-none flex justify-center"
            initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
          >
            <div className="w-full max-w-2xl bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border)] rounded-[2.5rem] shadow-apple-lg overflow-hidden pointer-events-auto">
              <div className="p-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] flex items-center justify-center flex-shrink-0 shadow-apple-sm">
                    <Shield className="w-6 h-6 text-[var(--bg-primary)]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Your privacy, absolute control.</h2>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium">
                      We collect data to operate the platform and comply with Indian law (DPDP Act 2023). We never sell your data. You can download or delete your data anytime.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <div className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]">
                        <input
                          id="marketing-consent" type="checkbox"
                          checked={marketing} onChange={e => setMarketing(e.target.checked)}
                          className="w-5 h-5 rounded-md border-[var(--border)] accent-[var(--text-primary)] cursor-pointer flex-shrink-0"
                        />
                        <label htmlFor="marketing-consent" className="text-xs text-[var(--text-primary)] cursor-pointer font-medium leading-tight">
                          Send me survey recommendations and platform updates (optional)
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleAccept(true)}
                        disabled={saving}
                        className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full text-sm bg-[var(--text-primary)] hover:scale-[1.02] text-[var(--bg-primary)] font-bold transition-transform disabled:opacity-50"
                      >
                        {saving ? <span className="w-5 h-5 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" /> : 'Accept & Continue'}
                      </button>
                      <button
                        onClick={() => handleAccept(false)}
                        disabled={saving}
                        className="w-full sm:flex-1 px-6 py-4 rounded-full text-sm bg-[var(--input-bg)] text-[var(--text-primary)] font-semibold hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                      >
                        Essential Only
                      </button>
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-6 text-xs text-[var(--text-muted)] font-medium">
                      <a href="/privacy" className="hover:text-[var(--text-primary)] transition-colors underline underline-offset-4">Privacy Policy</a>
                      <a href="/terms" className="hover:text-[var(--text-primary)] transition-colors underline underline-offset-4">Terms of Service</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

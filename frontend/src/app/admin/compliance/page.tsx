'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Download, AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const SEVERITY_COLORS: Record<string, string> = { low: 'badge-blue', medium: 'badge-amber', high: 'badge-red', critical: 'text-red-300 bg-red-500/20 border border-red-400/30' }

export default function AdminCompliancePage() {
  const [breaches, setBreaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', affected_users_count: 0, data_categories_affected: [''] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/compliance/admin/breaches'); setBreaches(r.data) }
    catch { toast.error('Failed to load breach logs') } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/compliance/admin/breach', { ...form, data_categories_affected: form.data_categories_affected.filter(Boolean) })
      toast.success('Breach logged and incident ID generated')
      setShowForm(false); load()
    } catch { toast.error('Failed to log breach') } finally { setSaving(false) }
  }

  const downloadReport = async (id: number) => {
    try {
      const r = await api.get(`/compliance/admin/breach/${id}/report`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = `incident_report_${id}.json`; a.click()
    } catch { toast.error('Report generation failed') }
  }

  const downloadAudit = async () => {
    try {
      const r = await api.get('/compliance/admin/audit-trail', { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'audit_trail.csv'; a.click()
      toast.success('Audit trail downloaded')
    } catch { toast.error('Export failed') }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Compliance Center</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">DPDP Act 2023 · Data Breach Logging · Audit Trails</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadAudit} className="flex items-center gap-2 badge-blue px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-all">
              <Download className="w-4 h-4" />Export Audit Trail
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all">
              <Plus className="w-4 h-4" />Log Breach
            </button>
          </div>
        </div>

        {/* Log Breach Modal */}
        {showForm && (
          <div className="glass rounded-2xl p-6 border border-red-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Log Data Breach Incident</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-300">
              ⚠️ Under DPDP Act 2023, breaches must be reported to CERT-In within 6 hours of detection. This log generates an incident report for regulatory notification.
            </div>
            {[{ label: 'Title', key: 'title', type: 'input', placeholder: 'Brief incident title' }, { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Detailed description of the breach...' }].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{f.label}</label>
                {f.type === 'input' ? (
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/60 transition-all" />
                ) : (
                  <textarea value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} placeholder={f.placeholder} className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/60 transition-all resize-none" />
                )}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Severity</label>
                <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/60">
                  {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s} className="capitalize">{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Affected Users</label>
                <input type="number" value={form.affected_users_count} onChange={e => setForm(p => ({ ...p, affected_users_count: parseInt(e.target.value) || 0 }))} className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/60" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={saving || !form.title || !form.description} className="flex items-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-[var(--text-primary)] font-bold px-6 py-3 rounded-xl text-sm transition-all">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><AlertTriangle className="w-4 h-4" />Log Incident</>}
            </button>
          </div>
        )}

        {/* Breach log list */}
        <div>
          <h2 className="font-display font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-red-400" />Breach Incident Log</h2>
          {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>
            : breaches.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-[var(--text-secondary)]">No breach incidents logged</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breaches.map(b => (
                  <motion.div key={b.id} className="glass rounded-2xl p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-red-400 font-bold">{b.incident_id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[b.severity] || 'badge-zinc'}`}>{b.severity.toUpperCase()}</span>
                          <span className="text-[10px] badge-zinc px-2 py-0.5 rounded-full">{b.status.toUpperCase()}</span>
                        </div>
                        <p className="font-medium text-[var(--text-primary)]">{b.title}</p>
                        <div className="text-xs text-[var(--text-secondary)] mt-1 flex gap-3 flex-wrap">
                          <span>Affected: {b.affected_users_count} users</span>
                          <span>·</span>
                          <span>Detected: {timeAgo(b.detected_at)}</span>
                        </div>
                      </div>
                      <button onClick={() => downloadReport(b.id)} className="flex items-center gap-1.5 text-xs badge-blue px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all flex-shrink-0">
                        <Download className="w-3.5 h-3.5" />Report
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  )
}

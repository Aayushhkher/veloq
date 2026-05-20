'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, XCircle, X } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminAPI } from '@/lib/api'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'pending', 'active', 'completed', 'rejected']

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = (status: string) => {
    setLoading(true)
    adminAPI.getSurveys(status === 'all' ? undefined : status)
      .then(res => setSurveys(res.data))
      .catch(() => toast.error('Failed to load surveys'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(filter) }, [filter])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      await adminAPI.surveyAction(id, 'approve')
      toast.success('Survey approved!')
      setSurveys(prev => filter === 'pending' ? prev.filter(s => s.id !== id) : prev.map(s => s.id === id ? { ...s, status: 'active' } : s))
    } catch { toast.error('Failed to approve') }
    finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id)
    try {
      await adminAPI.surveyAction(rejectModal.id, 'reject', rejectReason)
      toast.success('Survey rejected')
      setSurveys(prev => filter === 'pending' ? prev.filter(s => s.id !== rejectModal.id) : prev.map(s => s.id === rejectModal.id ? { ...s, status: 'rejected' } : s))
      setRejectModal(null)
      setRejectReason('')
    } catch { toast.error('Failed to reject') }
    finally { setActionLoading(null) }
  }

  const filtered = surveys.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Survey Management</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{surveys.length} surveys</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search surveys..."
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div className="flex gap-1 glass rounded-xl p-1">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === s ? 'bg-[var(--input-bg)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <p className="text-[var(--text-secondary)]">No surveys found</p>
            </div>
          ) : filtered.map((survey, i) => (
            <motion.div
              key={survey.id}
              className="glass rounded-2xl p-5 border border-[var(--border)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-[var(--text-primary)]">{survey.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(survey.status)}`}>
                      {survey.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--text-secondary)]">{survey.company_name}</span>
                    <span>·</span>
                    <span className="text-emerald-400">{formatCurrency(survey.reward_per_response)}/response</span>
                    <span>·</span>
                    <span>{survey.current_responses}/{survey.max_responses} responses</span>
                    <span>·</span>
                    <span>Budget: {formatCurrency(survey.total_budget)}</span>
                    <span>·</span>
                    <span>{timeAgo(survey.created_at)}</span>
                  </div>
                </div>
                {survey.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(survey.id)}
                      disabled={actionLoading === survey.id}
                      className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: survey.id, title: survey.title })}
                      disabled={actionLoading === survey.id}
                      className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass rounded-2xl p-6 w-full max-w-md border border-[var(--border)]" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[var(--text-primary)]">Reject Survey</h2>
                <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">"{rejectModal.title}"</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional, will be shown to company)"
                rows={3}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 glass glass-hover py-2.5 rounded-xl text-sm text-[var(--text-secondary)]">Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-[var(--text-primary)] font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Reject Survey'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

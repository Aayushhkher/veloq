'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Flag, Trash2, Eye, CheckCircle2, AlertTriangle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { const r = await api.get(`/compliance/admin/reviews${filter ? `?status=${filter}` : ''}`); setReviews(r.data) }
    catch { toast.error('Failed to load reviews') } finally { setLoading(false) }
  }

  const handleRemove = async (id: number) => {
    const reason = prompt('Removal reason (required for IS 19000 compliance):')
    if (!reason) return
    setRemoving(id)
    try {
      await api.patch(`/compliance/admin/reviews/${id}/remove?reason=${encodeURIComponent(reason)}`)
      toast.success('Review removed. Retained for 180 days per IS 19000.')
      load()
    } catch { toast.error('Removal failed') } finally { setRemoving(null) }
  }

  const STATUS_COLORS: Record<string, string> = { active: 'badge-emerald', flagged: 'badge-amber', removed: 'badge-red', restored: 'badge-blue' }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Review Moderation</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">IS 19000 compliance · Removed reviews retained 180 days</p>
        </div>

        {/* Info banner */}
        <div className="glass rounded-xl p-4 border border-amber-500/10 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--text-secondary)]">Per <strong className="text-[var(--text-primary)]">IS 19000</strong> (Indian Standard for Online Reviews), all removed reviews and their removal reasons must be retained for a minimum of <strong className="text-[var(--text-primary)]">180 days</strong>. This dashboard ensures compliance.</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'active', 'flagged', 'removed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === s ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {s === '' ? 'All Reviews' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">No reviews to moderate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <motion.div key={r.id} className="glass rounded-2xl p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'badge-zinc'}`}>{r.status.toUpperCase()}</span>
                      <span className="text-xs text-[var(--text-secondary)]">Response #{r.survey_response_id} · User #{r.user_id}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.flag_reason && <p className="text-sm text-amber-400 mb-1">🚩 Flag reason: {r.flag_reason}</p>}
                    {r.removal_reason && <p className="text-sm text-red-400 mb-1">🗑 Removed: {r.removal_reason}</p>}
                    {r.retention_until && <p className="text-xs text-[var(--text-secondary)]">Retained until: {new Date(r.retention_until).toLocaleDateString('en-IN')}</p>}
                  </div>
                  {r.status !== 'removed' && (
                    <button onClick={() => handleRemove(r.id)} disabled={removing === r.id} className="flex items-center gap-1.5 text-xs badge-red px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all flex-shrink-0 disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />Remove
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

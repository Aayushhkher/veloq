'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X, Wallet } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<number | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const load = (status: string) => {
    setLoading(true)
    adminAPI.getWithdrawals(status === 'all' ? undefined : status)
      .then(res => setWithdrawals(res.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(filter) }, [filter])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      await adminAPI.withdrawalAction(id, 'approve', 'Approved by admin')
      toast.success('Withdrawal approved!')
      setWithdrawals(prev => filter === 'pending' ? prev.filter(w => w.id !== id) : prev.map(w => w.id === id ? { ...w, status: 'approved' } : w))
    } catch { toast.error('Failed') }
    finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try {
      await adminAPI.withdrawalAction(rejectModal, 'reject', rejectNote)
      toast.success('Withdrawal rejected, amount refunded')
      setWithdrawals(prev => prev.filter(w => w.id !== rejectModal))
      setRejectModal(null)
      setRejectNote('')
    } catch { toast.error('Failed') }
    finally { setActionLoading(null) }
  }

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Withdrawals</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {filter === 'pending' && totalPending > 0 && (
                <span className="text-amber-400">₹{totalPending.toFixed(2)} pending approval</span>
              )}
            </p>
          </div>
          <div className="flex gap-1 glass rounded-xl p-1">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
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
          ) : withdrawals.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Wallet className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">No withdrawals found</p>
            </div>
          ) : withdrawals.map((wd, i) => (
            <motion.div
              key={wd.id}
              className="glass rounded-2xl p-5 border border-[var(--border)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[var(--text-primary)]">{wd.user_name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(wd.status)}`}>
                      {wd.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                    <span>{wd.user_email}</span>
                    <span>·</span>
                    <span>UPI: <span className="text-[var(--text-secondary)]">{wd.upi_id}</span></span>
                    <span>·</span>
                    <span>{formatDateTime(wd.requested_at)}</span>
                  </div>
                  {wd.admin_notes && <p className="text-xs text-[var(--text-muted)] mt-1 italic">Note: {wd.admin_notes}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-display font-bold text-[var(--text-primary)] text-lg">{formatCurrency(wd.amount)}</span>
                  {wd.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(wd.id)}
                        disabled={actionLoading === wd.id}
                        className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(wd.id)}
                        disabled={actionLoading === wd.id}
                        className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal !== null && (
          <motion.div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass rounded-2xl p-6 w-full max-w-md border border-[var(--border)]" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[var(--text-primary)]">Reject Withdrawal</h2>
                <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">The amount will be refunded to the user's wallet.</p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Reason for rejection (shown to user)"
                rows={3}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 glass glass-hover py-2.5 rounded-xl text-sm text-[var(--text-secondary)]">Cancel</button>
                <button onClick={handleReject} disabled={!!actionLoading}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-[var(--text-primary)] font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Reject & Refund'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

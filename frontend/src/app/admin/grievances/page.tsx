'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Clock, CheckCircle2, AlertCircle, Filter, ChevronDown } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  open: 'badge-red', in_review: 'badge-amber', escalated: 'badge-violet',
  resolved: 'badge-emerald', closed: 'badge-zinc',
}

export default function AdminGrievancesPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/compliance/admin/grievances${filter ? `?status=${filter}` : ''}`)
      setTickets(r.data)
    } catch { toast.error('Failed to load grievances') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdating(id)
    try {
      await api.patch(`/compliance/admin/grievances/${id}`, { status })
      toast.success('Ticket updated')
      load()
    } catch { toast.error('Update failed') } finally { setUpdating(null) }
  }

  const counts = { open: tickets.filter(t => t.status === 'open').length, in_review: tickets.filter(t => t.status === 'in_review').length, resolved: tickets.filter(t => t.status === 'resolved').length }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Grievance Management</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Consumer Protection Act 2019 · IT Act 2000 · 30-day SLA</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Open', count: counts.open, cls: 'badge-red' }, { label: 'In Review', count: counts.in_review, cls: 'badge-amber' }, { label: 'Resolved', count: counts.resolved, cls: 'badge-emerald' }].map(s => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <p className={`font-display text-2xl font-bold mb-1 ${s.cls.includes('red') ? 'text-red-400' : s.cls.includes('amber') ? 'text-amber-400' : 'text-emerald-400'}`}>{s.count}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'in_review', 'escalated', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === s ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">No grievances found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <motion.div key={t.id} className="glass rounded-2xl p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-emerald-400 font-bold">{t.ticket_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'badge-zinc'}`}>{t.status.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-xs badge-blue px-2 py-0.5 rounded-full capitalize">{t.category}</span>
                    </div>
                    <p className="font-medium text-[var(--text-primary)] truncate">{t.subject}</p>
                    <div className="flex gap-3 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
                      <span>{t.user_name} · {t.user_email}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(t.created_at)}</span>
                      {t.due_date && <span className={`flex items-center gap-1 ${new Date(t.due_date) < new Date() ? 'text-red-400' : ''}`}><AlertCircle className="w-3 h-3" />Due: {new Date(t.due_date).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {t.status === 'open' && (
                      <button onClick={() => handleStatusUpdate(t.id, 'in_review')} disabled={updating === t.id} className="text-xs badge-amber px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-50">
                        Start Review
                      </button>
                    )}
                    {t.status === 'in_review' && (
                      <button onClick={() => handleStatusUpdate(t.id, 'resolved')} disabled={updating === t.id} className="text-xs badge-emerald px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, ClipboardList, Wallet, TrendingUp, Building2, AlertCircle, CheckCircle2, XCircle, Activity } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import { adminAPI } from '@/lib/api'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = async () => {
    try {
      const [statsRes, surveysRes, wdRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getSurveys('pending'),
        adminAPI.getWithdrawals('pending'),
      ])
      setStats(statsRes.data)
      setSurveys(surveysRes.data.slice(0, 5))
      setWithdrawals(wdRes.data.slice(0, 5))
    } catch { toast.error('Failed to load admin data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSurveyAction = async (id: number, action: string) => {
    const key = `survey-${id}`
    setActionLoading(key)
    try {
      await adminAPI.surveyAction(id, action)
      toast.success(`Survey ${action}d`)
      setSurveys(prev => prev.filter(s => s.id !== id))
      setStats((prev: any) => prev ? { ...prev, active_surveys: action === 'approve' ? prev.active_surveys + 1 : prev.active_surveys } : prev)
    } catch { toast.error('Action failed') }
    finally { setActionLoading(null) }
  }

  const handleWithdrawalAction = async (id: number, action: string) => {
    const key = `wd-${id}`
    setActionLoading(key)
    try {
      await adminAPI.withdrawalAction(id, action)
      toast.success(`Withdrawal ${action}d`)
      setWithdrawals(prev => prev.filter(w => w.id !== id))
    } catch { toast.error('Action failed') }
    finally { setActionLoading(null) }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Admin Overview</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Platform metrics and pending actions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.total_users || 0} icon={Users} color="emerald" delay={0.05} />
          <StatCard title="Total Companies" value={stats?.total_companies || 0} icon={Building2} color="blue" delay={0.1} />
          <StatCard title="Active Surveys" value={stats?.active_surveys || 0} icon={Activity} color="amber" delay={0.15} />
          <StatCard title="Platform Revenue" value={formatCurrency(stats?.platform_earnings || 0)} icon={TrendingUp} color="violet" delay={0.2} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{stats?.total_surveys || 0}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Total Surveys</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{stats?.total_responses || 0}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Total Responses</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-amber-500/20">
            <p className="font-display text-2xl font-bold text-amber-400">{stats?.pending_withdrawals || 0}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Pending Withdrawals</p>
          </div>
        </div>

        {/* Pending Surveys */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Surveys Awaiting Approval
              {surveys.length > 0 && <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{surveys.length}</span>}
            </h2>
            <Link href="/admin/surveys" className="text-sm text-[var(--text-secondary)] hover:text-emerald-400">View all →</Link>
          </div>

          {surveys.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-[var(--text-secondary)] text-sm">All surveys reviewed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {surveys.map(survey => (
                <div key={survey.id} className="glass rounded-2xl p-5 border border-amber-500/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{survey.title}</p>
                      <div className="flex gap-3 text-xs text-[var(--text-secondary)] mt-1">
                        <span>{survey.company_name}</span>
                        <span>·</span>
                        <span className="text-emerald-400">{formatCurrency(survey.reward_per_response)}/response</span>
                        <span>·</span>
                        <span>{survey.max_responses} max</span>
                        <span>·</span>
                        <span>Budget: {formatCurrency(survey.total_budget)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSurveyAction(survey.id, 'approve')}
                        disabled={actionLoading === `survey-${survey.id}`}
                        className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleSurveyAction(survey.id, 'reject')}
                        disabled={actionLoading === `survey-${survey.id}`}
                        className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-400" />
              Pending Withdrawals
              {withdrawals.length > 0 && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{withdrawals.length}</span>}
            </h2>
            <Link href="/admin/withdrawals" className="text-sm text-[var(--text-secondary)] hover:text-emerald-400">View all →</Link>
          </div>

          {withdrawals.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-[var(--text-secondary)] text-sm">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(wd => (
                <div key={wd.id} className="glass rounded-2xl p-5 border border-blue-500/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)]">{wd.user_name}</p>
                      <div className="flex gap-3 text-xs text-[var(--text-secondary)] mt-1">
                        <span>{wd.user_email}</span>
                        <span>·</span>
                        <span>UPI: {wd.upi_id}</span>
                        <span>·</span>
                        <span>{timeAgo(wd.requested_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--text-primary)]">{formatCurrency(wd.amount)}</span>
                      <button
                        onClick={() => handleWithdrawalAction(wd.id, 'approve')}
                        disabled={actionLoading === `wd-${wd.id}`}
                        className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(wd.id, 'reject')}
                        disabled={actionLoading === `wd-${wd.id}`}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

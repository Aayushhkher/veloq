'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, ClipboardList, Wallet, TrendingUp, Building2,
  AlertCircle, CheckCircle2, XCircle, Activity, Sparkles,
  ShieldAlert, ArrowRight, DollarSign, Check, X, RefreshCw
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import { adminAPI } from '@/lib/api'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLORS_PIE = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#71717a']

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeQueueTab, setActiveQueueTab] = useState<'surveys' | 'withdrawals'>('surveys')

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, surveysRes, wdRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getSurveys('pending'),
        adminAPI.getWithdrawals('pending'),
      ])
      setStats(statsRes.data)
      setSurveys(surveysRes.data)
      setWithdrawals(wdRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSurveyAction = async (id: number, action: string) => {
    const key = `survey-${id}`
    setActionLoading(key)
    try {
      await adminAPI.surveyAction(id, action)
      toast.success(`Survey ${action}d successfully`)
      setSurveys(prev => prev.filter(s => s.id !== id))
      setStats((prev: any) =>
        prev
          ? {
              ...prev,
              active_surveys: action === 'approve' ? prev.active_surveys + 1 : prev.active_surveys,
            }
          : prev
      )
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleWithdrawalAction = async (id: number, action: string) => {
    const key = `wd-${id}`
    setActionLoading(key)
    try {
      await adminAPI.withdrawalAction(id, action)
      toast.success(`Withdrawal ${action}d successfully`)
      setWithdrawals(prev => prev.filter(w => w.id !== id))
      setStats((prev: any) =>
        prev
          ? {
              ...prev,
              pending_withdrawals: Math.max((prev.pending_withdrawals || 1) - 1, 0),
            }
          : prev
      )
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const totalGrossVolume = (stats?.total_user_earnings || 0) + (stats?.platform_earnings || 0)

  // Format Top Companies
  const companySpendData = Object.entries(stats?.company_payments || {})
    .map(([name, val]) => ({ name, value: Number(val) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Format Top Users
  const userEarningsData = Object.entries(stats?.earnings_per_user || {})
    .map(([name, val]) => ({ name, value: Number(val) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Admin Executive Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-500/[0.08] via-transparent to-emerald-500/[0.05] p-6 rounded-3xl border border-white/5 relative overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> PLATFORM SUPERADMIN
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Live Operations Center</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Global marketplace volume, billing division, survey verification queue, and user withdrawals
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={load}
              className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 text-[var(--text-secondary)] hover:text-white bg-[var(--input-bg)] transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-violet-600/20"
            >
              Manage Users <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Top KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Platform Commission"
            value={formatCurrency(stats?.platform_earnings || 0)}
            subtitle="Platform gross revenue"
            icon={TrendingUp}
            color="violet"
            delay={0.05}
          />
          <StatCard
            title="User Payouts"
            value={formatCurrency(stats?.total_user_earnings || 0)}
            subtitle="Distributed research rewards"
            icon={Wallet}
            color="emerald"
            delay={0.1}
          />
          <StatCard
            title="Registered Users"
            value={stats?.total_users || 0}
            subtitle={`${stats?.total_companies || 0} active companies`}
            icon={Users}
            color="blue"
            delay={0.15}
          />
          <StatCard
            title="Active Surveys"
            value={stats?.active_surveys || 0}
            subtitle={`${stats?.total_responses || 0} responses recorded`}
            icon={Activity}
            color="amber"
            delay={0.2}
          />
        </div>

        {/* Volume & Revenue Financial Analytics Charts */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Financial & Revenue Analytics</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Platform billing division, top company deployments, and contributor reward shares</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chart 1: Global Share Division */}
            <motion.div
              className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Global Revenue Division</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Split of all transaction commissions and rewards</p>
              </div>

              <div className="w-full h-48 relative my-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'User Rewards', value: stats?.total_user_earnings || 0 },
                        { name: 'Platform Commission', value: stats?.platform_earnings || 0 },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Volume']}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Gross Volume</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {formatCurrency(totalGrossVolume)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    User Rewards:
                  </span>
                  <strong className="text-[var(--text-primary)]">{formatCurrency(stats?.total_user_earnings || 0)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    Platform Admin:
                  </span>
                  <strong className="text-[var(--text-primary)]">{formatCurrency(stats?.platform_earnings || 0)}</strong>
                </div>
              </div>
            </motion.div>

            {/* Chart 2: Company Investment Deployments */}
            <motion.div
              className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Company Research Investments</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Top enterprise spenders across campaigns</p>
              </div>

              <div className="w-full h-48 my-3">
                {companySpendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)] italic">
                    No company deposits yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={companySpendData}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                      >
                        {companySpendData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS_PIE[idx % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), 'Invested']}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-white/5">
                {companySpendData.slice(0, 3).map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center truncate">
                    <span className="flex items-center gap-1.5 truncate text-[var(--text-secondary)]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <strong className="text-[var(--text-primary)] flex-shrink-0">{formatCurrency(c.value)}</strong>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chart 3: Top Contributor Earnings */}
            <motion.div
              className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">User Earning Distribution</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Top contributors earning research payouts</p>
              </div>

              <div className="w-full h-48 my-3">
                {userEarningsData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)] italic">
                    No user rewards recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userEarningsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                      >
                        {userEarningsData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS_PIE[(idx + 2) % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), 'Earned']}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-white/5">
                {userEarningsData.slice(0, 3).map((u, i) => (
                  <div key={u.name} className="flex justify-between items-center truncate">
                    <span className="flex items-center gap-1.5 truncate text-[var(--text-secondary)]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_PIE[(i + 2) % COLORS_PIE.length] }} />
                      <span className="truncate">{u.name}</span>
                    </span>
                    <strong className="text-emerald-400 flex-shrink-0">{formatCurrency(u.value)}</strong>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Verification & Approvals Queues */}
        <div className="space-y-4">
          <div className="flex items-center gap-6 border-b border-white/10 pb-px">
            <button
              onClick={() => setActiveQueueTab('surveys')}
              className={`font-display text-sm font-semibold pb-3 px-1 relative transition-all flex items-center gap-2 ${
                activeQueueTab === 'surveys'
                  ? 'text-emerald-400 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Surveys Awaiting Review
              {surveys.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {surveys.length}
                </span>
              )}
              {activeQueueTab === 'surveys' && (
                <motion.div layoutId="queueTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>

            <button
              onClick={() => setActiveQueueTab('withdrawals')}
              className={`font-display text-sm font-semibold pb-3 px-1 relative transition-all flex items-center gap-2 ${
                activeQueueTab === 'withdrawals'
                  ? 'text-emerald-400 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Pending Withdrawals
              {withdrawals.length > 0 && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  {withdrawals.length}
                </span>
              )}
              {activeQueueTab === 'withdrawals' && (
                <motion.div layoutId="queueTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Tab 1: Surveys Awaiting Review */}
          {activeQueueTab === 'surveys' && (
            <div className="space-y-3">
              {surveys.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center border border-white/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[var(--text-primary)] font-bold text-base">All Surveys Reviewed</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">No pending campaigns require approval right now.</p>
                </div>
              ) : (
                surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="glass rounded-3xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-bold text-base text-[var(--text-primary)] truncate">
                          {survey.title}
                        </h4>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          PENDING
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                        <span className="text-white font-medium">{survey.company_name}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{formatCurrency(survey.reward_per_response)} / response</span>
                        <span>•</span>
                        <span>{survey.max_responses} Target Respondents</span>
                        <span>•</span>
                        <span>Budget: {formatCurrency(survey.total_budget)}</span>
                        <span>•</span>
                        <span>Created {timeAgo(survey.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <button
                        onClick={() => handleSurveyAction(survey.id, 'reject')}
                        disabled={actionLoading === `survey-${survey.id}`}
                        className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleSurveyAction(survey.id, 'approve')}
                        disabled={actionLoading === `survey-${survey.id}`}
                        className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Pending Withdrawals */}
          {activeQueueTab === 'withdrawals' && (
            <div className="space-y-3">
              {withdrawals.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center border border-white/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[var(--text-primary)] font-bold text-base">No Pending Withdrawals</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">All user UPI payout requests have been cleared.</p>
                </div>
              ) : (
                withdrawals.map((wd) => (
                  <div
                    key={wd.id}
                    className="glass rounded-3xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                          {wd.user_name}
                        </h4>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                          UPI PAYOUT
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                        <span>{wd.user_email}</span>
                        <span>•</span>
                        <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">UPI: {wd.upi_id}</span>
                        <span>•</span>
                        <span>Requested {timeAgo(wd.requested_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-display text-xl font-bold text-emerald-400">
                        {formatCurrency(wd.amount)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleWithdrawalAction(wd.id, 'reject')}
                          disabled={actionLoading === `wd-${wd.id}`}
                          className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(wd.id, 'approve')}
                          disabled={actionLoading === `wd-${wd.id}`}
                          className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

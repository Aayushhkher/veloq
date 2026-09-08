'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart3, ClipboardList, Wallet, Users, Plus, ArrowRight,
  TrendingUp, Activity, PieChart as PieIcon, Eye, Download,
  CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Layers
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import PlanSelector from '@/components/PlanSelector'
import { companyAPI, surveyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CompanyDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    companyAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const handleExportCSV = async (e: React.MouseEvent, surveyId: number, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      toast.loading('Generating response export...', { id: 'csv-export' })
      const res = await surveyAPI.exportCSV(surveyId)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_responses.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Responses downloaded successfully!', { id: 'csv-export' })
    } catch {
      toast.error('Failed to export responses', { id: 'csv-export' })
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  const stats = data?.stats || {}
  const investment = data?.investment_analytics || {}
  const surveys = data?.all_surveys || data?.recent_surveys || []
  const spendBySurvey = investment.spend_by_survey || []
  const responseTrend = investment.response_trend || []

  const totalCapitalInvested = (stats.wallet_balance || 0) + (stats.total_spent || 0)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Executive Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-violet-500/[0.05] p-6 rounded-3xl border border-white/5 relative overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ENTERPRISE RESEARCH
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Campaign Command Center</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              {data?.company?.company_name || 'Enterprise Dashboard'}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Active investment analytics, real-time response counters, and respondent insights
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <Link
              href="/dashboard/company/wallet"
              className="flex items-center gap-2 bg-[var(--input-bg)] hover:bg-white/10 text-[var(--text-primary)] border border-white/10 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              Deposit Funds
            </Link>
            <Link
              href="/dashboard/company/create"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Launch Survey
            </Link>
          </div>
        </motion.div>

        {/* Plan / Tier Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <PlanSelector mode={user?.subscription_tier ? 'inline' : 'full'} />
        </motion.div>

        {/* Financial & Campaign KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Capital Deployed"
            value={formatCurrency(stats.total_spent || 0)}
            subtitle="Total paid in research rewards"
            icon={TrendingUp}
            color="emerald"
            delay={0.05}
          />
          <StatCard
            title="Available Capital"
            value={formatCurrency(stats.wallet_balance || 0)}
            subtitle="Current wallet balance"
            icon={Wallet}
            color="blue"
            delay={0.1}
          />
          <StatCard
            title="Responses Filed"
            value={stats.total_responses || 0}
            subtitle={`${stats.completion_rate || 0}% overall fill rate`}
            icon={Users}
            color="amber"
            delay={0.15}
          />
          <StatCard
            title="Active Campaigns"
            value={`${stats.active_surveys || 0} / ${stats.total_surveys || 0}`}
            subtitle="Surveys collecting responses"
            icon={Activity}
            color="violet"
            delay={0.2}
          />
        </div>

        {/* Wallet Alert if low */}
        {(stats.wallet_balance || 0) < 500 && (
          <motion.div
            className="glass rounded-2xl p-4 border border-amber-500/30 bg-amber-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Low Balance Alert</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Wallet balance is below ₹500. Top up to ensure active surveys continue collecting responses.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/company/wallet"
              className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
            >
              Add Funds Now
            </Link>
          </motion.div>
        )}

        {/* Investment & Spend Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Survey Investment vs Budget Utilization */}
          <motion.div
            className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Campaign Capital Allocation</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  INVESTMENT
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Total budget allocated vs actual reward capital deployed per survey
              </p>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendBySurvey} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#f4f4f5'
                    }}
                    formatter={(val: number, name: string) => [
                      formatCurrency(val),
                      name === 'budget' ? 'Allocated Budget' : 'Actual Spent'
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                  />
                  <Bar dataKey="budget" name="Allocated Budget" fill="#27272a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="spent" name="Spent (Responses)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Total Allocated: <strong className="text-[var(--text-primary)]">{formatCurrency(stats.total_budget_allocated || 0)}</strong></span>
              <span>Spent to Date: <strong className="text-emerald-400">{formatCurrency(stats.total_spent || 0)}</strong></span>
            </div>
          </motion.div>

          {/* Chart 2: Response Acquisition Velocity */}
          <motion.div
            className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Response Acquisition Velocity</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  TRACTION
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Cumulative survey submissions collected across all active campaigns
              </p>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="compRespGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#f4f4f5'
                    }}
                    formatter={(val: number) => [`${val} Submissions`, 'Responses']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Responses"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#compRespGrad)"
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Total Volume: <strong className="text-[var(--text-primary)]">{stats.total_responses || 0} Responses</strong></span>
              <span className="text-blue-400 font-semibold">Active Ingestion</span>
            </div>
          </motion.div>
        </div>

        {/* Survey Response Inspection Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                Active Surveys & Response Submissions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Inspect how many people filed surveys, browse individual answers, and download audit logs
              </p>
            </div>
            <Link
              href="/dashboard/company/create"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Launch New Survey
            </Link>
          </div>

          {surveys.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-white/5">
              <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-[var(--text-primary)] font-semibold mb-1">No research campaigns launched yet</p>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Create your first survey to start collecting market data.</p>
              <Link
                href="/dashboard/company/create"
                className="inline-flex items-center gap-2 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Create Survey Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {surveys.map((s: any) => {
                const fillPct = Math.round((s.responses / max(s.max_responses, 1)) * 100)
                return (
                  <motion.div
                    key={s.id}
                    className="glass rounded-3xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Survey Meta */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-emerald-300 transition-colors">
                            {s.title}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(s.status)}`}>
                            {s.status?.toUpperCase()}
                          </span>
                          {s.category && (
                            <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              {s.category}
                            </span>
                          )}
                        </div>

                        {s.description && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                            {s.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
                          <span className="text-emerald-400 font-semibold">
                            {formatCurrency(s.reward_per_response)} / response
                          </span>
                          <span>•</span>
                          <span>Budget: {formatCurrency(s.total_budget || (s.reward_per_response * s.max_responses))}</span>
                          <span>•</span>
                          <span>Spent: {formatCurrency(s.spent || (s.reward_per_response * s.responses))}</span>
                        </div>
                      </div>

                      {/* Response Counter & Fill Progress */}
                      <div className="w-full lg:w-72 bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            People Filed:
                          </span>
                          <span className="font-bold text-[var(--text-primary)]">
                            <span className="text-emerald-400 text-sm">{s.responses}</span> / {s.max_responses}
                          </span>
                        </div>

                        {/* Visual Fill Bar */}
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(fillPct, 100)}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1.5 font-medium">
                          <span>{fillPct}% Filled</span>
                          <span>{s.max_responses - s.responses} Slots Open</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleExportCSV(e, s.id, s.title)}
                          title="Download Responses CSV"
                          className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 text-[var(--text-secondary)] hover:text-white bg-[var(--input-bg)] hover:bg-white/10 transition-all text-xs flex items-center gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">CSV</span>
                        </button>

                        <Link
                          href={`/dashboard/company/surveys/${s.id}`}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/10"
                        >
                          <Eye className="w-4 h-4" />
                          Inspect Responses ({s.responses})
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function max(a: number, b: number) {
  return a > b ? a : b
}

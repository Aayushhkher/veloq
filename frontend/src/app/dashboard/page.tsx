'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Wallet, ClipboardCheck, TrendingUp, ArrowRight, Star, Zap,
  DollarSign, ArrowUpRight, BarChart3, PieChart as PieIcon,
  Clock, ShieldCheck, Sparkles, Award
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import SurveyCard from '@/components/survey/SurveyCard'
import { userAPI, surveyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']

export default function UserDashboard() {
  const { user, updateUser } = useAuthStore()
  const [surveys, setSurveys] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [chartMode, setChartMode] = useState<'cumulative' | 'amount'>('cumulative')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, surveysRes, txnsRes, analyticsRes] = await Promise.all([
          userAPI.getProfile(),
          surveyAPI.getAvailable(0, 6),
          userAPI.getTransactions(0, 6),
          userAPI.getAnalytics().catch(() => ({ data: null })),
        ])
        updateUser(profileRes.data)
        setSurveys(surveysRes.data)
        setTransactions(txnsRes.data)
        if (analyticsRes?.data) {
          setAnalytics(analyticsRes.data)
        }
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!user) return null

  const earningsTrend = analytics?.earnings_trend || []
  const categoryDist = analytics?.category_distribution || []
  const totalEarned = analytics?.total_earned ?? user.total_earned
  const walletBalance = analytics?.wallet_balance ?? user.wallet_balance
  const surveysCompleted = analytics?.surveys_completed ?? user.surveys_completed
  const avgReward = analytics?.average_reward ?? (surveysCompleted > 0 ? (totalEarned / surveysCompleted).toFixed(1) : 0)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/[0.07] via-transparent to-blue-500/[0.05] p-6 rounded-3xl border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> VERIFIED CONTRIBUTOR
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Member Tier</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Welcome back, {user.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              You've earned <span className="text-emerald-400 font-semibold">{formatCurrency(totalEarned)}</span> across {surveysCompleted} completed surveys.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-2 bg-[var(--input-bg)] hover:bg-white/10 text-[var(--text-primary)] border border-white/10 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              Wallet: {formatCurrency(walletBalance)}
            </Link>
            <Link
              href="/dashboard/surveys"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Earn Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Primary KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available Balance"
            value={formatCurrency(walletBalance)}
            subtitle="Instant withdrawal to UPI"
            icon={Wallet}
            color="emerald"
            delay={0.05}
          />
          <StatCard
            title="Personal Earnings"
            value={formatCurrency(totalEarned)}
            subtitle="Total rewards received"
            icon={TrendingUp}
            color="blue"
            trend={{ value: 18, label: 'vs last week' }}
            delay={0.1}
          />
          <StatCard
            title="Surveys Completed"
            value={surveysCompleted}
            subtitle="100% verified quality"
            icon={ClipboardCheck}
            color="amber"
            delay={0.15}
          />
          <StatCard
            title="Average Yield"
            value={formatCurrency(avgReward)}
            subtitle="Per completed survey"
            icon={Award}
            color="violet"
            delay={0.2}
          />
        </div>

        {/* Personal Earnings Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Earnings Curve */}
          <motion.div
            className="lg:col-span-2 glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Personal Earnings Progression</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Track your daily income yield and cumulative payout milestones
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-white/5 self-start sm:self-auto">
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    chartMode === 'cumulative'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Cumulative
                </button>
                <button
                  onClick={() => setChartMode('amount')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    chartMode === 'amount'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Per Payout
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      color: '#f4f4f5'
                    }}
                    formatter={(val: number) => [formatCurrency(val), chartMode === 'cumulative' ? 'Cumulative Total' : 'Earned']}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#earningsGrad)"
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Current Total: <strong className="text-[var(--text-primary)]">{formatCurrency(totalEarned)}</strong>
              </span>
              <span>Updated in real-time</span>
            </div>
          </motion.div>

          {/* Category Distribution / Breakdown */}
          <motion.div
            className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Earnings by Sector</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Top survey domains delivering rewards</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Earned']}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Top Sector</span>
                <span className="text-xs font-bold text-emerald-400">
                  {categoryDist[0]?.name || 'Technology'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {categoryDist.map((cat: any, i: number) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-[var(--text-primary)] font-medium truncate max-w-[130px]">{cat.name}</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Earn Recommendation Banner */}
        {surveys.length > 0 && (
          <motion.div
            className="glass rounded-3xl p-5 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.03] to-transparent relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    High Payout Opportunities Active!
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      FAST PAYOUT
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Earn up to{' '}
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(Math.max(...surveys.map(s => s.reward_per_response)))}
                    </span>{' '}
                    per submission. Complete in 5 minutes with immediate wallet credit.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/surveys"
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex-shrink-0"
              >
                Browse All Available ({surveys.length})
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Available Surveys Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Recommended Surveys For You</h2>
              <p className="text-xs text-[var(--text-secondary)]">Tailored based on your profile and completion history</p>
            </div>
            <Link
              href="/dashboard/surveys"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-3xl h-48 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-white/5">
              <ClipboardCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-[var(--text-primary)] font-semibold">No surveys waiting right now</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Check back in a bit — new market campaigns launch frequently.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey, i) => (
                <SurveyCard key={survey.id} survey={survey} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings & Transaction Activity */}
        {transactions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Recent Reward Transactions</h2>
                <p className="text-xs text-[var(--text-secondary)]">Instant wallet deposits for verified submissions</p>
              </div>
              <Link
                href="/dashboard/wallet"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                Wallet statement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/10 divide-y divide-white/5">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        txn.amount > 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {txn.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {txn.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                        <span>{timeAgo(txn.created_at)}</span>
                        <span>•</span>
                        <span className="text-[10px] font-medium text-emerald-400/90 bg-emerald-500/10 px-2 py-0.2 rounded">
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      className={`font-display text-sm sm:text-base font-bold ${
                        txn.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)]">Balance: {formatCurrency(txn.balance_after)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

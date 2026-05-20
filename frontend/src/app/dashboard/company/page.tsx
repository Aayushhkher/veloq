'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BarChart3, ClipboardList, Wallet, Users, Plus, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import PlanSelector from '@/components/PlanSelector'
import { companyAPI } from '@/lib/api'
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

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  const stats = data?.stats || {}
  const surveys = data?.recent_surveys || []

  // Mock chart data based on responses
  const chartData = surveys.map((s: any, i: number) => ({
    name: `Survey ${i + 1}`,
    responses: s.responses,
    target: s.max_responses,
  }))

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {data?.company?.company_name || 'Company Dashboard'}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Overview of your surveys and spend</p>
          </div>
          <Link
            href="/dashboard/company/create"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Survey
          </Link>
        </motion.div>

        {/* Plan selector — full if no tier, compact card if already set */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <PlanSelector mode={user?.subscription_tier ? 'inline' : 'full'} />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Wallet Balance" value={formatCurrency(stats.wallet_balance || 0)} icon={Wallet} color="emerald" delay={0.05} />
          <StatCard title="Active Surveys" value={stats.active_surveys || 0} icon={Activity} color="blue" delay={0.1} />
          <StatCard title="Total Responses" value={stats.total_responses || 0} icon={Users} color="amber" delay={0.15} />
          <StatCard title="Total Spent" value={formatCurrency(stats.total_spent || 0)} icon={TrendingUp} color="rose" delay={0.2} />
        </div>

        {/* Wallet top-up alert */}
        {(stats.wallet_balance || 0) < 500 && (
          <motion.div
            className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/[0.03] flex items-center gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Low wallet balance</p>
              <p className="text-xs text-[var(--text-secondary)]">Top up your wallet to create new surveys</p>
            </div>
            <Link href="/dashboard/company/wallet" className="flex-shrink-0 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium px-4 py-2 rounded-xl transition-all">
              Add Funds
            </Link>
          </motion.div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display font-bold text-[var(--text-primary)] mb-6">Survey Response Progress</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="resp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f9fafb' }}
                />
                <Area type="monotone" dataKey="responses" stroke="#10b981" fill="url(#resp)" strokeWidth={2} />
                <Area type="monotone" dataKey="target" stroke="#3f3f46" fill="none" strokeWidth={1} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recent Surveys */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[var(--text-primary)]">Recent Surveys</h2>
            <Link href="/dashboard/company/surveys" className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors">
              View all →
            </Link>
          </div>

          {surveys.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium mb-2">No surveys yet</p>
              <Link href="/dashboard/company/create" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
                <Plus className="w-4 h-4" /> Create your first survey
              </Link>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              {surveys.map((s: any, i: number) => (
                <Link
                  key={s.id}
                  href={`/dashboard/company/surveys/${s.id}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--input-bg)] transition-colors group ${i < surveys.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-emerald-300 transition-colors">{s.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{s.responses}/{s.max_responses} responses · {formatCurrency(s.reward_per_response)}/response</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Progress bar */}
                    <div className="hidden sm:block w-20">
                      <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.round((s.responses / s.max_responses) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{Math.round((s.responses / s.max_responses) * 100)}%</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(s.status)}`}>
                      {s.status.toUpperCase()}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

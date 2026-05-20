'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Wallet, ClipboardCheck, TrendingUp, ArrowRight, Star, Zap } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import SurveyCard from '@/components/survey/SurveyCard'
import { userAPI, surveyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function UserDashboard() {
  const { user, updateUser } = useAuthStore()
  const [surveys, setSurveys] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, surveysRes, txnsRes] = await Promise.all([
          userAPI.getProfile(),
          surveyAPI.getAvailable(0, 6),
          userAPI.getTransactions(0, 5),
        ])
        updateUser(profileRes.data)
        setSurveys(surveysRes.data)
        setTransactions(txnsRes.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Hey, {user.full_name.split(' ')[0]} 👋
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {surveys.length > 0 ? `${surveys.length} surveys available for you` : 'No new surveys right now'}
            </p>
          </div>
          <Link
            href="/dashboard/surveys"
            className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Wallet Balance"
            value={formatCurrency(user.wallet_balance)}
            icon={Wallet}
            color="emerald"
            delay={0.05}
          />
          <StatCard
            title="Total Earned"
            value={formatCurrency(user.total_earned)}
            icon={TrendingUp}
            color="blue"
            delay={0.1}
          />
          <StatCard
            title="Surveys Done"
            value={user.surveys_completed}
            icon={ClipboardCheck}
            color="amber"
            delay={0.15}
          />
          <StatCard
            title="Available"
            value={surveys.length}
            subtitle="surveys to complete"
            icon={Star}
            color="violet"
            delay={0.2}
          />
        </div>

        {/* Quick earn banner */}
        {surveys.length > 0 && (
          <motion.div
            className="glass rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.03]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Earn up to{' '}
                  <span className="text-emerald-400">
                    {formatCurrency(Math.max(...surveys.map(s => s.reward_per_response)))}
                  </span>{' '}
                  on your next survey
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Complete surveys below and get paid instantly</p>
              </div>
              <Link
                href="/dashboard/surveys"
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex-shrink-0"
              >
                View all →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Surveys grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[var(--text-primary)]">Available Surveys</h2>
            <Link href="/dashboard/surveys" className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">No surveys available right now</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Check back soon — new surveys are added daily</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey, i) => (
                <SurveyCard key={survey.id} survey={survey} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-[var(--text-primary)]">Recent Earnings</h2>
              <Link href="/dashboard/wallet" className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors">
                View all →
              </Link>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              {transactions.map((txn, i) => (
                <div
                  key={txn.id}
                  className={`flex items-center gap-4 px-5 py-4 ${i < transactions.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <TrendingUp className={`w-4 h-4 ${txn.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{txn.description}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{timeAgo(txn.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${txn.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

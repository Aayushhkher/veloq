'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, TrendingUp, Clock, BarChart3, PieChart } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { surveyAPI } from '@/lib/api'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function SurveyAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const surveyId = Number(params.id)

  useEffect(() => {
    Promise.all([
      surveyAPI.getAnalytics(surveyId),
      surveyAPI.getById(surveyId),
    ])
      .then(([analyticsRes, surveyRes]) => {
        setData(analyticsRes.data)
        setSurvey(surveyRes.data)
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [surveyId])

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  if (!data || !survey) return null

  const questionAnalytics = data.question_analytics || {}
  const questions = survey.questions || []

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{survey.title}</h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(survey.status)}`}>
                {survey.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">{survey.description}</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Responses', value: data.total_responses, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Completion Rate', value: `${data.completion_rate}%`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Total Spent', value: formatCurrency(data.total_spent), icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Remaining Slots', value: data.max_responses - data.total_responses, icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`glass rounded-2xl p-5 border ${stat.bg}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <motion.div
          className="glass rounded-2xl p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="text-[var(--text-secondary)] font-medium">Response Progress</span>
            <span className="text-[var(--text-primary)]">{data.total_responses} / {data.max_responses}</span>
          </div>
          <div className="h-3 bg-[var(--input-bg)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.completion_rate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
            <span>0</span>
            <span className="text-emerald-400 font-medium">{data.completion_rate}% filled</span>
            <span>{data.max_responses}</span>
          </div>
        </motion.div>

        {/* Per-question analytics */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-[var(--text-primary)]">Question Analysis</h2>

          {questions.map((q: any, idx: number) => {
            const analytics = questionAnalytics[String(q.id)]
            if (!analytics) return null

            return (
              <motion.div
                key={q.id}
                className="glass rounded-2xl p-6 border border-[var(--border)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <div className="flex items-start gap-3 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-medium">{q.question_text}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">{q.question_type} · {analytics.total} responses</p>
                  </div>
                </div>

                {/* MCQ / Checkbox - Bar chart */}
                {(analytics.type === 'mcq' || analytics.type === 'checkbox') && analytics.distribution && (
                  <div className="space-y-3">
                    {Object.entries(analytics.distribution)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .map(([option, count]: [string, any], i) => {
                        const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0
                        return (
                          <div key={option}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-[var(--text-secondary)] truncate">{option}</span>
                              <span className="text-[var(--text-secondary)] flex-shrink-0 ml-4">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.1 * i }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {/* Rating */}
                {analytics.type === 'rating' && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-display text-4xl font-bold text-emerald-400">{analytics.average}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">avg rating</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-end gap-2 h-16">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-emerald-500/40"
                              style={{ height: `${Math.max(4, (analytics.average / 5) * 60)}px` }}
                            />
                            <span className="text-xs text-[var(--text-muted)]">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Text */}
                {analytics.type === 'text' && (
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">Sample responses ({analytics.total} total)</p>
                    <div className="space-y-2">
                      {(analytics.sample || []).map((ans: string, i: number) => (
                        <p key={i} className="text-sm text-[var(--text-secondary)] glass rounded-xl px-4 py-2.5 border border-[var(--border)]">
                          "{ans}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scale */}
                {analytics.type === 'scale' && (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-display text-4xl font-bold text-blue-400">{analytics.average}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">avg score</div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{analytics.total} responses</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

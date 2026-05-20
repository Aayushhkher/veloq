'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, BarChart3, Users, ArrowRight } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { surveyAPI } from '@/lib/api'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CompanySurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    surveyAPI.getCompanySurveys()
      .then(res => setSurveys(res.data))
      .catch(() => toast.error('Failed to load surveys'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">My Surveys</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">{surveys.length} surveys total</p>
          </div>
          <Link href="/dashboard/company/create" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus className="w-4 h-4" /> Create Survey
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : surveys.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] font-medium mb-2">No surveys yet</p>
            <Link href="/dashboard/company/create" className="inline-flex items-center gap-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Create your first survey
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey, i) => {
              const pct = Math.round((survey.current_responses / survey.max_responses) * 100)
              return (
                <motion.div
                  key={survey.id}
                  className="glass rounded-2xl p-5 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-[var(--text-primary)] truncate">{survey.title}</h3>
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(survey.status)}`}>
                          {survey.status?.toUpperCase()}
                        </span>
                      </div>
                      {survey.category && <p className="text-xs text-[var(--text-muted)] mb-2">{survey.category}</p>}

                      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{survey.current_responses}/{survey.max_responses} responses</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(survey.reward_per_response)}/response</span>
                        <span>Created {timeAgo(survey.created_at)}</span>
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">{pct}% complete</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Link
                        href={`/dashboard/company/surveys/${survey.id}`}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
                      >
                        Analytics <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

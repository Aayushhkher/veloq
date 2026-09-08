'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, TrendingUp, Clock, BarChart3, Check, X,
  AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Download,
  Search, Filter, CheckCircle2, MessageSquare, Star, Sparkles,
  RefreshCw, Layers, SlidersHorizontal
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, CartesianGrid
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { surveyAPI } from '@/lib/api'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

const PALETTE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1']

export default function SurveyAnalyticsAndResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = Number(params.id)

  const [data, setData] = useState<any>(null)
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'submissions' | 'overview'>('submissions')
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null)

  // Filters for Individual Responses tab
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'flagged' | 'rejected'>('all')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      surveyAPI.getAnalytics(surveyId),
      surveyAPI.getById(surveyId),
    ])
      .then(([analyticsRes, surveyRes]) => {
        setData(analyticsRes.data)
        setSurvey(surveyRes.data)
      })
      .catch(() => toast.error('Failed to load survey analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (surveyId) {
      loadData()
    }
  }, [surveyId])

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting survey responses...', { id: 'csv-download' })
      const res = await surveyAPI.exportCSV(surveyId)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(survey?.title || 'survey').toLowerCase().replace(/\s+/g, '_')}_responses.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Responses downloaded successfully!', { id: 'csv-download' })
    } catch {
      toast.error('Failed to export responses', { id: 'csv-download' })
    }
  }

  const handleApprove = async (resId: number) => {
    try {
      await surveyAPI.approveResponse(resId)
      toast.success('Response approved!')
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to approve response')
    }
  }

  const handleReject = async (resId: number) => {
    if (!confirm('Reject this response? The slot will reopen and rewards will not be paid.')) return
    try {
      await surveyAPI.rejectResponse(resId)
      toast.success('Response rejected!')
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reject response')
    }
  }

  // Filtered submissions
  const allSubmissions: any[] = data?.recent_responses || []
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const userMatch = r.user_name?.toLowerCase().includes(query) || r.user_email?.toLowerCase().includes(query)
        const answerMatch = Object.values(r.answers || {}).some((ans: any) =>
          String(ans).toLowerCase().includes(query)
        )
        return userMatch || answerMatch
      }
      return true
    })
  }, [allSubmissions, statusFilter, searchQuery])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!data || !survey) return null

  const questions = data.questions || survey.questions || []
  const questionAnalytics = data.question_analytics || {}
  const totalFiled = data.total_responses || allSubmissions.length
  const maxResponses = data.max_responses || 100
  const completionRate = data.completion_rate || (maxResponses > 0 ? Math.round((totalFiled / maxResponses) * 100) : 0)

  const flaggedCount = allSubmissions.filter((r) => r.status === 'flagged').length
  const genuineCount = allSubmissions.filter((r) => r.status === 'approved').length

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/dashboard/company')}
              className="mt-1 p-2.5 rounded-2xl text-[var(--text-secondary)] hover:text-white bg-[var(--input-bg)] border border-white/5 hover:border-white/10 transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {survey.title}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(survey.status)}`}>
                  {survey.status?.toUpperCase()}
                </span>
                {survey.category && (
                  <span className="text-xs text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                    {survey.category}
                  </span>
                )}
              </div>
              <p className="text-[var(--text-secondary)] text-sm max-w-3xl">
                {survey.description || 'Detailed survey metrics and responses audit log.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 text-[var(--text-secondary)] hover:text-white bg-[var(--input-bg)] transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Responses"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="glass rounded-3xl p-5 border border-emerald-500/20 bg-emerald-500/[0.03]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-display text-2xl font-bold text-white">
              {totalFiled} <span className="text-xs text-[var(--text-secondary)] font-normal">/ {maxResponses}</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Total People Filed</div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-5 border border-blue-500/20 bg-blue-500/[0.03]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="font-display text-2xl font-bold text-white">{completionRate}%</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Completion Fill Rate</div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-5 border border-violet-500/20 bg-violet-500/[0.03]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="font-display text-2xl font-bold text-white">
              {formatCurrency(survey.reward_per_response * totalFiled)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Rewards Paid Out</div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-5 border border-amber-500/20 bg-amber-500/[0.03]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="font-display text-2xl font-bold text-white">
              {genuineCount} <span className="text-xs text-amber-400 font-normal">({flaggedCount} flagged)</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Genuine Submissions</div>
          </motion.div>
        </div>

        {/* Fill Progress Bar */}
        <motion.div
          className="glass rounded-3xl p-5 border border-white/10"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center text-xs mb-2.5">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Campaign Quota Progress
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {totalFiled} of {maxResponses} Target Respondents
            </span>
          </div>
          <div className="h-3 bg-[var(--input-bg)] rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(completionRate, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-2">
            <span>0 Responses</span>
            <span className="text-emerald-400 font-semibold">{completionRate}% filled</span>
            <span>{maxResponses} Target</span>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-6 border-b border-white/10 pb-px">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`font-display text-sm font-semibold pb-3 px-1 relative transition-all flex items-center gap-2 ${
              activeTab === 'submissions'
                ? 'text-emerald-400 font-bold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Individual Submissions & Answers ({allSubmissions.length})
            {flaggedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            {activeTab === 'submissions' && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`font-display text-sm font-semibold pb-3 px-1 relative transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'text-emerald-400 font-bold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Question Aggregate Analytics ({questions.length})
            {activeTab === 'overview' && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Tab 1: Individual Submissions Log */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass rounded-2xl p-4 border border-white/10">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by respondent name, email, or answer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
                </span>
                {(['all', 'approved', 'flagged'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-xs px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                      statusFilter === status
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-white border border-white/5'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center border border-white/10">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-[var(--text-primary)] font-bold text-base">No matching submissions found</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Try broadening your search query or status filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((resp, idx) => {
                  const isExpanded = expandedResponse === resp.id
                  const scorePct = Math.round((resp.quality_score || 1.0) * 100)

                  return (
                    <motion.div
                      key={resp.id}
                      className={`glass rounded-3xl border transition-all overflow-hidden ${
                        resp.status === 'flagged'
                          ? 'border-amber-500/30 bg-amber-500/[0.02]'
                          : 'border-white/10 hover:border-emerald-500/30'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => setExpandedResponse(isExpanded ? null : resp.id)}
                        className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                              #{idx + 1}
                            </span>
                            <span className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                              {resp.user_name}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              ({resp.user_email})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Time: {resp.time_taken_seconds ? `${Math.floor(resp.time_taken_seconds / 60)}m ${resp.time_taken_seconds % 60}s` : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>IP: {resp.ip_address || 'unknown'}</span>
                            <span>•</span>
                            <span>Filed: {resp.completed_at ? new Date(resp.completed_at).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 flex-shrink-0">
                          {/* Quality Score Indicator */}
                          <div
                            className={`px-3 py-1 rounded-xl text-center border text-xs font-bold ${
                              scorePct >= 80
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : scorePct >= 60
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            <span>{scorePct}%</span>
                            <span className="text-[9px] block text-[var(--text-secondary)] font-normal">Quality</span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {resp.status === 'approved' && (
                              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Genuine
                              </span>
                            )}
                            {resp.status === 'flagged' && (
                              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Audit
                              </span>
                            )}
                            {resp.status === 'rejected' && (
                              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                Rejected
                              </span>
                            )}
                          </div>

                          <div className="p-1 rounded-lg bg-white/5 text-[var(--text-secondary)]">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Answers & Question Review */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-white/10 p-6 bg-black/30 space-y-6"
                          >
                            {/* Quality flag notices if applicable */}
                            {resp.is_flagged && resp.flag_reasons?.length > 0 && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-amber-400">Automated Quality Flags Detected</h4>
                                  <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] mt-1 space-y-0.5">
                                    {resp.flag_reasons.map((r: string, i: number) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* Action bar for flagged responses */}
                            {resp.status === 'flagged' && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                  Action Required: Audit respondent answers below before approving payout.
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(resp.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject Response
                                  </button>
                                  <button
                                    onClick={() => handleApprove(resp.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all shadow-md"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve Payout
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Complete Question & Answer Responses */}
                            <div>
                              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                Respondent Submissions ({questions.length} Questions Answered)
                              </h4>

                              <div className="space-y-4">
                                {questions.map((q: any, qIdx: number) => {
                                  const answerValue = resp.answers ? resp.answers[String(q.id)] : undefined

                                  return (
                                    <div
                                      key={q.id}
                                      className="glass rounded-2xl p-4 border border-white/5 bg-white/[0.01]"
                                    >
                                      <div className="flex items-start gap-2.5 mb-2">
                                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                          {qIdx + 1}
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                                            {q.question_text}
                                          </p>
                                          <span className="text-[10px] text-[var(--text-secondary)] capitalize">
                                            {q.question_type} question
                                          </span>
                                        </div>
                                      </div>

                                      {/* Answer render */}
                                      <div className="pl-7 mt-2">
                                        {answerValue === undefined || answerValue === null || answerValue === '' ? (
                                          <span className="text-xs italic text-[var(--text-secondary)]">— Skipped / Unanswered —</span>
                                        ) : Array.isArray(answerValue) ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {answerValue.map((item: string, idx: number) => (
                                              <span
                                                key={idx}
                                                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-lg"
                                              >
                                                ✓ {item}
                                              </span>
                                            ))}
                                          </div>
                                        ) : q.question_type === 'rating' ? (
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-0.5 text-amber-400">
                                              {[...Array(5)].map((_, starI) => (
                                                <Star
                                                  key={starI}
                                                  className={`w-4 h-4 ${
                                                    starI < Number(answerValue) ? 'fill-amber-400' : 'text-zinc-700'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            <span className="text-xs font-bold text-white">
                                              ({answerValue} / 5 Stars)
                                            </span>
                                          </div>
                                        ) : q.question_type === 'text' ? (
                                          <div className="bg-[var(--input-bg)] border border-white/10 rounded-xl p-3.5 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                                            "{answerValue}"
                                          </div>
                                        ) : (
                                          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-lg">
                                            <span>✓</span>
                                            <span>{String(answerValue)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Question-by-Question Aggregate Analytics */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                  Question Response Distributions
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Aggregate breakdown of all choices, ratings, and feedback
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q: any, idx: number) => {
                const analytics = questionAnalytics[String(q.id)]
                if (!analytics) return null

                return (
                  <motion.div
                    key={q.id}
                    className="glass rounded-3xl p-6 border border-white/10 space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                          {q.question_text}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">
                          {q.question_type} Question • {analytics.total || 0} Total Responses
                        </p>
                      </div>
                    </div>

                    {/* MCQ / Checkbox Bar Distribution */}
                    {(analytics.type === 'mcq' || analytics.type === 'checkbox') && analytics.distribution && (
                      <div className="space-y-3.5 pt-2">
                        {Object.entries(analytics.distribution)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([option, count]: [string, any], i) => {
                            const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0
                            const barColor = PALETTE[i % PALETTE.length]

                            return (
                              <div key={option} className="space-y-1.5">
                                <div className="flex justify-between text-xs sm:text-sm font-medium">
                                  <span className="text-[var(--text-primary)] truncate">{option}</span>
                                  <span className="text-[var(--text-secondary)] flex-shrink-0 ml-4 font-semibold">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="h-2.5 bg-[var(--input-bg)] rounded-full overflow-hidden border border-white/5">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: barColor }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}

                    {/* Rating Question */}
                    {analytics.type === 'rating' && (
                      <div className="flex flex-col sm:flex-row items-center gap-8 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                        <div className="text-center sm:text-left flex-shrink-0">
                          <div className="font-display text-5xl font-bold text-emerald-400">
                            {analytics.average || 0}
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 my-1">
                            {[...Array(5)].map((_, s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s < Math.round(analytics.average || 0) ? 'fill-amber-400' : 'text-zinc-700'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">Average Rating / 5.0</div>
                        </div>

                        {/* Frequency breakdown 1 to 5 */}
                        <div className="flex-1 w-full space-y-2">
                          {[5, 4, 3, 2, 1].map((starVal) => {
                            const c = analytics.distribution?.[String(starVal)] || 0
                            const starPct = analytics.total > 0 ? Math.round((c / analytics.total) * 100) : 0
                            return (
                              <div key={starVal} className="flex items-center gap-3 text-xs">
                                <span className="w-10 text-[var(--text-secondary)] font-semibold flex items-center gap-1">
                                  {starVal} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                </span>
                                <div className="flex-1 h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${starPct}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-[var(--text-secondary)] font-medium">
                                  {c} ({starPct}%)
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Text Responses */}
                    {analytics.type === 'text' && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Sample Respondent Feedback ({analytics.total} submissions)
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {(analytics.sample || []).map((ans: string, i: number) => (
                            <div
                              key={i}
                              className="glass rounded-2xl p-4 border border-white/5 bg-white/[0.01] text-xs text-[var(--text-primary)] leading-relaxed"
                            >
                              "{ans}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, Wallet, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { surveyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Question = {
  id: number
  question_text: string
  question_type: 'mcq' | 'checkbox' | 'rating' | 'text' | 'scale'
  options?: string[]
  is_required: boolean
  order: number
  min_value?: number
  max_value?: number
}

export default function SurveyTakePage() {
  const params = useParams()
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [reward, setReward] = useState(0)
  const startTime = useRef(Date.now())

  const surveyId = Number(params.id)

  useEffect(() => {
    surveyAPI.getById(surveyId)
      .then(res => setSurvey(res.data))
      .catch(() => { toast.error('Survey not found'); router.push('/dashboard/surveys') })
      .finally(() => setLoading(false))
  }, [surveyId])

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  if (!survey) return null

  const questions: Question[] = survey.questions || []
  const currentQ = questions[current]
  const totalQ = questions.length
  const progress = ((current + 1) / totalQ) * 100

  const setAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [String(currentQ.id)]: value }))
  }

  const getAnswer = () => answers[String(currentQ?.id)]

  const canProceed = () => {
    if (!currentQ?.is_required) return true
    const ans = getAnswer()
    if (ans === undefined || ans === null || ans === '') return false
    if (Array.isArray(ans) && ans.length === 0) return false
    return true
  }

  const handleNext = () => {
    if (!canProceed()) { toast.error('Please answer this question'); return }
    if (current < totalQ - 1) setCurrent(c => c + 1)
    else handleSubmit()
  }

  const handleSubmit = async () => {
    // Validate all required questions
    for (const q of questions) {
      if (q.is_required) {
        const ans = answers[String(q.id)]
        if (ans === undefined || ans === null || ans === '') {
          toast.error(`Please answer: "${q.question_text.slice(0, 50)}..."`)
          setCurrent(questions.indexOf(q))
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
      const res = await surveyAPI.submit(surveyId, answers, timeTaken)
      setReward(res.data.reward_earned)
      setDone(true)
      updateUser({
        wallet_balance: (user?.wallet_balance || 0) + res.data.reward_earned,
        total_earned: (user?.total_earned || 0) + res.data.reward_earned,
        surveys_completed: (user?.surveys_completed || 0) + 1,
      })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (done) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-2">Survey Complete!</h1>
          <p className="text-[var(--text-secondary)] mb-6">Your response has been recorded</p>
          <div className="glass rounded-2xl p-6 mb-8 border border-emerald-500/20">
            <div className="text-4xl font-display font-bold text-emerald-400 mb-1">
              +{formatCurrency(reward)}
            </div>
            <p className="text-[var(--text-secondary)] text-sm">credited to your wallet instantly</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/dashboard/surveys')} className="glass glass-hover px-6 py-3 rounded-xl text-sm font-medium text-[var(--text-primary)]">
              More Surveys
            </button>
            <button onClick={() => router.push('/dashboard/wallet')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl text-sm">
              <Wallet className="w-4 h-4" /> View Wallet
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-bold text-[var(--text-primary)] text-lg line-clamp-1">{survey.title}</h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Clock className="w-3.5 h-3.5" />
                {survey.estimated_time_minutes}m
              </span>
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(survey.reward_per_response)}</span>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">{current + 1} / {totalQ}</span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div
              key={current}
              className="glass rounded-2xl p-6 md:p-8 border border-[var(--border)]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex gap-2 items-start mb-6">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {current + 1}
                </span>
                <h2 className="text-[var(--text-primary)] font-medium text-base leading-relaxed">
                  {currentQ.question_text}
                  {currentQ.is_required && <span className="text-red-400 ml-1">*</span>}
                </h2>
              </div>

              {/* MCQ */}
              {currentQ.question_type === 'mcq' && (
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all ${
                        getAnswer() === opt
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--input-bg)]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${getAnswer() === opt ? 'border-emerald-400 bg-emerald-400' : 'border-[var(--border-hover)]'}`} />
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {currentQ.question_type === 'checkbox' && (
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt, i) => {
                    const selected: string[] = getAnswer() || []
                    const isChecked = selected.includes(opt)
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isChecked) setAnswer(selected.filter(s => s !== opt))
                          else setAnswer([...selected, opt])
                        }}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--input-bg)]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${isChecked ? 'border-emerald-400 bg-emerald-400' : 'border-[var(--border-hover)]'}`}>
                            {isChecked && <span className="text-black text-[10px] font-bold">✓</span>}
                          </span>
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Rating */}
              {currentQ.question_type === 'rating' && (
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-3">
                    <span>Poor</span><span>Excellent</span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setAnswer(n)}
                        className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${
                          getAnswer() === n
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500/40 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scale */}
              {currentQ.question_type === 'scale' && (
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-3">
                    <span>{currentQ.min_value ?? 1}</span>
                    <span className="text-lg font-bold text-emerald-400">{getAnswer() ?? '—'}</span>
                    <span>{currentQ.max_value ?? 10}</span>
                  </div>
                  <input
                    type="range"
                    min={currentQ.min_value ?? 1}
                    max={currentQ.max_value ?? 10}
                    value={getAnswer() ?? Math.floor(((currentQ.min_value ?? 1) + (currentQ.max_value ?? 10)) / 2)}
                    onChange={e => setAnswer(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}

              {/* Text */}
              {currentQ.question_type === 'text' && (
                <textarea
                  value={getAnswer() || ''}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : current === totalQ - 1 ? (
              <><CheckCircle2 className="w-4 h-4" /> Submit</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

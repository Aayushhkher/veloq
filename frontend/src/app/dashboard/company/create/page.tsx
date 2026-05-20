'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowRight, Eye, Save, Lock, AlertTriangle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { surveyAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import { TIER_META, TierBadge, type TierKey } from '@/components/PlanSelector'

type QuestionType = 'mcq' | 'checkbox' | 'rating' | 'text' | 'scale'

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  is_required: boolean
  order: number
  min_value?: number
  max_value?: number
}

const Q_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'mcq', label: 'Multiple Choice', desc: 'Single answer' },
  { value: 'checkbox', label: 'Checkboxes', desc: 'Multiple answers' },
  { value: 'rating', label: 'Rating', desc: '1–5 stars' },
  { value: 'scale', label: 'Scale', desc: 'Numeric range' },
  { value: 'text', label: 'Text', desc: 'Free response' },
]

const CATEGORIES = ['Technology', 'Health', 'Finance', 'Education', 'Food', 'Lifestyle', 'Entertainment', 'Sports', 'Other']

function newQuestion(order: number): Question {
  return { id: crypto.randomUUID(), question_text: '', question_type: 'mcq', options: ['', ''], is_required: true, order }
}

export default function CreateSurveyPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep] = useState<'details' | 'questions' | 'preview'>('details')
  const [submitting, setSubmitting] = useState(false)

  // Derive active tier — default to pulse if none chosen
  const activeTier = (user?.subscription_tier as TierKey) || null
  const tierMeta = activeTier ? TIER_META[activeTier] : null
  const allowedTypes: string[] = tierMeta?.allowedQuestionTypes ? [...tierMeta.allowedQuestionTypes] : ['mcq']
  const minReward = tierMeta?.priceNum ?? 1

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [reward, setReward] = useState('')
  const [maxResponses, setMaxResponses] = useState('')
  const [estTime, setEstTime] = useState('5')
  const [questions, setQuestions] = useState<Question[]>([newQuestion(0)])
  const [expandedQ, setExpandedQ] = useState<string | null>(questions[0].id)

  const totalBudget = parseFloat(reward || '0') * parseInt(maxResponses || '0')
  const commission = totalBudget * 0.1
  const totalRequired = totalBudget + commission

  const addQuestion = () => {
    const q = newQuestion(questions.length)
    setQuestions(prev => [...prev, q])
    setExpandedQ(q.id)
  }

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) { toast.error('Need at least one question'); return }
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const updateQ = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const addOption = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, options: [...q.options, ''] } : q))
  }

  const updateOption = (qId: string, idx: number, val: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q))
  }

  const removeOption = (qId: string, idx: number) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q))
  }

  const validateDetails = () => {
    if (!title.trim()) { toast.error('Survey title is required'); return false }
    if (!reward || parseFloat(reward) <= 0) { toast.error('Set a reward amount'); return false }
    if (minReward > 0 && parseFloat(reward) < minReward) {
      toast.error(`Your ${tierMeta?.name || 'current'} plan requires a minimum reward of ₹${minReward}/response`)
      return false
    }
    if (!maxResponses || parseInt(maxResponses) <= 0) { toast.error('Set max responses'); return false }
    return true
  }

  const validateQuestions = () => {
    for (const q of questions) {
      if (!q.question_text.trim()) { toast.error('All questions must have text'); return false }
      if (['mcq', 'checkbox'].includes(q.question_type)) {
        const validOpts = q.options.filter(o => o.trim())
        if (validOpts.length < 2) { toast.error('MCQ/Checkbox questions need at least 2 options'); return false }
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateQuestions()) return
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        reward_per_response: parseFloat(reward),
        max_responses: parseInt(maxResponses),
        estimated_time_minutes: parseInt(estTime),
        questions: questions.map((q, i) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: ['mcq', 'checkbox'].includes(q.question_type) ? q.options.filter(o => o.trim()) : undefined,
          is_required: q.is_required,
          order: i,
          min_value: q.question_type === 'scale' ? (q.min_value ?? 1) : undefined,
          max_value: q.question_type === 'scale' ? (q.max_value ?? 10) : undefined,
        })),
      }
      await surveyAPI.createSurvey(payload)
      toast.success('Survey submitted for review!')
      router.push('/dashboard/company/surveys')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create survey')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Create Survey</h1>
            {activeTier && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[var(--text-secondary)]">Plan:</p>
                <TierBadge tier={activeTier} />
              </div>
            )}
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {(['details', 'questions', 'preview'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => s !== 'preview' && setStep(s)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${step === s ? 'bg-emerald-500 text-black' : 'bg-[var(--input-bg)] text-[var(--text-secondary)]'}`}
                >
                  {i + 1}
                </button>
                {i < 2 && <div className={`w-8 h-px ${step === 'questions' && i === 0 || step === 'preview' ? 'bg-emerald-500' : 'bg-[var(--input-bg)]'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* No tier warning banner */}
        {!activeTier && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass rounded-2xl p-4 border border-amber-500/30 bg-amber-500/[0.03] flex items-center gap-4"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No plan selected</p>
              <p className="text-xs text-[var(--text-secondary)]">Go to your dashboard and select a plan to unlock all question types and targeting options.</p>
            </div>
            <Link href="/dashboard/company" className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-2 rounded-xl transition-colors">
              Choose Plan →
            </Link>
          </motion.div>
        )}

        {/* Step 1: Survey Details */}
        {step === 'details' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-display font-semibold text-[var(--text-primary)]">Survey Details</h2>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Survey Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Customer Satisfaction Survey 2024"
                  className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all" />
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this survey about?"
                  className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50 transition-all">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Est. Time (minutes)</label>
                  <input type="number" value={estTime} onChange={e => setEstTime(e.target.value)} min="1"
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>
              </div>
            </div>

            {/* Budget section */}
            <div className="glass rounded-2xl p-6 space-y-5 border border-emerald-500/10">
              <h2 className="font-display font-semibold text-[var(--text-primary)]">Budget & Rewards</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Reward per Response (₹) *</label>
                  <input type="number" value={reward} onChange={e => setReward(e.target.value)}
                    placeholder={minReward > 0 ? `Min ₹${minReward}` : '10'}
                    min={minReward > 0 ? minReward : 1}
                    step="0.5"
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all" />
                  {tierMeta && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Min for {tierMeta.name}: ₹{minReward}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Max Responses *</label>
                  <input type="number" value={maxResponses} onChange={e => setMaxResponses(e.target.value)} placeholder="100" min="1"
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>
              </div>

              {totalBudget > 0 && (
                <div className="bg-[var(--input-bg)] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Survey budget</span>
                    <span className="text-[var(--text-primary)]">{formatCurrency(totalBudget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Platform fee (10%)</span>
                    <span className="text-[var(--text-primary)]">{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2 font-bold">
                    <span className="text-[var(--text-primary)]">Total required</span>
                    <span className="text-emerald-400">{formatCurrency(totalRequired)}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => validateDetails() && setStep('questions')}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all"
            >
              Next: Add Questions <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Questions */}
        {step === 'questions' && (
          <motion.div className="space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
              <button onClick={addQuestion} className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="glass rounded-2xl overflow-hidden border border-[var(--border)]">
                {/* Question header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--input-bg)]"
                  onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                >
                  <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">{idx + 1}</span>
                  <p className="flex-1 text-sm text-[var(--text-primary)] truncate">{q.question_text || <span className="text-[var(--text-muted)]">Untitled question</span>}</p>
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block">{Q_TYPES.find(t => t.value === q.question_type)?.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeQuestion(q.id) }} className="text-zinc-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedQ === q.id ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
                </div>

                {expandedQ === q.id && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]">
                    <div className="pt-4">
                      <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Question Text</label>
                      <textarea
                        value={q.question_text}
                        onChange={e => updateQ(q.id, { question_text: e.target.value })}
                        placeholder="Enter your question..."
                        rows={2}
                        className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Type</label>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {Q_TYPES.map(type => {
                          const locked = !allowedTypes.includes(type.value)
                          return (
                            <button
                              key={type.value}
                              onClick={() => {
                                if (locked) {
                                  toast.error(`${type.label} is not available on your current plan. Upgrade to unlock.`)
                                  return
                                }
                                updateQ(q.id, { question_type: type.value })
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                q.question_type === type.value
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : locked
                                  ? 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border)] opacity-50 cursor-not-allowed'
                                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-secondary)]'
                              }`}
                            >
                              {locked && <Lock className="w-3 h-3" />}
                              {type.label}
                            </button>
                          )
                        })}
                      </div>
                      {activeTier && allowedTypes.length < Q_TYPES.length && (
                        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                          🔒 Upgrade to <Link href="/dashboard/company" className="text-emerald-400 hover:underline">Summit</Link> to unlock all question types.
                        </p>
                      )}
                    </div>

                    {/* Options for MCQ/Checkbox */}
                    {['mcq', 'checkbox'].includes(q.question_type) && (
                      <div>
                        <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Options</label>
                        <div className="mt-1.5 space-y-2">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded${q.question_type === 'checkbox' ? '' : '-full'} border border-[var(--border-hover)] flex-shrink-0`} />
                              <input
                                value={opt}
                                onChange={e => updateOption(q.id, i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
                              />
                              {q.options.length > 2 && (
                                <button onClick={() => removeOption(q.id, i)} className="text-zinc-700 hover:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addOption(q.id)} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scale range */}
                    {q.question_type === 'scale' && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-[var(--text-secondary)]">Min value</label>
                          <input type="number" value={q.min_value ?? 1} onChange={e => updateQ(q.id, { min_value: parseInt(e.target.value) })}
                            className="mt-1 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-[var(--text-secondary)]">Max value</label>
                          <input type="number" value={q.max_value ?? 10} onChange={e => updateQ(q.id, { max_value: parseInt(e.target.value) })}
                            className="mt-1 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {/* Required toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQ(q.id, { is_required: !q.is_required })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${q.is_required ? 'bg-emerald-500' : 'bg-[var(--input-bg)]'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${q.is_required ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-xs text-[var(--text-secondary)]">Required question</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('details')} className="flex-1 glass glass-hover py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)]">
                ← Back
              </button>
              <button
                onClick={() => validateQuestions() && setStep('preview')}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-sm transition-all"
              >
                <Eye className="w-4 h-4" /> Preview & Submit
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-1">{title}</h2>
              {description && <p className="text-[var(--text-secondary)] text-sm mb-4">{description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                <span>{category || 'Uncategorized'}</span>
                <span>·</span>
                <span>{estTime} min</span>
                <span>·</span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(parseFloat(reward || '0'))} reward</span>
                <span>·</span>
                <span>{maxResponses} responses</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-semibold text-[var(--text-primary)] text-sm">{questions.length} Questions</h3>
              {questions.map((q, i) => (
                <div key={q.id} className="glass rounded-xl p-4">
                  <p className="text-sm text-[var(--text-primary)] mb-1">{i + 1}. {q.question_text}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{Q_TYPES.find(t => t.value === q.question_type)?.label} · {q.is_required ? 'Required' : 'Optional'}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.03]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Cost Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Survey budget</span><span className="text-[var(--text-primary)]">{formatCurrency(totalBudget)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Platform fee (10%)</span><span className="text-[var(--text-primary)]">{formatCurrency(commission)}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t border-[var(--border)]"><span className="text-[var(--text-primary)]">Total deducted</span><span className="text-emerald-400">{formatCurrency(totalRequired)}</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('questions')} className="flex-1 glass glass-hover py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)]">
                ← Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Submit Survey</>}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

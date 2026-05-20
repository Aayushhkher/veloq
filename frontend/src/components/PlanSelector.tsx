'use client'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Check, X, Zap, Compass, Star, ArrowRight, Minus, Sparkles, RefreshCw } from 'lucide-react'
import { companyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

// ─── Tier definitions (single source of truth) ──────────────────────────────
export const TIER_META = {
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    price: '₹3',
    priceNum: 3,
    unit: 'per response',
    tagline: 'Fast. Wide. Instant.',
    description: 'Catch the national pulse on any topic in hours.',
    cta: 'Start Fast',
    icon: Zap,
    accent: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    activeBorder: 'border-blue-500/60',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]',
    activeGlow: 'shadow-[0_0_60px_rgba(59,130,246,0.35)]',
    iconColor: 'text-blue-400',
    orbColor: 'bg-blue-500/15',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    recommended: false,
    allowedQuestionTypes: ['mcq'],
    reach: 'National (Random)',
    insights: null,
    visualProof: false,
    bestFor: 'Massive Reach',
  },
  compass: {
    id: 'compass',
    name: 'Compass',
    price: '₹10',
    priceNum: 10,
    unit: 'per response',
    tagline: 'Targeted. Regional. Real.',
    description: 'Pinpoint city and state-level audience feedback.',
    cta: 'Target Audience',
    icon: Compass,
    accent: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
    activeBorder: 'border-violet-500/60',
    glow: 'shadow-[0_0_40px_rgba(139,92,246,0.12)]',
    activeGlow: 'shadow-[0_0_60px_rgba(139,92,246,0.35)]',
    iconColor: 'text-violet-400',
    orbColor: 'bg-violet-500/15',
    badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    recommended: false,
    allowedQuestionTypes: ['mcq', 'text'],
    reach: 'City / State Targeted',
    insights: 'Scores 0–100',
    visualProof: false,
    bestFor: 'Local Feedback',
  },
  summit: {
    id: 'summit',
    name: 'Summit',
    price: '₹25+',
    priceNum: 25,
    unit: 'per response',
    tagline: 'Precision. Depth. Truth.',
    description: 'Persona-driven intelligence for decisions that matter.',
    cta: 'Go Premium',
    icon: Star,
    accent: 'from-emerald-500/25 to-teal-500/25',
    border: 'border-emerald-500/30',
    activeBorder: 'border-emerald-500/70',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.18)]',
    activeGlow: 'shadow-[0_0_80px_rgba(16,185,129,0.4)]',
    iconColor: 'text-emerald-400',
    orbColor: 'bg-emerald-500/20',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    recommended: true,
    allowedQuestionTypes: ['mcq', 'text', 'rating', 'scale', 'checkbox'],
    reach: 'Persona Targeted',
    insights: 'Long-Form Text',
    visualProof: true,
    bestFor: 'Deep Case Studies',
  },
} as const

export type TierKey = keyof typeof TIER_META

const FEATURES = [
  { label: 'Reach',          key: 'reach' as const },
  { label: 'Question Types', key: 'allowedQuestionTypes' as const, render: (v: string[]) => v.join(', ').toUpperCase() },
  { label: 'Deep Insights',  key: 'insights' as const },
  { label: 'Visual Proof',   key: 'visualProof' as const },
  { label: 'Best For',       key: 'bestFor' as const },
]

// ─── Tiny badge shown in DashboardLayout ────────────────────────────────────
export function TierBadge({ tier }: { tier: TierKey | null | undefined }) {
  if (!tier) return null
  const meta = TIER_META[tier]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.badgeColor}`}>
      <Icon className="w-3 h-3" />
      {meta.name}
    </span>
  )
}

// ─── Mini card used inline when already selected ─────────────────────────────
function MiniCard({ tier, onChangePlan }: { tier: TierKey; onChangePlan: () => void }) {
  const meta = TIER_META[tier]
  const Icon = meta.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[1.5rem] border ${meta.activeBorder} ${meta.activeGlow} bg-[var(--bg-card)] backdrop-blur-2xl p-5 flex items-center gap-5`}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.accent} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${meta.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-[var(--text-primary)] text-lg">{meta.name}</p>
          <TierBadge tier={tier} />
          {meta.recommended && (
            <span className="text-[10px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded-full">RECOMMENDED</span>
          )}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{meta.description}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Min reward: {meta.price}/response · {meta.reach}</p>
      </div>
      <button
        onClick={onChangePlan}
        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--input-bg)] hover:bg-[var(--border)] px-3 py-2 rounded-full transition-all border border-[var(--border)]"
      >
        <RefreshCw className="w-3 h-3" /> Change
      </button>
    </motion.div>
  )
}

// ─── Full Selector Card ───────────────────────────────────────────────────────
function SelectorCard({
  tier, selected, onSelect, saving,
}: {
  tier: TierKey
  selected: boolean
  onSelect: () => void
  saving: boolean
}) {
  const meta = TIER_META[tier]
  const Icon = meta.icon
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={saving}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative text-left rounded-[2rem] border overflow-hidden transition-all duration-500 w-full h-full ${
        selected
          ? `${meta.activeBorder} ${meta.activeGlow} ring-2 ring-inset ${meta.activeBorder}`
          : `${meta.border} ${meta.glow} hover:${meta.activeGlow}`
      } bg-[var(--bg-card)] backdrop-blur-2xl`}
    >
      {/* Background orb */}
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[50px] transition-all duration-700 ${meta.orbColor} ${hovered || selected ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}`} />

      {/* Recommended badge */}
      {meta.recommended && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <span className="text-[10px] font-bold bg-emerald-500 text-black px-2.5 py-1 rounded-full">BEST VALUE</span>
          </motion.div>
        </div>
      )}

      {/* Selected check */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          >
            <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.accent} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${meta.iconColor}`} />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] tracking-tight">{meta.name}</h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">{meta.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">{meta.price}</span>
          <span className="text-xs text-[var(--text-muted)] ml-1">{meta.unit}</span>
        </div>

        {/* Feature list */}
        <ul className="space-y-2.5 mb-5">
          {FEATURES.map(f => {
            const raw = meta[f.key as keyof typeof meta]
            const display = f.render ? f.render(raw as unknown as string[]) : raw
            const hasValue = display !== null && display !== false
            return (
              <li key={f.label} className="flex items-start gap-2.5 text-xs">
                {hasValue ? (
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-px bg-gradient-to-br ${meta.accent}`}>
                    <Check className={`w-2.5 h-2.5 ${meta.iconColor}`} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-px bg-[var(--input-bg)]">
                    <Minus className="w-2.5 h-2.5 text-[var(--text-muted)]" strokeWidth={2} />
                  </div>
                )}
                <span className={hasValue ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                  <span className="font-medium">{f.label}</span>
                  {hasValue && display !== true && <span className="text-[var(--text-secondary)] font-normal"> — {display as string}</span>}
                  {display === true && <span className="text-[var(--text-secondary)] font-normal"> — Enabled</span>}
                </span>
              </li>
            )
          })}
        </ul>

        {/* CTA */}
        <div className={`w-full py-3 rounded-2xl text-sm font-semibold text-center transition-all ${
          selected
            ? `bg-gradient-to-r ${meta.accent} ${meta.iconColor} border border-current`
            : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
        }`}>
          {selected ? '✓ Active Plan' : meta.cta}
        </div>
      </div>
    </motion.button>
  )
}

// ─── Main exported component ─────────────────────────────────────────────────
interface PlanSelectorProps {
  /** Called after a tier is successfully saved */
  onTierSet?: (tier: TierKey) => void
  /** Show compact "change plan" mode if tier already set */
  mode?: 'full' | 'inline'
}

export default function PlanSelector({ onTierSet, mode = 'full' }: PlanSelectorProps) {
  const { user, updateUser } = useAuthStore()
  const [selected, setSelected] = useState<TierKey | null>(
    (user?.subscription_tier as TierKey) || null
  )
  const [saving, setSaving] = useState(false)
  const [showFull, setShowFull] = useState(!user?.subscription_tier)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' })

  const handleConfirm = async () => {
    if (!selected) { toast.error('Please choose a plan first'); return }
    setSaving(true)
    try {
      const res = await companyAPI.setTier(selected)
      updateUser({ subscription_tier: selected })
      toast.success(`Plan set to ${TIER_META[selected].name}!`)
      setShowFull(false)
      onTierSet?.(selected)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to set plan')
    } finally {
      setSaving(false)
    }
  }

  // If user already has a tier and we're in inline mode, show mini card
  if (!showFull && user?.subscription_tier) {
    return (
      <MiniCard
        tier={user.subscription_tier as TierKey}
        onChangePlan={() => setShowFull(true)}
      />
    )
  }

  return (
    <div ref={sectionRef} className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        {mode === 'full' && (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Choose Your Insight Tier
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
              Select a plan to start posting surveys
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Your tier determines the question types, audience targeting, and insight depth available in every survey you create.
            </p>
          </>
        )}
        {mode === 'inline' && showFull && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Change Insight Plan</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">You can switch plans at any time. Changes apply to future surveys.</p>
            </div>
            <button onClick={() => setShowFull(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancel
            </button>
          </div>
        )}
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(['pulse', 'compass', 'summit'] as TierKey[]).map((tier, i) => (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <SelectorCard
              tier={tier}
              selected={selected === tier}
              onSelect={() => setSelected(tier)}
              saving={saving}
            />
          </motion.div>
        ))}
      </div>

      {/* Confirm button */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.55)]"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Confirm — {TIER_META[selected].name} Plan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

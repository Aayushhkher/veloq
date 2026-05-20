'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Check, X, Zap, Compass, TrendingUp, Star, ArrowRight, Minus } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────
const tiers = [
  {
    id: 'pulse',
    name: 'Pulse',
    price: '₹3',
    unit: 'per response',
    tagline: 'Fast. Wide. Instant.',
    description: 'Catch the national pulse on any topic in hours.',
    cta: 'Start Fast',
    ctaHref: '/auth/register?role=company&tier=pulse',
    icon: Zap,
    accent: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]',
    hoverGlow: 'hover:shadow-[0_0_60px_rgba(59,130,246,0.25)]',
    iconColor: 'text-blue-400',
    orbColor: 'bg-blue-500/10',
    recommended: false,
  },
  {
    id: 'summit',
    name: 'Summit',
    price: '₹25+',
    unit: 'per response',
    tagline: 'Precision. Depth. Truth.',
    description: 'Persona-driven intelligence for decisions that matter.',
    cta: 'Go Premium',
    ctaHref: '/auth/register?role=company&tier=summit',
    icon: Star,
    accent: 'from-emerald-500/25 to-teal-500/25',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.2)]',
    hoverGlow: 'hover:shadow-[0_0_80px_rgba(16,185,129,0.35)]',
    iconColor: 'text-emerald-400',
    orbColor: 'bg-emerald-500/15',
    recommended: true,
  },
  {
    id: 'compass',
    name: 'Compass',
    price: '₹10',
    unit: 'per response',
    tagline: 'Targeted. Regional. Real.',
    description: 'Pinpoint city and state-level audience feedback.',
    cta: 'Target Audience',
    ctaHref: '/auth/register?role=company&tier=compass',
    icon: Compass,
    accent: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
    glow: 'shadow-[0_0_40px_rgba(139,92,246,0.12)]',
    hoverGlow: 'hover:shadow-[0_0_60px_rgba(139,92,246,0.25)]',
    iconColor: 'text-violet-400',
    orbColor: 'bg-violet-500/10',
    recommended: false,
  },
]

// Ordered for display: Pulse | Summit (center) | Compass
const displayOrder = ['pulse', 'summit', 'compass']
const orderedTiers = displayOrder.map(id => tiers.find(t => t.id === id)!)

const features = [
  {
    label: 'Reach',
    values: {
      pulse: 'National (Random)',
      compass: 'City / State',
      summit: 'Persona Targeted',
    },
  },
  {
    label: 'Question Types',
    values: {
      pulse: 'MCQ Only',
      compass: 'MCQ + Short Answer',
      summit: 'All Formats',
    },
  },
  {
    label: 'Deep Insights',
    values: {
      pulse: null,
      compass: 'Scores 0–100',
      summit: 'Long-Form Text',
    },
  },
  {
    label: 'Visual Proof',
    values: {
      pulse: null,
      compass: null,
      summit: 'Photo Uploads',
    },
  },
  {
    label: 'Best For',
    values: {
      pulse: 'Massive Reach',
      compass: 'Local Feedback',
      summit: 'Deep Case Studies',
    },
  },
]

// ─── Animated Check ──────────────────────────────────────────────────────────
function FeatureValue({ value, accent }: { value: string | null; accent: string }) {
  if (value === null) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-[var(--text-muted)]" />
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
      <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </motion.div>
  )
}

// ─── Mouse Glow ──────────────────────────────────────────────────────────────
function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-white/[0.04] blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: springX, top: springY }}
      />
    </div>
  )
}

// ─── Pricing Card ────────────────────────────────────────────────────────────
function PricingCard({ tier, index }: { tier: typeof orderedTiers[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState(false)
  const Icon = tier.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col ${tier.recommended ? 'md:-mt-6 md:mb-6 z-10' : 'z-0'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Recommended badge */}
      {tier.recommended && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold tracking-wide shadow-[0_4px_20px_rgba(16,185,129,0.5)]">
            <Star className="w-3 h-3 fill-black" />
            RECOMMENDED
          </div>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        animate={hovered ? { y: -6 } : { y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative flex flex-col h-full rounded-[2rem] border bg-[var(--bg-card)] backdrop-blur-2xl transition-all duration-500 overflow-hidden ${tier.border} ${tier.glow} ${tier.hoverGlow} ${tier.recommended ? 'ring-1 ring-emerald-500/30' : ''}`}
      >
        {/* Gradient orb inside card */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] transition-all duration-700 ${tier.orbColor} ${hovered ? 'scale-125 opacity-100' : 'scale-100 opacity-60'}`} />

        {/* Animated border glow for recommended */}
        {tier.recommended && (
          <div className="absolute inset-0 rounded-[2rem] pointer-events-none">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-[2rem] border border-emerald-500/40"
            />
          </div>
        )}

        <MouseGlow />

        <div className="relative z-10 p-8 flex flex-col h-full">
          {/* Icon + Name */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tier.accent} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${tier.iconColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[var(--text-primary)] tracking-tight">{tier.name}</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">{tier.tagline}</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tighter">{tier.price}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{tier.unit}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 flex-1">{tier.description}</p>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((f) => {
              const val = f.values[tier.id as keyof typeof f.values]
              return (
                <li key={f.label} className="flex items-center gap-3">
                  {val !== null ? (
                    <motion.div
                      animate={hovered ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tier.accent}`}
                    >
                      <Check className={`w-3 h-3 ${tier.iconColor}`} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--input-bg)]">
                      <X className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={2.5} />
                    </div>
                  )}
                  <span className={`text-sm ${val !== null ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    <span className="font-medium">{f.label}</span>
                    {val && <span className="text-[var(--text-secondary)] font-normal"> — {val}</span>}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* CTA */}
          <Link href={tier.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                tier.recommended
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_4px_24px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.6)]'
                  : 'bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
            >
              {tier.cta}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Comparison Table ────────────────────────────────────────────────────────
function ComparisonTable() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-20 overflow-x-auto scrollbar-hidden"
    >
      <div className="min-w-[640px]">
        <div className="glass rounded-[2rem] overflow-hidden border border-[var(--border)]">
          {/* Header */}
          <div className="grid grid-cols-4 bg-[var(--input-bg)]">
            <div className="px-6 py-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Feature</div>
            {(['pulse', 'compass', 'summit'] as const).map((id) => {
              const tier = tiers.find(t => t.id === id)!
              const Icon = tier.icon
              return (
                <div key={id} className={`px-6 py-5 text-center ${tier.recommended ? 'bg-emerald-500/10' : ''}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Icon className={`w-4 h-4 ${tier.iconColor}`} />
                    <span className={`text-sm font-bold ${tier.recommended ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>{tier.name}</span>
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${tier.recommended ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{tier.price}</div>
                </div>
              )
            })}
          </div>

          {/* Rows */}
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`grid grid-cols-4 border-t border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-[var(--bg-card)]'}`}
            >
              <div className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">{f.label}</div>
              {(['pulse', 'compass', 'summit'] as const).map((id) => {
                const tier = tiers.find(t => t.id === id)!
                const val = f.values[id]
                return (
                  <div key={id} className={`px-6 py-4 flex items-center justify-center ${tier.recommended ? 'bg-emerald-500/5' : ''}`}>
                    <FeatureValue value={val} accent={tier.accent} />
                  </div>
                )
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Floating Orbs (Background) ───────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-emerald-500/8 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-blue-500/8 blur-[100px] rounded-full"
      />
      <motion.div
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-violet-500/6 blur-[80px] rounded-full"
      />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.025] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function PricingSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-32 px-6 overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      <FloatingOrbs />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-6 tracking-wider uppercase"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Insight Tiers
          </motion.div>

          <motion.h2
            id="pricing-heading"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-[var(--text-primary)] mb-6 leading-[1.05]"
          >
            Choose the Right
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500">
              Insight Tier
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-light leading-relaxed"
          >
            Scale from rapid public opinions to deep persona-driven market intelligence.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {orderedTiers.map((tier, i) => (
            <PricingCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>

        {/* Comparison table */}
        <ComparisonTable />

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 text-center"
        >
          <p className="text-[var(--text-muted)] text-sm">
            All tiers include KYC-verified respondents, real-time dashboards, and DPDP Act compliance.{' '}
            <Link href="/auth/register?role=company" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 transition-colors">
              Start for free →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

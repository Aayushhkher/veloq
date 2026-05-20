'use client'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet'
  delay?: number
}

const colorMap = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', glow: 'shadow-blue-500/10' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', glow: 'shadow-amber-500/10' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: 'text-rose-400', glow: 'shadow-rose-500/10' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400', glow: 'shadow-violet-500/10' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'emerald', delay = 0 }: StatCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      className={cn('glass rounded-2xl p-5 border', c.border, `shadow-xl ${c.glow}`)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-lg',
            trend.value >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div className="font-display text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-zinc-500">{title}</div>
      {subtitle && <div className="text-xs text-zinc-600 mt-1">{subtitle}</div>}
    </motion.div>
  )
}

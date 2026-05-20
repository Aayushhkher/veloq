'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, Users, ArrowRight, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SurveyCardProps {
  survey: {
    id: number
    title: string
    description?: string
    category?: string
    reward_per_response: number
    max_responses: number
    current_responses: number
    estimated_time_minutes: number
    company_name?: string
  }
  delay?: number
}

export default function SurveyCard({ survey, delay = 0 }: SurveyCardProps) {
  const progress = (survey.current_responses / survey.max_responses) * 100
  const spotsLeft = survey.max_responses - survey.current_responses

  return (
    <motion.div
      className="glass glass-hover rounded-2xl p-5 border border-white/[0.06] group cursor-pointer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {survey.category && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-white/[0.05] px-2 py-0.5 rounded-md mb-2">
              {survey.category}
            </span>
          )}
          <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors">
            {survey.title}
          </h3>
        </div>
        <div className="flex-shrink-0 ml-3 text-right">
          <div className="font-display font-bold text-emerald-400 text-lg">{formatCurrency(survey.reward_per_response)}</div>
          <div className="text-[10px] text-zinc-600">per response</div>
        </div>
      </div>

      {survey.description && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{survey.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {survey.estimated_time_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {spotsLeft} spots left
        </span>
        {survey.company_name && (
          <span className="flex items-center gap-1 ml-auto text-zinc-600 truncate">
            by {survey.company_name}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-zinc-600 mb-1.5">
          <span>{survey.current_responses} completed</span>
          <span>{Math.round(progress)}% filled</span>
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        href={`/dashboard/surveys/${survey.id}`}
        className="flex items-center justify-center gap-2 w-full bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-black font-semibold py-2.5 rounded-xl text-sm transition-all group/btn"
      >
        Start Survey
        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  )
}

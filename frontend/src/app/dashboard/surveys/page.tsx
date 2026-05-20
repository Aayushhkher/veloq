'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SurveyCard from '@/components/survey/SurveyCard'
import { surveyAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Technology', 'Health', 'Finance', 'Education', 'Food', 'Lifestyle', 'Entertainment', 'Sports']

export default function BrowseSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'reward' | 'time' | 'newest'>('newest')

  useEffect(() => {
    loadSurveys()
  }, [category])

  const loadSurveys = async () => {
    setLoading(true)
    try {
      const res = await surveyAPI.getAvailable(0, 50, category === 'All' ? undefined : category)
      setSurveys(res.data)
    } catch {
      toast.error('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const filtered = surveys
    .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'reward') return b.reward_per_response - a.reward_per_response
      if (sortBy === 'time') return a.estimated_time_minutes - b.estimated_time_minutes
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-1">Browse Surveys</h1>
          <p className="text-[var(--text-secondary)] text-sm">{surveys.length} surveys available to complete</p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surveys..."
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="newest">Newest</option>
              <option value="reward">Highest Reward</option>
              <option value="time">Quickest</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Filter className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] font-medium">No surveys found</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Try changing your filters or check back later</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((survey, i) => (
              <SurveyCard key={survey.id} survey={survey} delay={i * 0.03} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

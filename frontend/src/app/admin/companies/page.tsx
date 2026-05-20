'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/companies').then(res => setCompanies(res.data))
      .catch(() => {
        // fallback: derive from users with company role
        toast.error('Failed to load companies')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Companies</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{companies.length} registered companies</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">No companies found</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Company', 'Industry', 'Balance', 'Deposited', 'Spent', 'Joined', 'Verified'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((company, i) => (
                  <motion.tr
                    key={company.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--input-bg)] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-xs font-bold text-blue-400">{company.company_name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{company.company_name}</p>
                          {company.website && (
                            <a href={company.website} target="_blank" className="text-xs text-[var(--text-muted)] hover:text-emerald-400 transition-colors truncate block max-w-[140px]">
                              {company.website.replace(/https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{company.industry || '—'}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400 font-medium">{formatCurrency(company.wallet_balance)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{formatCurrency(company.total_deposited)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{formatCurrency(company.total_spent)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDate(company.created_at)}</td>
                    <td className="px-4 py-3">
                      {company.is_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

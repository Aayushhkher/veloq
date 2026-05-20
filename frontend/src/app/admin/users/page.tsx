'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserCheck, UserX, Shield } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminAPI } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    adminAPI.getUsers()
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (userId: number) => {
    setActionLoading(userId)
    try {
      const res = await adminAPI.toggleUserStatus(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      toast.success('User status updated')
    } catch { toast.error('Failed to update') }
    finally { setActionLoading(null) }
  }

  const filtered = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Users</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">{users.length} total users</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['User', 'Role', 'Balance', 'Earned', 'Surveys', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--text-secondary)]">Loading...</td></tr>
              ) : filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--input-bg)] transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-emerald-400">{user.full_name[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{user.full_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${
                      user.role === 'admin' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' :
                      user.role === 'company' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                      'text-[var(--text-secondary)] bg-zinc-500/10 border-zinc-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{formatCurrency(user.wallet_balance)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{formatCurrency(user.total_earned)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{user.surveys_completed}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${user.is_active ? getStatusColor('active') : getStatusColor('rejected')}`}>
                      {user.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleToggle(user.id)}
                        disabled={actionLoading === user.id}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 ${
                          user.is_active
                            ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                      >
                        {actionLoading === user.id
                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : user.is_active ? <><UserX className="w-3 h-3" /> Ban</> : <><UserCheck className="w-3 h-3" /> Unban</>
                        }
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { userAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, formatDateTime, getStatusColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function WalletPage() {
  const { user, updateUser } = useAuthStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [upiId, setUpiId] = useState(user?.upi_id || '')
  const [withdrawing, setWithdrawing] = useState(false)
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions')

  useEffect(() => {
    const load = async () => {
      try {
        const [txnsRes, wdRes, profileRes] = await Promise.all([
          userAPI.getTransactions(0, 50),
          userAPI.getWithdrawals(),
          userAPI.getProfile(),
        ])
        setTransactions(txnsRes.data)
        setWithdrawals(wdRes.data)
        updateUser(profileRes.data)
      } catch { toast.error('Failed to load wallet') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (!upiId.trim()) { toast.error('Enter your UPI ID'); return }

    setWithdrawing(true)
    try {
      await userAPI.requestWithdrawal(amount, upiId.trim())
      toast.success('Withdrawal request submitted!')
      setShowWithdraw(false)
      setWithdrawAmount('')
      // Refresh
      const [txnsRes, wdRes, profileRes] = await Promise.all([
        userAPI.getTransactions(0, 50),
        userAPI.getWithdrawals(),
        userAPI.getProfile(),
      ])
      setTransactions(txnsRes.data)
      setWithdrawals(wdRes.data)
      updateUser(profileRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const txnIcon = (type: string, amount: number) => {
    if (type === 'survey_reward') return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
    if (type === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-400" />
    if (type === 'refund') return <ArrowDownLeft className="w-4 h-4 text-blue-400" />
    return <Wallet className="w-4 h-4 text-[var(--text-secondary)]" />
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Wallet</h1>

        {/* Balance card */}
        <motion.div
          className="glass rounded-2xl p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Available Balance</p>
            <div className="font-display text-5xl font-bold text-[var(--text-primary)] mb-1">
              {formatCurrency(user?.wallet_balance || 0)}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Total earned: <span className="text-emerald-400 font-medium">{formatCurrency(user?.total_earned || 0)}</span>
            </p>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={(user?.wallet_balance || 0) < 100}
              className="mt-6 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl text-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw to UPI
            </button>
            {(user?.wallet_balance || 0) < 100 && (
              <p className="mt-2 text-xs text-[var(--text-muted)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Minimum withdrawal is ₹100
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Surveys Completed', value: user?.surveys_completed || 0 },
            { label: 'Total Withdrawn', value: formatCurrency(withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.amount, 0)) },
            { label: 'Pending Withdrawal', value: formatCurrency(withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)) },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className="font-display font-bold text-[var(--text-primary)] text-lg">{stat.value}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 w-fit">
          {(['transactions', 'withdrawals'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-[var(--input-bg)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {tab === 'transactions' && (
          <div className="glass rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-[var(--text-secondary)]">No transactions yet</p>
              </div>
            ) : (
              transactions.map((txn, i) => (
                <div key={txn.id} className={`flex items-center gap-4 px-5 py-4 ${i < transactions.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {txnIcon(txn.transaction_type, txn.amount)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{txn.description}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{timeAgo(txn.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${txn.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">bal: {formatCurrency(txn.balance_after)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div className="glass rounded-2xl overflow-hidden">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <ArrowUpRight className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-[var(--text-secondary)]">No withdrawal requests</p>
              </div>
            ) : (
              withdrawals.map((wd, i) => (
                <div key={wd.id} className={`flex items-center gap-4 px-5 py-4 ${i < withdrawals.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">Withdrawal to {wd.upi_id}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{timeAgo(wd.requested_at)}</p>
                    {wd.admin_notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{wd.admin_notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(wd.amount)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(wd.status)}`}>
                      {wd.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass rounded-2xl p-6 w-full max-w-md border border-[var(--border)]"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-[var(--text-primary)] text-lg">Withdraw Funds</h2>
                <button onClick={() => setShowWithdraw(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="100"
                    max={user?.wallet_balance}
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">Available: {formatCurrency(user?.wallet_balance || 0)} · Min: ₹100</p>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <div className="glass rounded-xl p-4 text-xs text-[var(--text-secondary)] border border-[var(--border)]">
                  <p className="font-medium text-[var(--text-secondary)] mb-1">Processing time</p>
                  <p>Withdrawals are typically processed within 1-2 business days after admin approval.</p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all"
                >
                  {withdrawing ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Submit Withdrawal Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

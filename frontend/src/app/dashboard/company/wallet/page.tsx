'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, CreditCard } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { companyAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, initiateRazorpayPayment } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000]

export default function CompanyWalletPage() {
  const { user } = useAuthStore()
  const [company, setCompany] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    companyAPI.getProfile()
      .then(res => setCompany(res.data))
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeposit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { toast.error('Minimum deposit is ₹100'); return }

    setPaying(true)
    try {
      const orderRes = await companyAPI.createOrder(amt)
      const { order_id, key } = orderRes.data

      await initiateRazorpayPayment({
        orderId: order_id,
        amount: amt,
        keyId: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        name: company?.company_name || 'VeLOQ',
        description: 'Wallet Top-up',
        prefill: { name: user?.full_name, email: user?.email },
        onSuccess: async (data) => {
          try {
            await companyAPI.verifyPayment({
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            })
            toast.success(`₹${amt} added to your wallet!`)
            setAmount('')
            const refreshed = await companyAPI.getProfile()
            setCompany(refreshed.data)
          } catch {
            toast.error('Payment verification failed')
          } finally {
            setPaying(false)
          }
        },
        onFailure: (err) => {
          if (err.message !== 'Payment cancelled') toast.error('Payment failed')
          setPaying(false)
        },
      })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
      setPaying(false)
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Wallet & Billing</h1>

        {/* Balance card */}
        <motion.div
          className="glass rounded-2xl p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Company Wallet</p>
            <div className="font-display text-5xl font-bold text-[var(--text-primary)] mb-4">
              {formatCurrency(company?.wallet_balance || 0)}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-[var(--text-muted)] text-xs">Total deposited</p>
                <p className="text-[var(--text-secondary)] font-medium">{formatCurrency(company?.total_deposited || 0)}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs">Total spent</p>
                <p className="text-[var(--text-secondary)] font-medium">{formatCurrency(company?.total_spent || 0)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deposit card */}
        <motion.div
          className="glass rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display font-semibold text-[var(--text-primary)]">Add Funds</h2>
          </div>

          {/* Preset amounts */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Quick Select</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    amount === preset.toString()
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-zinc-200'
                  }`}
                >
                  ₹{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Custom Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount (min ₹100)"
              min="100"
              className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="glass rounded-xl p-4 text-xs text-[var(--text-secondary)] space-y-1.5 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Secure payment via Razorpay
            </div>
            <p>• UPI, Cards, Net Banking, Wallets accepted</p>
            <p>• Funds credited instantly after payment</p>
            <p>• Platform fee of 10% applies when creating surveys</p>
          </div>

          <button
            onClick={handleDeposit}
            disabled={paying || !amount || parseFloat(amount) < 100}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            {paying ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <><Plus className="w-4 h-4" /> Add {amount ? formatCurrency(parseFloat(amount)) : 'Funds'}</>
            )}
          </button>
        </motion.div>

        {/* Info card */}
        <motion.div
          className="glass rounded-2xl p-5 text-sm text-[var(--text-secondary)] space-y-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <p className="font-medium text-[var(--text-secondary)]">How billing works</p>
          <p>When you create a survey, the total budget (reward × responses) plus a 10% platform fee is reserved from your wallet. Unused budget from rejected or incomplete surveys is refunded.</p>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

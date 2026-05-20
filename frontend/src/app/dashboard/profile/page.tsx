'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, CreditCard, Save, Shield, Download, Trash2, Bell, BellOff, CheckCircle2, AlertCircle, FileText, Eye, Lock, ShieldCheck } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { userAPI, api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'privacy' | 'kyc' | 'tds'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: (user as any)?.phone || '', upi_id: user?.upi_id || '' })
  const [kycForm, setKycForm] = useState({ pan_number: '', pan_name: '', date_of_birth: '' })
  const [kycStatus, setKycStatus] = useState<any>(null)
  const [tdsStatus, setTdsStatus] = useState<any>(null)
  const [consents, setConsents] = useState<any>(null)
  const [marketingOpt, setMarketingOpt] = useState(false)

  useEffect(() => {
    api.get('/compliance/kyc/status').then(r => setKycStatus(r.data)).catch(() => {})
    api.get('/compliance/tds/status').then(r => setTdsStatus(r.data)).catch(() => {})
    api.get('/compliance/consent').then(r => { setConsents(r.data); setMarketingOpt(r.data.marketing_consent) }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try { const r = await userAPI.updateProfile(form); updateUser(r.data); toast.success('Profile updated!') }
    catch (e: any) { toast.error(e.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleExport = async () => {
    try {
      const r = await api.get('/compliance/data/export', { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'my_veloq_data.json'; a.click()
      toast.success('Data export downloaded!')
    } catch { toast.error('Export failed') }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/compliance/account/delete')
      toast.success('Account deleted. Goodbye!')
      logout(); router.push('/')
    } catch { toast.error('Deletion failed') } finally { setDeleting(false) }
  }

  const handleMarketingToggle = async () => {
    try {
      await api.patch('/compliance/consent/marketing', { marketing: !marketingOpt })
      setMarketingOpt(!marketingOpt)
      toast.success(`Marketing ${!marketingOpt ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Failed to update consent') }
  }

  const handleKycSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/compliance/kyc/submit', kycForm)
      const r = await api.get('/compliance/kyc/status'); setKycStatus(r.data)
      toast.success('KYC verified successfully!')
    } catch (e: any) { toast.error(e.response?.data?.detail || 'KYC failed') } finally { setSaving(false) }
  }

  const handleTdsCert = async () => {
    try {
      const r = await api.get('/compliance/tds/certificate', { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'Form16A_TDS.json'; a.click()
    } catch { toast.error('Certificate not available') }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy Portal', icon: Shield },
    { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
    { id: 'tds', label: 'TDS & Tax', icon: FileText },
  ] as const

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Account Settings</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your profile, privacy, and compliance data</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 glass rounded-xl">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-500 text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar_url ? <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-emerald-400">{user?.full_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <p className="font-display font-bold text-[var(--text-primary)] text-lg">{user?.full_name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs badge-emerald px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
                  {(user as any)?.kyc_status === 'verified' && <span className="inline-flex items-center gap-1 text-xs badge-blue px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" />KYC Verified</span>}
                  {(user as any)?.is_phone_verified && <span className="inline-flex items-center gap-1 text-xs badge-violet px-2 py-0.5 rounded-full">Phone Verified</span>}
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-display font-semibold text-[var(--text-primary)]">Personal Information</h2>
              {[{ label: 'Full Name', icon: User, key: 'full_name', placeholder: 'Your full name' }, { label: 'Phone', icon: Phone, key: 'phone', placeholder: '+91 98765 43210' }, { label: 'UPI ID (for withdrawals)', icon: CreditCard, key: 'upi_id', placeholder: 'yourname@okicici' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium flex items-center gap-1.5"><f.icon className="w-3.5 h-3.5" />{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60 transition-all" />
                </div>
              ))}
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all">
                {saving ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Privacy Portal Tab ── */}
        {tab === 'privacy' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-400" /></div>
                <div><h2 className="font-display font-semibold text-[var(--text-primary)]">Your Data Rights (DPDP Act 2023)</h2><p className="text-xs text-[var(--text-secondary)]">Control your personal data on this platform</p></div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Download data */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3"><Download className="w-4 h-4 text-blue-400" /></div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Download My Data</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">Export all your personal data, transactions, and survey responses as a JSON file.</p>
                  <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm badge-blue font-medium transition-all hover:bg-blue-500/20">
                    <Download className="w-4 h-4" />Download Data
                  </button>
                </div>

                {/* Marketing opt-out */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    {marketingOpt ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4 text-amber-400" />}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Marketing Consent</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">Control whether you receive survey recommendations and promotional emails.</p>
                  <button onClick={handleMarketingToggle} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${marketingOpt ? 'badge-amber hover:bg-amber-500/20' : 'badge-zinc hover:bg-zinc-500/10'}`}>
                    {marketingOpt ? <><Bell className="w-4 h-4" />Opt Out</> : <><BellOff className="w-4 h-4" />Opt In</>}
                  </button>
                </div>
              </div>

              {/* Consent history */}
              {consents?.consents?.length > 0 && (
                <div className="border-t border-[var(--border)] pt-5">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-3">Consent History</h3>
                  <div className="space-y-2">
                    {consents.consents.map((c: any) => (
                      <div key={c.type} className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span className="capitalize">{c.type.replace(/_/g, ' ')}</span>
                        <span className={c.granted ? 'text-emerald-400' : 'text-red-400'}>{c.granted ? 'Granted' : 'Withdrawn'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Delete account */}
            <div className="glass rounded-2xl p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">Delete Account</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Permanently delete your account and all personal data. Your data will be anonymized immediately. This action cannot be undone (Right to Erasure — DPDP Act Section 12).</p>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm badge-red font-medium hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />Request Account Deletion
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-400 font-medium">⚠️ This will delete all your data. Are you sure?</p>
                      <div className="flex gap-3">
                        <button onClick={handleDeleteAccount} disabled={deleting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-red-500 hover:bg-red-400 text-[var(--text-primary)] font-bold transition-all disabled:opacity-50">
                          {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Delete My Account'}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── KYC Tab ── */}
        {tab === 'kyc' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kycStatus?.pan_verified ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <ShieldCheck className={`w-6 h-6 ${kycStatus?.pan_verified ? 'text-emerald-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-[var(--text-primary)]">KYC Verification</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Required before withdrawals above ₹10,000 (PMLA 2002)</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${kycStatus?.pan_verified ? 'badge-emerald' : 'badge-amber'}`}>
                    {kycStatus?.pan_verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              {kycStatus?.pan_verified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-400">KYC Successfully Verified</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">PAN: {kycStatus.pan_number} · Verified {kycStatus.verified_at ? new Date(kycStatus.verified_at).toLocaleDateString('en-IN') : ''}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--text-secondary)]">KYC is required to withdraw earnings. Enter your PAN card details below (Section 139A, Income Tax Act).</p>
                  </div>
                  {[{ label: 'PAN Number', key: 'pan_number', placeholder: 'ABCDE1234F' }, { label: 'Name as on PAN', key: 'pan_name', placeholder: 'Full legal name' }, { label: 'Date of Birth', key: 'date_of_birth', placeholder: 'DD/MM/YYYY' }].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">{f.label}</label>
                      <input
                        value={(kycForm as any)[f.key]}
                        onChange={e => setKycForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="mt-1.5 w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60 transition-all"
                      />
                    </div>
                  ))}
                  <button onClick={handleKycSubmit} disabled={saving || !kycForm.pan_number || !kycForm.pan_name} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all">
                    {saving ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><ShieldCheck className="w-4 h-4" />Verify KYC</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TDS Tab ── */}
        {tab === 'tds' && (
          <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold text-[var(--text-primary)] mb-5">TDS Status — {tdsStatus?.financial_year}</h2>
              {tdsStatus && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Income (FY)', value: `₹${(tdsStatus.total_income || 0).toFixed(2)}` },
                      { label: 'TDS Threshold', value: `₹${(tdsStatus.tds_threshold || 30000).toFixed(0)}` },
                      { label: 'TDS Rate', value: `${tdsStatus.tds_rate || 10}%` },
                      { label: 'TDS Amount', value: `₹${(tdsStatus.tds_amount || 0).toFixed(2)}` },
                      { label: 'Amount Held', value: `₹${(tdsStatus.tds_held || 0).toFixed(2)}` },
                      { label: 'Status', value: tdsStatus.status?.replace(/_/g, ' ') || 'Below Threshold' },
                    ].map(s => (
                      <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">{s.label}</p>
                        <p className="font-bold text-[var(--text-primary)]">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                      <span>Progress to TDS threshold</span>
                      <span>{Math.min(100, Math.round(((tdsStatus.total_income || 0) / (tdsStatus.tds_threshold || 30000)) * 100))}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${tdsStatus.total_income >= tdsStatus.tds_threshold ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, ((tdsStatus.total_income || 0) / (tdsStatus.tds_threshold || 30000)) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">About TDS on Survey Income</p>
                    <p>Under Section 194-O of the Income Tax Act, TDS at 10% is applicable when your annual income on this platform exceeds ₹30,000. VeLOQ deducts TDS before processing your withdrawal.</p>
                  </div>

                  {tdsStatus.certificate_available && (
                    <button onClick={handleTdsCert} className="flex items-center gap-2 badge-blue px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-all">
                      <Download className="w-4 h-4" />Download Form 16A (TDS Certificate)
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

'use client'
import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, TrendingUp, ArrowRight, Users, Building2, Shield } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'company']),
})
type FormData = z.infer<typeof schema>

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  const defaultRole = (searchParams.get('role') as 'user' | 'company') || 'user'

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  })

  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    if (!consentChecked) {
      toast.error('Please agree to the Terms & Privacy Policy')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      const { access_token, user } = res.data
      setAuth(user, access_token)
      localStorage.setItem('consent_given', '1')

      if (user.role === 'company') router.push('/dashboard/company')
      else router.push('/dashboard')

      toast.success(`Welcome to VeLOQ, ${user.full_name.split(' ')[0]}!`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
      
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--text-primary)] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-[440px]"
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="w-12 h-12 rounded-full bg-[var(--text-primary)] flex items-center justify-center mb-6 shadow-apple-md hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-[var(--bg-primary)]" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Create Account</h1>
          <p className="text-[var(--text-secondary)] text-sm">Join the new standard in market research.</p>
        </div>

        <div className="bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border)] p-8 rounded-[2.5rem] shadow-apple-glass">
          
          {/* Role toggle */}
          <div className="flex bg-[var(--input-bg)] p-1.5 rounded-full mb-8 relative border border-[var(--border)]" role="group">
            <div 
              className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-[var(--bg-primary)] rounded-full shadow-apple-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" 
              style={{ transform: role === 'company' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {[
              { value: 'user', label: 'Earn Money' },
              { value: 'company', label: 'Get Insights' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('role', opt.value as any)}
                className={`relative z-10 flex-1 py-3 text-sm font-semibold rounded-full transition-colors ${role === opt.value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <input
                {...register('full_name')}
                placeholder={role === 'company' ? 'Company Name' : 'Full Name'}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] focus:bg-[var(--bg-primary)] transition-all"
              />
              {errors.full_name && <p className="mt-2 text-xs text-red-400 pl-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email Address"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] focus:bg-[var(--bg-primary)] transition-all"
              />
              {errors.email && <p className="mt-2 text-xs text-red-400 pl-1">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                placeholder="Password (Min 8 characters)"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl px-5 py-4 pr-12 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] focus:bg-[var(--bg-primary)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && <p className="mt-2 text-xs text-red-400 pl-1">{errors.password.message}</p>}
            </div>

            {/* DPDP Consent */}
            <div className="flex items-start gap-3 px-1 pt-2 pb-2">
              <input
                id="consent"
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[var(--border)] accent-[var(--text-primary)] cursor-pointer flex-shrink-0"
              />
              <label htmlFor="consent" className="text-xs text-[var(--text-secondary)] leading-tight cursor-pointer">
                I agree to the{' '}
                <Link href="/terms" className="text-[var(--text-primary)] underline underline-offset-2">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[var(--text-primary)] underline underline-offset-2">Privacy Policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !consentChecked}
              className="w-full flex items-center justify-center gap-2 bg-[var(--text-primary)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[var(--bg-primary)] font-medium py-4 mt-2 rounded-full transition-all text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--text-primary)] font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>

      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

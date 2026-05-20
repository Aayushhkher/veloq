'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, TrendingUp, ArrowRight } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      const { access_token, user } = res.data
      setAuth(user, access_token)

      if (user.role === 'admin') router.push('/admin')
      else if (user.role === 'company') router.push('/dashboard/company')
      else router.push('/dashboard')

      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const res = await authAPI.getGoogleUrl()
      window.location.href = res.data.url
    } catch {
      toast.error('Failed to initiate Google login')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--text-primary)] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-[400px]"
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="w-12 h-12 rounded-full bg-[var(--text-primary)] flex items-center justify-center mb-6 shadow-apple-md hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-[var(--bg-primary)]" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Welcome back</h1>
          <p className="text-[var(--text-secondary)] text-sm">Enter your details to sign in.</p>
        </div>

        <div className="bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border)] p-8 rounded-[2rem] shadow-apple-glass">
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors rounded-full py-3.5 text-sm font-medium text-[var(--text-primary)] mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email address"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] focus:bg-[var(--bg-primary)] transition-all"
              />
              {errors.email && <p className="mt-2 text-xs text-red-400 pl-1">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--text-primary)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--bg-primary)] font-medium py-4 mt-2 rounded-full transition-all text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-[var(--text-primary)] font-medium hover:underline underline-offset-4">
            Create one now
          </Link>
        </p>

      </motion.div>
    </div>
  )
}

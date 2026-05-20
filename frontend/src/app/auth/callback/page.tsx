'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { TrendingUp } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      toast.error('OAuth failed: no code')
      router.push('/auth/login')
      return
    }

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`
        const res = await authAPI.googleAuth(code, redirectUri)
        const { access_token, user } = res.data
        setAuth(user, access_token)

        if (user.role === 'admin') router.push('/admin')
        else if (user.role === 'company') router.push('/dashboard/company')
        else router.push('/dashboard')

        toast.success(`Welcome, ${user.full_name.split(' ')[0]}!`)
      } catch {
        toast.error('Google login failed')
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] flex items-center justify-center mx-auto mb-6 shadow-apple-sm">
        <TrendingUp className="w-6 h-6 text-[var(--bg-primary)]" />
      </div>
      <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[var(--text-secondary)] text-sm font-medium">Authenticating...</p>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center font-sans">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin mx-auto" />
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
